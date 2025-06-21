
-- Delete all users from the database (this will cascade to profiles and other related tables)
DELETE FROM auth.users;

-- Delete any remaining profile records (in case they weren't cascaded)
DELETE FROM public.profiles;

-- Delete all other user-related data
DELETE FROM public.admin_activities;
DELETE FROM public.user_activities;
DELETE FROM public.deposit_requests;
DELETE FROM public.withdrawal_requests;
DELETE FROM public.kyc_submissions;
DELETE FROM public.mining_investments;
DELETE FROM public.mining_payouts;
DELETE FROM public.bank_cards;

-- Insert a new superadmin profile directly (we'll need to create the auth user through the UI)
-- Note: We'll create the auth user through signup, then update the profile role
