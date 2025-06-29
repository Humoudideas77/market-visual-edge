
-- First, drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "SuperAdmin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a security definer function to check user roles without recursion
CREATE OR REPLACE FUNCTION public.get_user_role_secure(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = user_uuid;
$$;

-- Create a security definer function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin_secure(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND role = 'superadmin'
  );
$$;

-- Create a security definer function to check if user is admin or superadmin
CREATE OR REPLACE FUNCTION public.is_admin_secure(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND role IN ('admin', 'superadmin')
  );
$$;

-- Now create proper RLS policies using the security definer functions
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "SuperAdmin can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (public.is_superadmin_secure(auth.uid()));

CREATE POLICY "Admins can view profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin_secure(auth.uid()));

-- Update other policies to use the secure functions
DROP POLICY IF EXISTS "SuperAdmin can view all perpetual positions" ON public.perpetual_positions;
DROP POLICY IF EXISTS "SuperAdmin can update all perpetual positions" ON public.perpetual_positions;

CREATE POLICY "SuperAdmin can view all perpetual positions" 
  ON public.perpetual_positions 
  FOR SELECT 
  TO authenticated
  USING (public.is_superadmin_secure(auth.uid()));

CREATE POLICY "SuperAdmin can update all perpetual positions" 
  ON public.perpetual_positions 
  FOR UPDATE 
  TO authenticated
  USING (public.is_superadmin_secure(auth.uid()));

-- Update admin activities policies
DROP POLICY IF EXISTS "Admins can view admin activities" ON public.admin_activities;
DROP POLICY IF EXISTS "Admins can insert admin activities" ON public.admin_activities;

CREATE POLICY "Admins can view admin activities" 
  ON public.admin_activities
  FOR SELECT 
  TO authenticated
  USING (public.is_admin_secure(auth.uid()));

CREATE POLICY "Admins can insert admin activities" 
  ON public.admin_activities
  FOR INSERT 
  TO authenticated
  WITH CHECK (public.is_admin_secure(auth.uid()));

-- Update user activities policies
DROP POLICY IF EXISTS "Users can view their own activities" ON public.user_activities;

CREATE POLICY "Users can view their own activities" 
  ON public.user_activities
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_secure(auth.uid()));

-- Update KYC policies
DROP POLICY IF EXISTS "Users can view their own KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can update their own KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Admins can update KYC submissions" ON public.kyc_submissions;

CREATE POLICY "Users can view their own KYC submissions" 
  ON public.kyc_submissions
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_secure(auth.uid()));

CREATE POLICY "Users can update their own KYC submissions" 
  ON public.kyc_submissions
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update KYC submissions" 
  ON public.kyc_submissions
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin_secure(auth.uid()));

-- Update deposit and withdrawal policies
DROP POLICY IF EXISTS "Admins can view all deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can update deposit requests" ON public.deposit_requests;

CREATE POLICY "Admins can view all deposit requests" 
  ON public.deposit_requests
  FOR SELECT 
  TO authenticated
  USING (public.is_admin_secure(auth.uid()));

CREATE POLICY "Admins can update deposit requests" 
  ON public.deposit_requests
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin_secure(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON public.withdrawal_requests;

CREATE POLICY "Admins can view all withdrawal requests" 
  ON public.withdrawal_requests
  FOR SELECT 
  TO authenticated
  USING (public.is_admin_secure(auth.uid()));

CREATE POLICY "Admins can update withdrawal requests" 
  ON public.withdrawal_requests
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin_secure(auth.uid()));
