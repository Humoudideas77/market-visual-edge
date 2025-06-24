
-- Fix the database schema issues by properly handling existing policies

-- First, let's update the deposit_requests table to match the expected schema
ALTER TABLE public.deposit_requests 
ADD COLUMN IF NOT EXISTS transaction_screenshot_url TEXT;

-- Update existing screenshot_url data to transaction_screenshot_url if needed
UPDATE public.deposit_requests 
SET transaction_screenshot_url = screenshot_url 
WHERE screenshot_url IS NOT NULL AND transaction_screenshot_url IS NULL;

-- Fix the kyc_submissions table to match expected schema
ALTER TABLE public.kyc_submissions 
ADD COLUMN IF NOT EXISTS personal_id_number TEXT,
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS passport_url TEXT,
ADD COLUMN IF NOT EXISTS utility_bill_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_with_id_url TEXT;

-- Update existing document URLs to match expected column names
UPDATE public.kyc_submissions 
SET id_card_url = front_document_url 
WHERE front_document_url IS NOT NULL AND id_card_url IS NULL;

UPDATE public.kyc_submissions 
SET selfie_with_id_url = selfie_url 
WHERE selfie_url IS NOT NULL AND selfie_with_id_url IS NULL;

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deposit-screenshots', 'deposit-screenshots', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop ALL existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload deposit screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view deposit screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all deposit screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload deposit screenshots v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can view deposit screenshots v2" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all deposit screenshots v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload KYC documents v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their KYC documents v2" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents v2" ON storage.objects;

-- Create storage policies for deposit screenshots with unique names
CREATE POLICY "deposit_upload_policy_v3" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'deposit-screenshots' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "deposit_view_policy_v3" ON storage.objects
FOR SELECT USING (
  bucket_id = 'deposit-screenshots' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "deposit_admin_view_policy_v3" ON storage.objects
FOR SELECT USING (
  bucket_id = 'deposit-screenshots' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Create storage policies for KYC documents with unique names
CREATE POLICY "kyc_upload_policy_v3" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "kyc_view_policy_v3" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "kyc_admin_view_policy_v3" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Fix RLS policies for all tables
-- Drop existing conflicting policies with all possible names
DROP POLICY IF EXISTS "Users can manage own deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can manage all deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Enable all for users on own deposits" ON public.deposit_requests;
DROP POLICY IF EXISTS "Enable all for admins on deposits" ON public.deposit_requests;

DROP POLICY IF EXISTS "Users can manage own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Admins can view all bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Enable all for users on own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Enable all for admins on bank cards" ON public.bank_cards;

DROP POLICY IF EXISTS "Users can manage own KYC" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Admins can manage all KYC" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Enable all for users on own KYC" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Enable all for admins on KYC" ON public.kyc_submissions;

DROP POLICY IF EXISTS "Users can manage own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Enable all for users on own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Enable all for admins on withdrawals" ON public.withdrawal_requests;

-- Create simple, working RLS policies with unique names
CREATE POLICY "deposit_user_policy_v3" ON public.deposit_requests
FOR ALL TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deposit_admin_policy_v3" ON public.deposit_requests
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "bank_card_user_policy_v3" ON public.bank_cards
FOR ALL TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bank_card_admin_policy_v3" ON public.bank_cards
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "withdrawal_user_policy_v3" ON public.withdrawal_requests
FOR ALL TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "withdrawal_admin_policy_v3" ON public.withdrawal_requests
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "kyc_user_policy_v3" ON public.kyc_submissions
FOR ALL TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kyc_admin_policy_v3" ON public.kyc_submissions
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
