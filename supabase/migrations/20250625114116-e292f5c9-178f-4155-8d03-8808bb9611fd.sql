
-- Add unique transfer ID to profiles table
ALTER TABLE public.profiles 
ADD COLUMN unique_transfer_id TEXT UNIQUE;

-- Create function to generate secure unique transfer IDs
CREATE OR REPLACE FUNCTION generate_unique_transfer_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 12-character alphanumeric ID (uppercase)
        new_id := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
        
        -- Check if this ID already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE unique_transfer_id = new_id) INTO id_exists;
        
        -- Exit loop if ID is unique
        IF NOT id_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- Update existing users to have unique transfer IDs
UPDATE public.profiles 
SET unique_transfer_id = generate_unique_transfer_id() 
WHERE unique_transfer_id IS NULL;

-- Make unique_transfer_id NOT NULL after populating existing records
ALTER TABLE public.profiles 
ALTER COLUMN unique_transfer_id SET NOT NULL;

-- Create trigger to auto-assign unique transfer ID for new users
CREATE OR REPLACE FUNCTION assign_unique_transfer_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.unique_transfer_id IS NULL THEN
        NEW.unique_transfer_id := generate_unique_transfer_id();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER assign_transfer_id_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_unique_transfer_id();

-- Create table for peer-to-peer transfers
CREATE TABLE public.peer_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) NOT NULL,
    recipient_transfer_id TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT
);

-- Enable RLS on peer_transfers
ALTER TABLE public.peer_transfers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for peer_transfers
CREATE POLICY "Users can view their own transfers" 
ON public.peer_transfers 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create transfers as sender" 
ON public.peer_transfers 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Create table for trade profit/loss tracking
CREATE TABLE public.trade_pnl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    trade_pair TEXT NOT NULL,
    trade_side TEXT NOT NULL CHECK (trade_side IN ('buy', 'sell', 'long', 'short')),
    entry_price NUMERIC NOT NULL,
    exit_price NUMERIC NOT NULL,
    trade_size NUMERIC NOT NULL,
    pnl_amount NUMERIC NOT NULL,
    pnl_percentage NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    trade_reference TEXT -- Reference to original trade if needed
);

-- Enable RLS on trade_pnl
ALTER TABLE public.trade_pnl ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for trade_pnl
CREATE POLICY "Users can view their own trade PnL" 
ON public.trade_pnl 
FOR ALL 
USING (auth.uid() = user_id);

-- Create function for peer-to-peer transfers
CREATE OR REPLACE FUNCTION execute_peer_transfer(
    p_sender_id UUID,
    p_recipient_transfer_id TEXT,
    p_currency TEXT,
    p_amount NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recipient_id UUID;
    v_sender_balance NUMERIC;
    v_transfer_id UUID;
BEGIN
    -- Find recipient by transfer ID
    SELECT id INTO v_recipient_id 
    FROM public.profiles 
    WHERE unique_transfer_id = p_recipient_transfer_id;
    
    IF v_recipient_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Recipient not found');
    END IF;
    
    -- Check if sender has sufficient balance
    SELECT available_balance INTO v_sender_balance
    FROM public.wallet_balances
    WHERE user_id = p_sender_id AND currency = p_currency;
    
    IF v_sender_balance IS NULL OR v_sender_balance < p_amount THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient balance');
    END IF;
    
    -- Cannot transfer to self
    IF p_sender_id = v_recipient_id THEN
        RETURN json_build_object('success', false, 'message', 'Cannot transfer to yourself');
    END IF;
    
    -- Execute the transfer
    BEGIN
        -- Deduct from sender
        PERFORM update_wallet_balance(p_sender_id, p_currency, p_amount, 'subtract');
        
        -- Add to recipient
        PERFORM update_wallet_balance(v_recipient_id, p_currency, p_amount, 'add');
        
        -- Record the transfer
        INSERT INTO public.peer_transfers (
            sender_id, recipient_id, recipient_transfer_id, currency, amount, notes
        ) VALUES (
            p_sender_id, v_recipient_id, p_recipient_transfer_id, p_currency, p_amount, p_notes
        ) RETURNING id INTO v_transfer_id;
        
        RETURN json_build_object(
            'success', true, 
            'message', 'Transfer completed successfully',
            'transfer_id', v_transfer_id
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Transfer failed: ' || SQLERRM);
    END;
END;
$$;

-- Create function to record trade PnL and update balance
CREATE OR REPLACE FUNCTION record_trade_pnl(
    p_user_id UUID,
    p_trade_pair TEXT,
    p_trade_side TEXT,
    p_entry_price NUMERIC,
    p_exit_price NUMERIC,
    p_trade_size NUMERIC,
    p_currency TEXT DEFAULT 'USDT'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pnl_amount NUMERIC;
    v_pnl_percentage NUMERIC;
BEGIN
    -- Calculate PnL based on trade side
    IF p_trade_side IN ('buy', 'long') THEN
        v_pnl_amount := (p_exit_price - p_entry_price) * p_trade_size;
    ELSE -- sell or short
        v_pnl_amount := (p_entry_price - p_exit_price) * p_trade_size;
    END IF;
    
    -- Calculate PnL percentage
    v_pnl_percentage := (v_pnl_amount / (p_entry_price * p_trade_size)) * 100;
    
    -- Record the PnL
    INSERT INTO public.trade_pnl (
        user_id, trade_pair, trade_side, entry_price, exit_price, 
        trade_size, pnl_amount, pnl_percentage, currency
    ) VALUES (
        p_user_id, p_trade_pair, p_trade_side, p_entry_price, p_exit_price,
        p_trade_size, v_pnl_amount, v_pnl_percentage, p_currency
    );
    
    -- Update user's wallet balance with PnL
    IF v_pnl_amount != 0 THEN
        IF v_pnl_amount > 0 THEN
            PERFORM update_wallet_balance(p_user_id, p_currency, v_pnl_amount, 'add');
        ELSE
            PERFORM update_wallet_balance(p_user_id, p_currency, ABS(v_pnl_amount), 'subtract');
        END IF;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'pnl_amount', v_pnl_amount,
        'pnl_percentage', v_pnl_percentage,
        'message', 'Trade PnL recorded and balance updated'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Failed to record PnL: ' || SQLERRM);
END;
$$;
