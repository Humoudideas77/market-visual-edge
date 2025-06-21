
-- Create table for storing user bank card details
CREATE TABLE public.bank_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  bank_name TEXT NOT NULL,
  bank_number TEXT NOT NULL,
  bank_address TEXT NOT NULL,
  swift_code TEXT NOT NULL,
  payee_name TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  payee_address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for deposit requests
CREATE TABLE public.deposit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  transaction_screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for withdrawal requests
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  bank_card_id UUID REFERENCES public.bank_cards NOT NULL,
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin-managed crypto addresses and QR codes
CREATE TABLE public.crypto_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(currency, network)
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.bank_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_addresses ENABLE ROW LEVEL SECURITY;

-- Bank cards policies
CREATE POLICY "Users can view their own bank cards" 
  ON public.bank_cards 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bank cards" 
  ON public.bank_cards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank cards" 
  ON public.bank_cards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank cards" 
  ON public.bank_cards 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Deposit requests policies
CREATE POLICY "Users can view their own deposit requests" 
  ON public.deposit_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposit requests" 
  ON public.deposit_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Crypto addresses policies (read-only for users)
CREATE POLICY "Users can view active crypto addresses" 
  ON public.crypto_addresses 
  FOR SELECT 
  USING (is_active = true);

-- Insert some sample crypto addresses for testing
INSERT INTO public.crypto_addresses (currency, network, wallet_address, qr_code_url) VALUES
('BTC', 'Bitcoin', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'),
('ETH', 'ERC20', '0x742f96ad71cF4a6E5d7efF79C9b4e46Ae6ba1b3C', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x742f96ad71cF4a6E5d7efF79C9b4e46Ae6ba1b3C'),
('USDT', 'ERC20', '0x742f96ad71cF4a6E5d7efF79C9b4e46Ae6ba1b3C', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x742f96ad71cF4a6E5d7efF79C9b4e46Ae6ba1b3C'),
('USDT', 'TRC20', 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'),
('BNB', 'BEP20', 'bnb1s9nh6hkhsrvz62chql5c3zc3v9j8sxq3c4g5h2', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bnb1s9nh6hkhsrvz62chql5c3zc3v9j8sxq3c4g5h2'),
('SOL', 'Solana', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzOBHpTZAhD6CKZBht', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzOBHpTZAhD6CKZBht');
