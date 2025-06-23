
-- Clean database for live launch - remove all user data
-- This will delete ALL user data and reset the database to a clean state

-- First, remove foreign key constraints that might block deletion
UPDATE public.profiles SET kyc_submission_id = NULL WHERE kyc_submission_id IS NOT NULL;

-- Delete all user-related data in correct order to respect foreign keys
DELETE FROM public.mining_payouts;
DELETE FROM public.mining_investments;
DELETE FROM public.wallet_balances;
DELETE FROM public.withdrawal_requests;
DELETE FROM public.deposit_requests;
DELETE FROM public.trading_chat_messages;
DELETE FROM public.user_activities;
DELETE FROM public.admin_activities;
DELETE FROM public.customer_messages;
DELETE FROM public.bank_cards;
DELETE FROM public.kyc_submissions;
DELETE FROM public.profiles;

-- Delete all authentication users (this will cascade to any remaining references)
DELETE FROM auth.users;

-- Clear any cached sessions or tokens
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;

-- Verify all tables are empty
DO $$
DECLARE
    table_name TEXT;
    row_count INTEGER;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename NOT IN ('crypto_addresses') -- Keep crypto addresses for admin setup
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO row_count;
        IF row_count > 0 THEN
            RAISE NOTICE 'Table % still has % rows', table_name, row_count;
        ELSE
            RAISE NOTICE 'Table % is now empty', table_name;
        END IF;
    END LOOP;
END $$;
