
-- First, let's completely clean up all existing policies and start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on all relevant tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('deposit_requests', 'withdrawal_requests', 'kyc_submissions', 'profiles', 'wallet_balances', 'customer_messages')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Ensure all tables have RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "profiles_select_policy" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "profiles_insert_policy" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Create comprehensive policies for deposit_requests
CREATE POLICY "deposit_requests_select_policy" 
  ON public.deposit_requests 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "deposit_requests_insert_policy" 
  ON public.deposit_requests 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deposit_requests_update_policy" 
  ON public.deposit_requests 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "deposit_requests_delete_policy" 
  ON public.deposit_requests 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Create comprehensive policies for withdrawal_requests
CREATE POLICY "withdrawal_requests_select_policy" 
  ON public.withdrawal_requests 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "withdrawal_requests_insert_policy" 
  ON public.withdrawal_requests 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "withdrawal_requests_update_policy" 
  ON public.withdrawal_requests 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "withdrawal_requests_delete_policy" 
  ON public.withdrawal_requests 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Create comprehensive policies for kyc_submissions
CREATE POLICY "kyc_submissions_select_policy" 
  ON public.kyc_submissions 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "kyc_submissions_insert_policy" 
  ON public.kyc_submissions 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kyc_submissions_update_policy" 
  ON public.kyc_submissions 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "kyc_submissions_delete_policy" 
  ON public.kyc_submissions 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Create comprehensive policies for wallet_balances
CREATE POLICY "wallet_balances_select_policy" 
  ON public.wallet_balances 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "wallet_balances_insert_policy" 
  ON public.wallet_balances 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wallet_balances_update_policy" 
  ON public.wallet_balances 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "wallet_balances_delete_policy" 
  ON public.wallet_balances 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Create comprehensive policies for customer_messages
CREATE POLICY "customer_messages_select_policy" 
  ON public.customer_messages 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "customer_messages_insert_policy" 
  ON public.customer_messages 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "customer_messages_update_policy" 
  ON public.customer_messages 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "customer_messages_delete_policy" 
  ON public.customer_messages 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Ensure admin_activities table has proper policies
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_activities_select_policy" 
  ON public.admin_activities 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "admin_activities_insert_policy" 
  ON public.admin_activities 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "admin_activities_update_policy" 
  ON public.admin_activities 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "admin_activities_delete_policy" 
  ON public.admin_activities 
  FOR DELETE 
  TO authenticated 
  USING (true);
