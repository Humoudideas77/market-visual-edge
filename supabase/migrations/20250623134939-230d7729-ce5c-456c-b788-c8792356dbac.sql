
-- Create storage bucket for deposit screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deposit-screenshots',
  'deposit-screenshots', 
  true,
  5242880, -- 5MB limit
  '{"image/jpeg", "image/png", "image/gif", "image/webp"}'
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for deposit screenshots
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own deposit screenshots'
  ) THEN
    CREATE POLICY "Users can upload their own deposit screenshots"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'deposit-screenshots' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view their own deposit screenshots'
  ) THEN
    CREATE POLICY "Users can view their own deposit screenshots"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'deposit-screenshots' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can view all deposit screenshots'
  ) THEN
    CREATE POLICY "Admins can view all deposit screenshots"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'deposit-screenshots' 
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
      )
    );
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deposit_requests' 
    AND policyname = 'Admins can view all deposit requests'
  ) THEN
    CREATE POLICY "Admins can view all deposit requests"
    ON public.deposit_requests
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deposit_requests' 
    AND policyname = 'Admins can update deposit requests'
  ) THEN
    CREATE POLICY "Admins can update deposit requests"
    ON public.deposit_requests
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'withdrawal_requests' 
    AND policyname = 'Admins can view all withdrawal requests'
  ) THEN
    CREATE POLICY "Admins can view all withdrawal requests"
    ON public.withdrawal_requests
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'withdrawal_requests' 
    AND policyname = 'Admins can update withdrawal requests'
  ) THEN
    CREATE POLICY "Admins can update withdrawal requests"
    ON public.withdrawal_requests
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
      )
    );
  END IF;
END $$;
