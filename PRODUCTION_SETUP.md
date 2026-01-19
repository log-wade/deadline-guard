# DeadlineGuard Production Setup Guide

## Overview

This guide walks through setting up DeadlineGuard for production with:
- Supabase (database, auth, edge functions)
- Stripe (payments, subscriptions)
- Resend (transactional emails)
- Vercel or similar (hosting)

---

## 1. Supabase Setup

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon/service keys

### 1.2 Run Migrations
In Supabase Dashboard → SQL Editor, run the migration files in order:
1. `20251219125734_*.sql` (initial schema)
2. `20251219131343_*.sql` (fixes)
3. `20251219131824_*.sql` (RLS fixes)
4. `20260119_production_ready.sql` (new features)

Or use Supabase CLI:
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 1.3 Deploy Edge Functions
```bash
# Install Supabase CLI if not already
npm install -g supabase

# Login
supabase login

# Deploy functions
supabase functions deploy send-deadline-reminders
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-billing-portal
supabase functions deploy send-team-invite
```

### 1.4 Set Edge Function Secrets
In Supabase Dashboard → Edge Functions → Secrets, add:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_TEAM_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
APP_URL=https://app.yourdomain.com
```

### 1.5 Set Up Cron Job for Reminders

Option A: Using pg_cron (recommended)

1. Enable pg_cron extension in Supabase Dashboard → Database → Extensions
2. Run this SQL:

```sql
-- Schedule daily reminder check at 9 AM UTC
SELECT cron.schedule(
  'send-deadline-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-deadline-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Optional: Also run at 2 PM UTC for critical deadlines
SELECT cron.schedule(
  'send-deadline-reminders-afternoon',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-deadline-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Option B: Using external cron (Vercel, Railway, etc.)

Set up a cron job to POST to your edge function URL with the service role key.

---

## 2. Stripe Setup

### 2.1 Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification

### 2.2 Create Products and Prices

In Stripe Dashboard → Products, create:

**Product: DeadlineGuard Pro**
- Price: $19/month (monthly)
- Price: $190/year (yearly, ~17% discount)

**Product: DeadlineGuard Team**
- Price: $49/month (monthly)
- Price: $490/year (yearly)

Note the Price IDs (price_xxx) for each.

### 2.3 Set Up Webhook

In Stripe Dashboard → Developers → Webhooks:

1. Add endpoint: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
2. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
3. Note the webhook signing secret (whsec_xxx)

### 2.4 Configure Billing Portal

In Stripe Dashboard → Settings → Billing → Customer Portal:

1. Enable the customer portal
2. Configure allowed actions:
   - Update payment method ✓
   - Cancel subscription ✓
   - Switch plans ✓ (optional)
3. Add your branding

---

## 3. Resend Setup

### 3.1 Create Account
1. Go to [resend.com](https://resend.com) and create account
2. Verify your domain for sending

### 3.2 Configure Domain

Add DNS records for your domain:
- SPF record
- DKIM record
- Return-Path CNAME

### 3.3 Get API Key
In Resend Dashboard → API Keys, create a new key.

---

## 4. Environment Variables

### Frontend (.env or Vercel/Netlify)
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Edge Functions (Supabase Secrets)
```
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_TEAM_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
APP_URL=https://app.yourdomain.com
```

---

## 5. Deploy Frontend

### Option A: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Option B: Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Option C: Manual
```bash
npm run build
# Upload dist/ to any static hosting
```

---

## 6. DNS & Domain Setup

### Main Domain (yourdomain.com)
- Point to your consultancy landing page

### App Subdomain (app.yourdomain.com)
- Point to your Vercel/Netlify deployment

### Email Domain
- Configure MX records if needed
- SPF/DKIM for Resend

---

## 7. Post-Launch Checklist

### Security
- [ ] Enable Supabase RLS (already done in migrations)
- [ ] Set up rate limiting in Supabase
- [ ] Configure CORS for edge functions
- [ ] Enable 2FA on Stripe, Supabase, Resend accounts

### Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Configure Supabase alerts
- [ ] Set up uptime monitoring (BetterUptime, Pingdom)
- [ ] Enable Stripe fraud protection

### Analytics
- [ ] Add Plausible/PostHog/Mixpanel
- [ ] Set up conversion tracking
- [ ] Configure Stripe revenue tracking

### Email Deliverability
- [ ] Test emails go to inbox, not spam
- [ ] Set up email warmup if new domain
- [ ] Monitor bounce/complaint rates in Resend

---

## 8. Testing Checklist

### Auth Flow
- [ ] Sign up creates profile and starts free tier
- [ ] Sign in works
- [ ] Sign out clears session
- [ ] Password reset works (need to implement)

### Deadlines
- [ ] Create deadline works
- [ ] Edit deadline works
- [ ] Delete deadline works
- [ ] Templates populate correctly
- [ ] Recurring deadlines work
- [ ] Free tier limit enforced

### Billing
- [ ] Checkout creates subscription
- [ ] Webhook updates database
- [ ] Billing portal opens
- [ ] Cancellation works
- [ ] Failed payment handled

### Team
- [ ] Create organization works
- [ ] Invite team member sends email
- [ ] Accept invitation joins org
- [ ] Remove member works
- [ ] Leave organization works

### Reminders
- [ ] Cron job triggers edge function
- [ ] Emails sent at correct intervals
- [ ] Last reminder date updated

---

## 9. Pricing Page Content

Use these selling points:

### Free Tier
- 5 deadlines
- Email reminders
- 1 user
- Basic categories

### Pro ($19/month)
- Unlimited deadlines
- Email + SMS reminders
- Recurring deadlines
- A/E/C-specific templates
- Priority support
- 14-day free trial

### Team ($49/month)
- Everything in Pro
- Up to 10 users
- Shared deadline management
- Organization dashboard
- Role-based permissions
- Team audit log

### Enterprise ($99/month)
- Everything in Team
- Unlimited users
- API access
- SSO (coming soon)
- Dedicated support
- Custom integrations

---

## 10. Support

### Common Issues

**"Email not sending"**
- Check Resend API key
- Verify domain DNS
- Check spam folder

**"Stripe checkout not working"**
- Verify price IDs match
- Check Stripe dashboard for errors
- Ensure webhook is receiving events

**"Can't create deadline (limit reached)"**
- User is on free tier
- Prompt upgrade to Pro

**"Invitation email not received"**
- Check spam folder
- Verify email address correct
- Check Resend logs

---

## Next Steps After Launch

1. Monitor first 10 users closely
2. Gather feedback, iterate fast
3. Add password reset flow
4. Add email verification requirement
5. Build onboarding flow
6. Add second software tool
7. Scale marketing

---

## Questions?

Refer to:
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Resend Docs](https://resend.com/docs)
