
-- Drop all existing tables and their dependencies
DROP TABLE IF EXISTS public.deposit_requests CASCADE;
DROP TABLE IF EXISTS public.withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.kyc_submissions CASCADE;
DROP TABLE IF EXISTS public.bank_cards CASCADE;

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for deposit screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deposit-screenshots', 'deposit-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Create bank_cards table
CREATE TABLE public.bank_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  routing_number TEXT,
  swift_code TEXT,
  bank_address TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create deposit_requests table
CREATE TABLE public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  network TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  network TEXT NOT NULL,
  bank_card_id UUID REFERENCES public.bank_cards(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create kyc_submissions table
CREATE TABLE public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL,
  address TEXT NOT NULL,
  phone_number TEXT,
  front_document_url TEXT,
  back_document_url TEXT,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resubmission_required')),
  admin_notes TEXT,
  admin_id UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.bank_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_cards
CREATE POLICY "Users can manage own bank cards" ON public.bank_cards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bank cards" ON public.bank_cards
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies for deposit_requests
CREATE POLICY "Users can manage own deposits" ON public.deposit_requests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all deposits" ON public.deposit_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can manage own withdrawals" ON public.withdrawal_requests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawal_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies for kyc_submissions
CREATE POLICY "Users can manage own KYC" ON public.kyc_submissions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all KYC" ON public.kyc_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Drop existing storage policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own deposit screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own deposit screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all deposit screenshots" ON storage.objects;

-- Storage policies for kyc-documents bucket
CREATE POLICY "Users can upload own KYC documents v2" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own KYC documents v2" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all KYC documents v2" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Storage policies for deposit-screenshots bucket
CREATE POLICY "Users can upload own deposit screenshots v2" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'deposit-screenshots' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own deposit screenshots v2" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deposit-screenshots' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all deposit screenshots v2" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deposit-screenshots' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Add indexes for better performance
CREATE INDEX idx_deposit_requests_user_id ON public.deposit_requests(user_id);
CREATE INDEX idx_deposit_requests_status ON public.deposit_requests(status);
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX idx_kyc_submissions_user_id ON public.kyc_submissions(user_id);
CREATE INDEX idx_kyc_submissions_status ON public.kyc_submissions(status);

-- Enable realtime for all tables
ALTER TABLE public.deposit_requests REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER TABLE public.kyc_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.bank_cards REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_cards;
