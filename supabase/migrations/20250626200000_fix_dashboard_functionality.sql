
-- Drop existing tables if they have issues
DROP TABLE IF EXISTS mining_payouts CASCADE;
DROP TABLE IF EXISTS mining_investments CASCADE;
DROP TABLE IF EXISTS deposit_requests CASCADE;
DROP TABLE IF EXISTS wallet_balances CASCADE;
DROP TABLE IF EXISTS bank_cards CASCADE;
DROP TABLE IF EXISTS crypto_addresses CASCADE;
DROP TABLE IF EXISTS kyc_submissions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table first (referenced by other tables)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'resubmission_required')),
    kyc_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet_balances table
CREATE TABLE wallet_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    currency TEXT NOT NULL,
    available_balance DECIMAL(20, 8) DEFAULT 0,
    locked_balance DECIMAL(20, 8) DEFAULT 0,
    total_balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Create bank_cards table
CREATE TABLE bank_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_address TEXT NOT NULL,
    swift_code TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create crypto_addresses table
CREATE TABLE crypto_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency TEXT NOT NULL,
    network TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(currency, network)
);

-- Create mining_investments table
CREATE TABLE mining_investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_name TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    investment_amount DECIMAL(20, 8) NOT NULL,
    daily_return_rate DECIMAL(5, 4) NOT NULL,
    maturity_days INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    next_payout_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day'),
    total_earned DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mining_payouts table
CREATE TABLE mining_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    investment_id UUID REFERENCES mining_investments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    payout_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deposit_requests table
CREATE TABLE deposit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    network TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    transaction_screenshot_url TEXT,
    admin_notes TEXT,
    admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create KYC submissions table
CREATE TABLE kyc_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'resubmission_required')),
    document_type TEXT NOT NULL,
    document_front_url TEXT,
    document_back_url TEXT,
    selfie_url TEXT,
    admin_notes TEXT,
    admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for wallet_balances
CREATE POLICY "Users can view own wallet balances" ON wallet_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet balances" ON wallet_balances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet balances" ON wallet_balances
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for bank_cards
CREATE POLICY "Users can manage own bank cards" ON bank_cards
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for crypto_addresses (public read)
CREATE POLICY "Anyone can view crypto addresses" ON crypto_addresses
    FOR SELECT USING (true);

-- Create RLS policies for mining_investments
CREATE POLICY "Users can manage own mining investments" ON mining_investments
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for mining_payouts
CREATE POLICY "Users can view own mining payouts" ON mining_payouts
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for deposit_requests
CREATE POLICY "Users can manage own deposit requests" ON deposit_requests
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for kyc_submissions
CREATE POLICY "Users can manage own kyc submissions" ON kyc_submissions
    FOR ALL USING (auth.uid() = user_id);

-- Create or replace wallet balance update function
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_user_id UUID,
    p_currency TEXT,
    p_amount DECIMAL(20, 8),
    p_operation TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update wallet balance
    INSERT INTO wallet_balances (user_id, currency, available_balance, total_balance)
    VALUES (p_user_id, p_currency, 
        CASE WHEN p_operation = 'add' THEN p_amount ELSE -p_amount END,
        CASE WHEN p_operation = 'add' THEN p_amount ELSE -p_amount END
    )
    ON CONFLICT (user_id, currency)
    DO UPDATE SET
        available_balance = CASE 
            WHEN p_operation = 'add' THEN wallet_balances.available_balance + p_amount
            ELSE GREATEST(wallet_balances.available_balance - p_amount, 0)
        END,
        total_balance = CASE 
            WHEN p_operation = 'add' THEN wallet_balances.total_balance + p_amount
            ELSE GREATEST(wallet_balances.total_balance - p_amount, 0)
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process mining payouts
CREATE OR REPLACE FUNCTION process_mining_payouts()
RETURNS VOID AS $$
DECLARE
    investment_record RECORD;
    payout_amount DECIMAL(20, 8);
BEGIN
    -- Process all active investments that are due for payout
    FOR investment_record IN 
        SELECT * FROM mining_investments 
        WHERE status = 'active' 
        AND next_payout_date <= NOW()
    LOOP
        -- Calculate payout amount
        payout_amount := (investment_record.investment_amount * investment_record.daily_return_rate / 100);
        
        -- Create payout record
        INSERT INTO mining_payouts (investment_id, user_id, amount)
        VALUES (investment_record.id, investment_record.user_id, payout_amount);
        
        -- Update wallet balance
        PERFORM update_wallet_balance(
            investment_record.user_id,
            'USDT',
            payout_amount,
            'add'
        );
        
        -- Update investment
        UPDATE mining_investments 
        SET 
            total_earned = total_earned + payout_amount,
            next_payout_date = next_payout_date + INTERVAL '1 day',
            updated_at = NOW()
        WHERE id = investment_record.id;
        
        -- Check if investment has matured
        IF investment_record.start_date + (investment_record.maturity_days || ' days')::INTERVAL <= NOW() THEN
            UPDATE mining_investments 
            SET status = 'completed', end_date = NOW()
            WHERE id = investment_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default crypto addresses
INSERT INTO crypto_addresses (currency, network, wallet_address, qr_code_url) VALUES
('USDT', 'TRC20', 'TXYZabcd1234567890ABCDEF', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TXYZabcd1234567890ABCDEF'),
('BTC', 'Bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'),
('ETH', 'ERC20', '0x742d35Cc6644C4532B0B8B3B0d2B66cFB8DfC565', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x742d35Cc6644C4532B0B8B3B0d2B66cFB8DfC565'),
('BNB', 'BSC', '0x742d35Cc6644C4532B0B8B3B0d2B66cFB8DfC565', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x742d35Cc6644C4532B0B8B3B0d2B66cFB8DfC565'),
('SOL', 'Solana', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
ON CONFLICT (currency, network) DO NOTHING;

-- Create storage bucket for deposit screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-screenshots', 'deposit-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for kyc documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for deposit screenshots
CREATE POLICY "Users can upload deposit screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'deposit-screenshots' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own deposit screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'deposit-screenshots' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create storage policies for KYC documents
CREATE POLICY "Users can upload KYC documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create trigger to automatically create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();
