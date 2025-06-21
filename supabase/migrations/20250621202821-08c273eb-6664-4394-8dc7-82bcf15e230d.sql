
-- First, let's add RLS policies to existing tables for admin access
-- Create admin role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
    END IF;
END $$;

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Update existing profiles to have user role
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- Create admin_activities table for logging admin actions
CREATE TABLE IF NOT EXISTS public.admin_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id),
    target_table TEXT,
    target_record_id TEXT,
    action_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_activities table for tracking user login/signup activities
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    activity_type TEXT NOT NULL, -- 'login', 'signup', 'logout'
    ip_address TEXT,
    user_agent TEXT,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kyc_submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    full_name TEXT NOT NULL,
    address TEXT NOT NULL,
    nationality TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    id_card_url TEXT,
    passport_url TEXT,
    utility_bill_url TEXT,
    selfie_with_id_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'resubmission_required'
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update profiles table to have kyc_status that references kyc_submissions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kyc_submission_id UUID REFERENCES public.kyc_submissions(id);

-- Enable RLS on new tables
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role IN ('admin', 'superadmin')
    );
$$;

-- Helper function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'superadmin'
    );
$$;

-- RLS Policies for admin_activities
CREATE POLICY "Admins can view admin activities" ON public.admin_activities
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin activities" ON public.admin_activities
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for user_activities  
CREATE POLICY "Users can view their own activities" ON public.user_activities
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "System can insert user activities" ON public.user_activities
    FOR INSERT WITH CHECK (true);

-- RLS Policies for kyc_submissions
CREATE POLICY "Users can view their own KYC submissions" ON public.kyc_submissions
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own KYC submissions" ON public.kyc_submissions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own KYC submissions" ON public.kyc_submissions
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can update KYC submissions" ON public.kyc_submissions
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Add RLS policies for existing tables to allow admin access
-- Deposit requests admin policies
CREATE POLICY "Admins can view all deposit requests" ON public.deposit_requests
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update deposit requests" ON public.deposit_requests
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Withdrawal requests admin policies  
CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update withdrawal requests" ON public.withdrawal_requests
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Profiles admin policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin(auth.uid()) OR id = auth.uid());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin(auth.uid()) OR id = auth.uid());

CREATE POLICY "Superadmins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete profiles" ON public.profiles
    FOR DELETE USING (public.is_superadmin(auth.uid()));

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for KYC documents
CREATE POLICY "Users can upload their KYC documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND 
        (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid()))
    );

CREATE POLICY "Admins can view all KYC documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'kyc-documents' AND public.is_admin(auth.uid()));
