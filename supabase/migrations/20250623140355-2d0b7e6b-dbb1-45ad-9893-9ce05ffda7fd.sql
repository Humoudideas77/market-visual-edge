
-- Create wallet_balances table
CREATE TABLE public.wallet_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  available_balance NUMERIC NOT NULL DEFAULT 0,
  locked_balance NUMERIC NOT NULL DEFAULT 0,
  total_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Enable RLS
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own wallet balances" 
  ON public.wallet_balances 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet balances" 
  ON public.wallet_balances 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet balances" 
  ON public.wallet_balances 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_currency TEXT,
  p_amount NUMERIC,
  p_operation TEXT -- 'add' or 'subtract'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update wallet balance
  INSERT INTO public.wallet_balances (user_id, currency, available_balance, total_balance)
  VALUES (p_user_id, p_currency, 
    CASE WHEN p_operation = 'add' THEN p_amount ELSE -p_amount END,
    CASE WHEN p_operation = 'add' THEN p_amount ELSE -p_amount END)
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
    updated_at = now()
  WHERE 
    (p_operation = 'subtract' AND wallet_balances.available_balance >= p_amount)
    OR p_operation = 'add';
    
  -- Check if operation was successful for subtraction
  IF p_operation = 'subtract' AND NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal';
  END IF;
END;
$$;

-- Enable realtime for wallet_balances
ALTER TABLE public.wallet_balances REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_balances;
