
-- Create the qr-codes storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true);

-- Create policy to allow authenticated users to upload QR codes
CREATE POLICY "Allow authenticated users to upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qr-codes' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow public read access to QR codes
CREATE POLICY "Allow public read access to QR codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

-- Create policy to allow admins to delete QR codes
CREATE POLICY "Allow admins to delete QR codes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'qr-codes' 
  AND auth.role() = 'authenticated'
);
