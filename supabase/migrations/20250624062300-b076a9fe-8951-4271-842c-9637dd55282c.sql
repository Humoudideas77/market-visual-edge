
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "profiles_full_access" ON public.profiles;
DROP POLICY IF EXISTS "deposit_requests_full_access" ON public.deposit_requests;
DROP POLICY IF EXISTS "withdrawal_requests_full_access" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "kyc_submissions_full_access" ON public.kyc_submissions;
DROP POLICY IF EXISTS "wallet_balances_full_access" ON public.wallet_balances;
DROP POLICY IF EXISTS "customer_messages_full_access" ON public.customer_messages;
DROP POLICY IF EXISTS "admin_activities_full_access" ON public.admin_activities;

-- Create comprehensive policies that allow full access for authenticated users
-- This ensures superadmins can see all data without restrictions

-- Profiles policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update_all" ON public.profiles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "profiles_delete_all" ON public.profiles FOR DELETE TO authenticated USING (true);

-- Deposit requests policies
CREATE POLICY "deposit_requests_select_all" ON public.deposit_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "deposit_requests_insert_all" ON public.deposit_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "deposit_requests_update_all" ON public.deposit_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "deposit_requests_delete_all" ON public.deposit_requests FOR DELETE TO authenticated USING (true);

-- Withdrawal requests policies
CREATE POLICY "withdrawal_requests_select_all" ON public.withdrawal_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "withdrawal_requests_insert_all" ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "withdrawal_requests_update_all" ON public.withdrawal_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "withdrawal_requests_delete_all" ON public.withdrawal_requests FOR DELETE TO authenticated USING (true);

-- KYC submissions policies
CREATE POLICY "kyc_submissions_select_all" ON public.kyc_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "kyc_submissions_insert_all" ON public.kyc_submissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kyc_submissions_update_all" ON public.kyc_submissions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "kyc_submissions_delete_all" ON public.kyc_submissions FOR DELETE TO authenticated USING (true);

-- Wallet balances policies
CREATE POLICY "wallet_balances_select_all" ON public.wallet_balances FOR SELECT TO authenticated USING (true);
CREATE POLICY "wallet_balances_insert_all" ON public.wallet_balances FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "wallet_balances_update_all" ON public.wallet_balances FOR UPDATE TO authenticated USING (true);
CREATE POLICY "wallet_balances_delete_all" ON public.wallet_balances FOR DELETE TO authenticated USING (true);

-- Customer messages policies
CREATE POLICY "customer_messages_select_all" ON public.customer_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "customer_messages_insert_all" ON public.customer_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "customer_messages_update_all" ON public.customer_messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "customer_messages_delete_all" ON public.customer_messages FOR DELETE TO authenticated USING (true);

-- Admin activities policies
CREATE POLICY "admin_activities_select_all" ON public.admin_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_activities_insert_all" ON public.admin_activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_activities_update_all" ON public.admin_activities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin_activities_delete_all" ON public.admin_activities FOR DELETE TO authenticated USING (true);

-- Enable realtime for critical tables to ensure real-time updates
ALTER TABLE public.deposit_requests REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER TABLE public.kyc_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
