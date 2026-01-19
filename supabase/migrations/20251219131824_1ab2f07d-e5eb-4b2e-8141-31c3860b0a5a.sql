-- Fix RLS policies to explicitly prevent anonymous access

-- Drop and recreate profiles SELECT policies with auth.uid() IS NOT NULL check
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles in their organization" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  organization_id IS NOT NULL AND 
  organization_id = public.get_user_org(auth.uid())
);

-- Drop and recreate organizations SELECT policy
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization" 
ON public.organizations 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND public.user_belongs_to_org(auth.uid(), id));

-- Drop and recreate deadlines SELECT policies
DROP POLICY IF EXISTS "Users can view their own deadlines" ON public.deadlines;
CREATE POLICY "Users can view their own deadlines" 
ON public.deadlines 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view organization deadlines" ON public.deadlines;
CREATE POLICY "Users can view organization deadlines" 
ON public.deadlines 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  organization_id IS NOT NULL AND 
  public.user_belongs_to_org(auth.uid(), organization_id)
);