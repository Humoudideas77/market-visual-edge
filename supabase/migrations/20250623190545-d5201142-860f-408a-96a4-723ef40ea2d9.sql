
-- First, let's check and fix the RLS policies for deposit_requests
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can create their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can manage all deposit requests" ON public.deposit_requests;

-- Ensure RLS is enabled
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "Enable insert for authenticated users" 
  ON public.deposit_requests 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for users on their own data" 
  ON public.deposit_requests 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Enable all for superadmins" 
  ON public.deposit_requests 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "Enable all for admins" 
  ON public.deposit_requests 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Also make sure we have some test crypto addresses
INSERT INTO public.crypto_addresses (currency, network, wallet_address, qr_code_url, is_active)
VALUES 
  ('USDT', 'ERC20', '0x742f96ad71cF4a6E5d7eFF79C9b4e46A6ba1b3C', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x742f96ad71cF4a6E5d7eFF79C9b4e46A6ba1b3C', true),
  ('BTC', 'Bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', true),
  ('ETH', 'ERC20', '0x8ba1f109551bD432803012645Hac136c60143013', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x8ba1f109551bD432803012645Hac136c60143013', true)
ON CONFLICT (currency, network) DO NOTHING;
