
-- Fix RLS policies for withdrawal_requests to allow users to create their own requests
DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create their own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_select_all" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_insert_all" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_update_all" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_delete_all" ON public.withdrawal_requests;

-- Create proper RLS policies for withdrawal_requests
CREATE POLICY "Users can view own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow admins to manage all withdrawal requests
CREATE POLICY "Admins can manage all withdrawal requests" 
  ON public.withdrawal_requests 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Also fix deposit_requests policies since they seem to have the same issue
DROP POLICY IF EXISTS "Users can view their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can create their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can manage all deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "deposit_requests_select_all" ON public.deposit_requests;
DROP POLICY IF EXISTS "deposit_requests_insert_all" ON public.deposit_requests;
DROP POLICY IF EXISTS "deposit_requests_update_all" ON public.deposit_requests;
DROP POLICY IF EXISTS "deposit_requests_delete_all" ON public.deposit_requests;

-- Create proper RLS policies for deposit_requests
CREATE POLICY "Users can view own deposit requests" 
  ON public.deposit_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deposit requests" 
  ON public.deposit_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deposit requests" 
  ON public.deposit_requests 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow admins to manage all deposit requests
CREATE POLICY "Admins can manage all deposit requests" 
  ON public.deposit_requests 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );
