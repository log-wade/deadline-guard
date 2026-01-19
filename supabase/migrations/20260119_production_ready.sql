-- ============================================
-- DEADLINEGUARD PRODUCTION-READY MIGRATION
-- ============================================

-- ============================================
-- 1. UPDATE DEADLINE CATEGORIES FOR A/E/C
-- ============================================

-- Drop the old enum and create expanded one
-- Note: In production, you'd use ALTER TYPE ADD VALUE, but for clarity:

-- First, let's add the new categories we need
-- We'll keep the existing enum and add a subcategory field for granularity

ALTER TABLE public.deadlines 
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Add a notes/instructions field for renewal instructions
ALTER TABLE public.deadlines
ADD COLUMN IF NOT EXISTS renewal_instructions TEXT;

-- Add estimated cost field (for insurance premiums, license fees, etc.)
ALTER TABLE public.deadlines
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);

-- Add reference number field (license #, policy #, permit #, etc.)
ALTER TABLE public.deadlines
ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Add issuing authority field
ALTER TABLE public.deadlines
ADD COLUMN IF NOT EXISTS issuing_authority TEXT;

-- ============================================
-- 2. RECURRING DEADLINES
-- ============================================

-- Create enum for recurrence patterns
CREATE TYPE public.recurrence_pattern AS ENUM (
  'none',
  'monthly',
  'quarterly', 
  'semi_annual',
  'annual',
  'biennial',
  'custom'
);

-- Add recurrence fields to deadlines
ALTER TABLE public.deadlines
ADD COLUMN IF NOT EXISTS recurrence public.recurrence_pattern DEFAULT 'none';

ALTER TABLE public.deadlines
ADD COLUMN IF NOT EXISTS recurrence_interval_days INTEGER;

ALTER TABLE public.deadlines
ADD COLUMN IF NOT EXISTS parent_deadline_id UUID REFERENCES public.deadlines(id) ON DELETE SET NULL;

ALTER TABLE public.deadlines
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

-- Index for finding recurring deadlines
CREATE INDEX IF NOT EXISTS idx_deadlines_recurrence ON public.deadlines(recurrence) WHERE recurrence != 'none';
CREATE INDEX IF NOT EXISTS idx_deadlines_parent ON public.deadlines(parent_deadline_id) WHERE parent_deadline_id IS NOT NULL;

-- ============================================
-- 3. TEAM INVITATIONS
-- ============================================

-- Create invitation status enum
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Create invitations table
CREATE TABLE public.organization_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'org_member',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate pending invitations
  CONSTRAINT unique_pending_invitation UNIQUE (organization_id, email, status)
);

-- Index for looking up invitations by token
CREATE UNIQUE INDEX idx_invitations_token ON public.organization_invitations(token) WHERE status = 'pending';
CREATE INDEX idx_invitations_email ON public.organization_invitations(email);
CREATE INDEX idx_invitations_org ON public.organization_invitations(organization_id);

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Invitation policies
CREATE POLICY "Org admins can view invitations"
ON public.organization_invitations FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  public.is_org_admin(auth.uid(), organization_id)
);

CREATE POLICY "Org admins can create invitations"
ON public.organization_invitations FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.is_org_admin(auth.uid(), organization_id) AND
  invited_by = auth.uid()
);

CREATE POLICY "Org admins can update invitations"
ON public.organization_invitations FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  public.is_org_admin(auth.uid(), organization_id)
);

CREATE POLICY "Org admins can delete invitations"
ON public.organization_invitations FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  public.is_org_admin(auth.uid(), organization_id)
);

-- Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
ON public.organization_invitations FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- ============================================
-- 4. ORGANIZATION CREATION FIX
-- ============================================

-- Allow authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Function to create org and set user as admin
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
  org_name TEXT,
  org_industry TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create the organization
  INSERT INTO public.organizations (name, industry)
  VALUES (org_name, org_industry)
  RETURNING id INTO new_org_id;
  
  -- Update the user's profile to be org admin
  UPDATE public.profiles
  SET 
    organization_id = new_org_id,
    role = 'org_admin'
  WHERE id = auth.uid();
  
  RETURN new_org_id;
END;
$$;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  user_email TEXT;
BEGIN
  -- Get the current user's email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Find the invitation
  SELECT * INTO inv FROM public.organization_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND email = user_email;
  
  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- Update user's profile
  UPDATE public.profiles
  SET 
    organization_id = inv.organization_id,
    role = inv.role
  WHERE id = auth.uid();
  
  -- Mark invitation as accepted
  UPDATE public.organization_invitations
  SET 
    status = 'accepted',
    accepted_at = now()
  WHERE id = inv.id;
  
  RETURN true;
END;
$$;

-- Function to leave an organization
CREATE OR REPLACE FUNCTION public.leave_organization()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    organization_id = NULL,
    role = 'individual'
  WHERE id = auth.uid();
  
  RETURN true;
END;
$$;

-- ============================================
-- 5. STRIPE / SUBSCRIPTIONS
-- ============================================

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM (
  'trialing',
  'active', 
  'past_due',
  'canceled',
  'unpaid',
  'incomplete'
);

-- Create plan tier enum
CREATE TYPE public.plan_tier AS ENUM (
  'free',
  'pro',
  'team',
  'enterprise'
);

-- Add Stripe fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan_tier public.plan_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_org ON public.subscriptions(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can view org subscription"
ON public.subscriptions FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  organization_id IS NOT NULL AND
  public.user_belongs_to_org(auth.uid(), organization_id)
);

-- Only service role can modify subscriptions (via webhooks)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ============================================
-- 6. USAGE TRACKING (for plan limits)
-- ============================================

CREATE TABLE public.usage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  deadlines_count INTEGER NOT NULL DEFAULT 0,
  reminders_sent INTEGER NOT NULL DEFAULT 0,
  sms_sent INTEGER NOT NULL DEFAULT 0,
  team_members INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_period UNIQUE (user_id, period_start)
);

-- Index
CREATE INDEX idx_usage_user_period ON public.usage_stats(user_id, period_start);

-- Trigger
CREATE TRIGGER update_usage_stats_updated_at
  BEFORE UPDATE ON public.usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
ON public.usage_stats FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ============================================
-- 7. PLAN LIMITS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.get_plan_limits(tier public.plan_tier)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT CASE tier
    WHEN 'free' THEN '{"deadlines": 5, "team_members": 1, "sms": 0, "recurring": false, "integrations": false}'::jsonb
    WHEN 'pro' THEN '{"deadlines": -1, "team_members": 1, "sms": 50, "recurring": true, "integrations": true}'::jsonb
    WHEN 'team' THEN '{"deadlines": -1, "team_members": 10, "sms": 200, "recurring": true, "integrations": true}'::jsonb
    WHEN 'enterprise' THEN '{"deadlines": -1, "team_members": -1, "sms": -1, "recurring": true, "integrations": true}'::jsonb
    ELSE '{"deadlines": 5, "team_members": 1, "sms": 0, "recurring": false, "integrations": false}'::jsonb
  END
$$;

-- Function to check if user can create more deadlines
CREATE OR REPLACE FUNCTION public.can_create_deadline(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier public.plan_tier;
  deadline_limit INTEGER;
  current_count INTEGER;
BEGIN
  -- Get user's plan tier
  SELECT COALESCE(s.plan_tier, 'free') INTO user_tier
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id AND s.status IN ('active', 'trialing')
  WHERE p.id = user_uuid;
  
  -- Get limit for tier
  SELECT (public.get_plan_limits(user_tier)->>'deadlines')::integer INTO deadline_limit;
  
  -- -1 means unlimited
  IF deadline_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Count current deadlines
  SELECT COUNT(*) INTO current_count
  FROM public.deadlines
  WHERE user_id = user_uuid;
  
  RETURN current_count < deadline_limit;
END;
$$;

-- ============================================
-- 8. AUTO-CREATE RECURRING DEADLINE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.create_next_recurring_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_due_date DATE;
  interval_days INTEGER;
BEGIN
  -- Only process if this is a recurring deadline being marked as "done" or past due
  IF NEW.recurrence = 'none' OR NEW.recurrence IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate next due date based on recurrence pattern
  interval_days := CASE NEW.recurrence
    WHEN 'monthly' THEN 30
    WHEN 'quarterly' THEN 90
    WHEN 'semi_annual' THEN 180
    WHEN 'annual' THEN 365
    WHEN 'biennial' THEN 730
    WHEN 'custom' THEN COALESCE(NEW.recurrence_interval_days, 365)
    ELSE NULL
  END;
  
  IF interval_days IS NULL THEN
    RETURN NEW;
  END IF;
  
  next_due_date := NEW.due_date + interval_days;
  
  -- Only create next if auto_renew is enabled and due date has passed
  IF NEW.auto_renew = true AND NEW.due_date < CURRENT_DATE THEN
    INSERT INTO public.deadlines (
      title,
      description,
      category,
      subcategory,
      due_date,
      consequence_level,
      user_id,
      organization_id,
      recurrence,
      recurrence_interval_days,
      auto_renew,
      parent_deadline_id,
      renewal_instructions,
      estimated_cost,
      reference_number,
      issuing_authority
    ) VALUES (
      NEW.title,
      NEW.description,
      NEW.category,
      NEW.subcategory,
      next_due_date,
      NEW.consequence_level,
      NEW.user_id,
      NEW.organization_id,
      NEW.recurrence,
      NEW.recurrence_interval_days,
      NEW.auto_renew,
      NEW.id,
      NEW.renewal_instructions,
      NEW.estimated_cost,
      NEW.reference_number,
      NEW.issuing_authority
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: You may want to trigger this manually or via a cron job
-- rather than on every update, depending on your workflow

-- ============================================
-- 9. A/E/C CATEGORY HELPERS
-- ============================================

-- Create a table for category templates (pre-built deadline types)
CREATE TABLE public.deadline_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category public.deadline_category NOT NULL,
  subcategory TEXT,
  default_consequence_level public.consequence_level NOT NULL DEFAULT 'medium',
  typical_recurrence public.recurrence_pattern DEFAULT 'annual',
  typical_lead_time_days INTEGER DEFAULT 30,
  industry TEXT[], -- e.g., ARRAY['construction', 'engineering', 'architecture']
  issuing_authority_template TEXT,
  renewal_instructions_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert A/E/C specific templates
INSERT INTO public.deadline_templates (name, description, category, subcategory, default_consequence_level, typical_recurrence, typical_lead_time_days, industry, issuing_authority_template, renewal_instructions_template) VALUES
-- Licenses
('General Contractor License', 'State contractor license for general construction work', 'license', 'contractor_license', 'critical', 'annual', 60, ARRAY['construction'], 'State Contractor Licensing Board', 'Submit renewal application with proof of insurance and bond. Complete any required continuing education.'),
('Specialty Contractor License', 'Trade-specific contractor license (electrical, plumbing, HVAC, etc.)', 'license', 'specialty_license', 'critical', 'annual', 60, ARRAY['construction'], 'State Licensing Board', 'Verify journeyman hours, submit renewal fee, complete CE requirements.'),
('Professional Engineer (PE) License', 'State PE license for engineering practice', 'license', 'pe_license', 'critical', 'biennial', 90, ARRAY['engineering'], 'State Board of Professional Engineers', 'Complete PDH requirements, submit renewal application and fee.'),
('Architect License', 'State architecture license', 'license', 'architect_license', 'critical', 'biennial', 90, ARRAY['architecture'], 'State Board of Architecture', 'Complete continuing education, submit renewal application.'),
('Business License', 'General business operating license', 'license', 'business_license', 'high', 'annual', 30, ARRAY['construction', 'engineering', 'architecture'], 'City/County Business License Office', 'Pay renewal fee, update business information if changed.'),

-- Insurance
('General Liability Insurance', 'Commercial general liability coverage', 'insurance', 'general_liability', 'critical', 'annual', 45, ARRAY['construction', 'engineering', 'architecture'], NULL, 'Review coverage limits, get renewal quote, update certificate holders.'),
('Professional Liability (E&O)', 'Errors and omissions coverage for professional services', 'insurance', 'professional_liability', 'critical', 'annual', 45, ARRAY['engineering', 'architecture'], NULL, 'Review claims history, update project types, renew with adequate limits.'),
('Workers Compensation', 'Workers comp coverage for employees', 'insurance', 'workers_comp', 'critical', 'annual', 30, ARRAY['construction'], NULL, 'Complete payroll audit, submit renewal application.'),
('Commercial Auto Insurance', 'Vehicle fleet coverage', 'insurance', 'commercial_auto', 'high', 'annual', 30, ARRAY['construction'], NULL, 'Update vehicle list, review driver records, get renewal quote.'),
('Builders Risk Insurance', 'Coverage for projects under construction', 'insurance', 'builders_risk', 'high', 'none', 30, ARRAY['construction'], NULL, 'Project-specific policy. Verify coverage period matches project timeline.'),
('Umbrella/Excess Liability', 'Additional liability coverage above primary policies', 'insurance', 'umbrella', 'high', 'annual', 45, ARRAY['construction', 'engineering', 'architecture'], NULL, 'Ensure underlying policies are renewed first. Match coverage dates.'),

-- Bonds
('License Bond', 'Bond required to maintain contractor license', 'contract', 'license_bond', 'critical', 'annual', 30, ARRAY['construction'], 'State Licensing Board', 'Renew bond, submit to licensing board with license renewal.'),
('Bid Bond', 'Bond submitted with project bid', 'contract', 'bid_bond', 'high', 'none', 14, ARRAY['construction'], NULL, 'Project-specific. Coordinate with surety for each bid.'),
('Performance Bond', 'Bond guaranteeing project completion', 'contract', 'performance_bond', 'critical', 'none', 14, ARRAY['construction'], NULL, 'Project-specific. Coordinate with surety at contract award.'),
('Payment Bond', 'Bond guaranteeing payment to subs and suppliers', 'contract', 'payment_bond', 'critical', 'none', 14, ARRAY['construction'], NULL, 'Usually paired with performance bond. Required on public projects.'),

-- Certifications
('OSHA 10-Hour', 'OSHA 10-hour safety certification', 'personal', 'safety_cert', 'medium', 'none', 30, ARRAY['construction'], 'OSHA', 'Does not expire but clients may require refresh every 3-5 years.'),
('OSHA 30-Hour', 'OSHA 30-hour safety certification for supervisors', 'personal', 'safety_cert', 'medium', 'none', 30, ARRAY['construction'], 'OSHA', 'Does not expire but clients may require refresh every 3-5 years.'),
('First Aid/CPR', 'First aid and CPR certification', 'personal', 'safety_cert', 'medium', 'biennial', 30, ARRAY['construction'], 'American Red Cross / AHA', 'Complete recertification class.'),
('LEED Credential', 'LEED AP or Green Associate credential', 'personal', 'professional_cert', 'low', 'biennial', 60, ARRAY['architecture', 'engineering', 'construction'], 'GBCI', 'Complete continuing education hours, pay maintenance fee.'),
('Equipment Operator Certification', 'Crane, forklift, or heavy equipment certification', 'personal', 'equipment_cert', 'high', 'annual', 30, ARRAY['construction'], 'NCCCO / Equipment-specific', 'Complete recertification training and practical exam.'),

-- Permits & Compliance
('Building Permit', 'Active building permit for construction project', 'other', 'building_permit', 'critical', 'none', 14, ARRAY['construction'], 'Local Building Department', 'Project-specific. Track expiration and inspection requirements.'),
('Stormwater Permit (SWPPP)', 'Stormwater pollution prevention permit', 'other', 'environmental_permit', 'high', 'annual', 30, ARRAY['construction'], 'State Environmental Agency / EPA', 'Submit annual report, update SWPPP as needed.'),
('Encroachment Permit', 'Permit for work in public right-of-way', 'other', 'encroachment_permit', 'high', 'none', 14, ARRAY['construction'], 'City/County Public Works', 'Project-specific. Coordinate with traffic control.'),

-- Tax & Reporting
('Quarterly Payroll Tax', 'Federal and state payroll tax deposits', 'other', 'tax_deadline', 'critical', 'quarterly', 7, ARRAY['construction', 'engineering', 'architecture'], 'IRS / State Tax Agency', 'File Form 941, deposit withheld taxes.'),
('Certified Payroll Report', 'Weekly certified payroll for prevailing wage projects', 'other', 'compliance_report', 'high', 'none', 7, ARRAY['construction'], 'Project Owner / DOL', 'Submit weekly for duration of prevailing wage project.'),
('Annual Report / Franchise Tax', 'State annual report or franchise tax filing', 'other', 'tax_deadline', 'high', 'annual', 30, ARRAY['construction', 'engineering', 'architecture'], 'Secretary of State', 'File annual report, pay franchise tax if applicable.')
ON CONFLICT DO NOTHING;

-- Index for templates
CREATE INDEX idx_templates_industry ON public.deadline_templates USING GIN (industry);
CREATE INDEX idx_templates_category ON public.deadline_templates(category);

-- RLS for templates (public read, no write for users)
ALTER TABLE public.deadline_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
ON public.deadline_templates FOR SELECT
USING (is_active = true);

-- ============================================
-- 10. HELPER VIEWS
-- ============================================

-- View for upcoming deadlines with urgency calculation
CREATE OR REPLACE VIEW public.deadlines_with_urgency AS
SELECT 
  d.*,
  (d.due_date - CURRENT_DATE) AS days_until_due,
  CASE 
    WHEN (d.due_date - CURRENT_DATE) < 0 THEN 'overdue'
    WHEN (d.due_date - CURRENT_DATE) <= 3 THEN 'critical'
    WHEN (d.due_date - CURRENT_DATE) <= 7 THEN 'urgent'
    WHEN (d.due_date - CURRENT_DATE) <= 14 THEN 'warning'
    WHEN (d.due_date - CURRENT_DATE) <= 30 THEN 'upcoming'
    ELSE 'ok'
  END AS urgency_status,
  p.name AS user_name,
  p.email AS user_email,
  o.name AS organization_name
FROM public.deadlines d
JOIN public.profiles p ON d.user_id = p.id
LEFT JOIN public.organizations o ON d.organization_id = o.id;

-- Note: Views inherit RLS from underlying tables

-- ============================================
-- DONE
-- ============================================
