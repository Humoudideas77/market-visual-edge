
-- Create the deposit-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-screenshots', 'deposit-screenshots', true);

-- Create policy to allow authenticated users to upload deposit screenshots
CREATE POLICY "Allow authenticated users to upload deposit screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deposit-screenshots' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow public read access to deposit screenshots
CREATE POLICY "Allow public read access to deposit screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'deposit-screenshots');

-- Create policy to allow admins to delete deposit screenshots
CREATE POLICY "Allow admins to delete deposit screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'deposit-screenshots' 
  AND auth.role() = 'authenticated'
);
