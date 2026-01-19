-- Fix 1: Add INSERT policy for profiles table (for future manual onboarding flows)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Fix 3: Add database constraints for input validation (server-side validation)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_name_length 
CHECK (length(name) >= 1 AND length(name) <= 100);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_length 
CHECK (length(email) >= 3 AND length(email) <= 255);

ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_title_length 
CHECK (length(title) >= 1 AND length(title) <= 200);

ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_description_length 
CHECK (description IS NULL OR length(description) <= 2000);

ALTER TABLE public.organizations ADD CONSTRAINT organizations_name_length 
CHECK (length(name) >= 1 AND length(name) <= 200);

ALTER TABLE public.organizations ADD CONSTRAINT organizations_industry_length 
CHECK (industry IS NULL OR length(industry) <= 100);

-- Fix 4: Add rate limiting function and trigger for deadline creation
CREATE OR REPLACE FUNCTION public.check_deadline_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.deadlines 
      WHERE user_id = NEW.user_id 
      AND created_at > NOW() - INTERVAL '1 day') > 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 100 deadlines per day';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_deadline_rate_limit
BEFORE INSERT ON public.deadlines
FOR EACH ROW
EXECUTE FUNCTION public.check_deadline_rate_limit();