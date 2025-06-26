
-- Create wallet_balances table
CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,
    available_balance DECIMAL(20, 8) DEFAULT 0,
    locked_balance DECIMAL(20, 8) DEFAULT 0,
    total_balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Create bank_cards table
CREATE TABLE IF NOT EXISTS bank_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS crypto_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(currency, network)
);

-- Create mining_investments table
CREATE TABLE IF NOT EXISTS mining_investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    status TEXT DEFAULT 'active',
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    daily_return_rate DECIMAL(5, 4) NOT NULL,
    total_earned DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mining_payouts table
CREATE TABLE IF NOT EXISTS mining_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    investment_id UUID REFERENCES mining_investments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    payout_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deposit_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS deposit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    network TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    transaction_screenshot_url TEXT,
    admin_notes TEXT,
    admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;

-- Wallet balances policies
CREATE POLICY "Users can view own wallet balances" ON wallet_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet balances" ON wallet_balances
    FOR ALL USING (auth.uid() = user_id);

-- Bank cards policies
CREATE POLICY "Users can manage own bank cards" ON bank_cards
    FOR ALL USING (auth.uid() = user_id);

-- Crypto addresses policies (public read)
CREATE POLICY "Anyone can view crypto addresses" ON crypto_addresses
    FOR SELECT USING (true);

-- Mining investments policies
CREATE POLICY "Users can manage own mining investments" ON mining_investments
    FOR ALL USING (auth.uid() = user_id);

-- Mining payouts policies
CREATE POLICY "Users can view own mining payouts" ON mining_payouts
    FOR SELECT USING (auth.uid() = user_id);

-- Deposit requests policies
CREATE POLICY "Users can manage own deposit requests" ON deposit_requests
    FOR ALL USING (auth.uid() = user_id);

-- Create wallet balance update function
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
            ELSE wallet_balances.available_balance - p_amount
        END,
        total_balance = CASE 
            WHEN p_operation = 'add' THEN wallet_balances.total_balance + p_amount
            ELSE wallet_balances.total_balance - p_amount
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default crypto addresses
INSERT INTO crypto_addresses (currency, network, address, qr_code_url) VALUES
('USDT', 'TRC20', 'TXYZabcd1234567890ABCDEF', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TXYZabcd1234567890ABCDEF'),
('BTC', 'Bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'),
('ETH', 'ERC20', '0x742d35Cc6644C4532B0B8B3B0d2B66cFB8DfC565', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x742d35Cc6644C4532B0B8B3B0d2B66cFB8DfC565')
ON CONFLICT (currency, network) DO NOTHING;
