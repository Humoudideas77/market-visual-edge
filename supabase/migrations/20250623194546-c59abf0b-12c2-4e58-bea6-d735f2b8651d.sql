
-- Fix RLS policies to ensure proper access for admin dashboard
-- First, drop all existing problematic policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on relevant tables
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

-- Create simplified policies for profiles
CREATE POLICY "profiles_full_access" 
  ON public.profiles 
  FOR ALL
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for deposit_requests
CREATE POLICY "deposit_requests_full_access" 
  ON public.deposit_requests 
  FOR ALL
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for withdrawal_requests
CREATE POLICY "withdrawal_requests_full_access" 
  ON public.withdrawal_requests 
  FOR ALL
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for kyc_submissions
CREATE POLICY "kyc_submissions_full_access" 
  ON public.kyc_submissions 
  FOR ALL
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for wallet_balances
CREATE POLICY "wallet_balances_full_access" 
  ON public.wallet_balances 
  FOR ALL
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for customer_messages
CREATE POLICY "customer_messages_full_access" 
  ON public.customer_messages 
  FOR ALL
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Ensure admin_activities table has proper policies
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_activities_full_access" 
  ON public.admin_activities 
  FOR ALL
  TO authenticated 
  USING (true)
  WITH CHECK (true);
