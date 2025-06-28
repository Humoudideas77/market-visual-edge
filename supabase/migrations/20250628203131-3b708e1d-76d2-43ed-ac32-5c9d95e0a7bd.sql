
-- Enable RLS on crypto_addresses table if not already enabled
ALTER TABLE crypto_addresses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow superadmins to insert crypto addresses
CREATE POLICY "Allow superadmins to insert crypto addresses"
ON crypto_addresses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Create policy to allow superadmins to select crypto addresses
CREATE POLICY "Allow superadmins to select crypto addresses"
ON crypto_addresses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- Create policy to allow superadmins to update crypto addresses
CREATE POLICY "Allow superadmins to update crypto addresses"
ON crypto_addresses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Create policy to allow superadmins to delete crypto addresses
CREATE POLICY "Allow superadmins to delete crypto addresses"
ON crypto_addresses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Create policy to allow public read access for active addresses (for users to see deposit addresses)
CREATE POLICY "Allow public read access to active crypto addresses"
ON crypto_addresses FOR SELECT
USING (is_active = true);
