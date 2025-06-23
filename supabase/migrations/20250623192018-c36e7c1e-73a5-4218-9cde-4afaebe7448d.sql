
-- First, let's ensure we have proper RLS policies for deposit_requests that allow admins to see everything
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.deposit_requests;
DROP POLICY IF EXISTS "Enable select for users on their own data" ON public.deposit_requests;
DROP POLICY IF EXISTS "Enable all for superadmins" ON public.deposit_requests;
DROP POLICY IF EXISTS "Enable all for admins" ON public.deposit_requests;

-- Recreate clean policies for deposit_requests
CREATE POLICY "Users can insert their own deposit requests" 
  ON public.deposit_requests 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own deposit requests" 
  ON public.deposit_requests 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can do everything with deposit requests" 
  ON public.deposit_requests 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can do everything with deposit requests" 
  ON public.deposit_requests 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Now let's fix KYC submissions policies
DROP POLICY IF EXISTS "Users can view their own KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can create their own KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can update their own KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Admins can manage all KYC submissions" ON public.kyc_submissions;

-- Enable RLS on kyc_submissions if not already enabled
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Create proper policies for KYC submissions
CREATE POLICY "Users can view their own KYC submissions" 
  ON public.kyc_submissions 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KYC submissions" 
  ON public.kyc_submissions 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC submissions" 
  ON public.kyc_submissions 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all KYC submissions" 
  ON public.kyc_submissions 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can manage all KYC submissions" 
  ON public.kyc_submissions 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Also ensure we have proper policies for other admin-related tables
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create customer messages" ON public.customer_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.customer_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.customer_messages;

CREATE POLICY "Users can create customer messages" 
  ON public.customer_messages 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own messages" 
  ON public.customer_messages 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all customer messages" 
  ON public.customer_messages 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Make sure profiles table has proper policies for admin access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() 
      AND p2.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Superadmins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() 
      AND p2.role = 'superadmin'
    )
  );
