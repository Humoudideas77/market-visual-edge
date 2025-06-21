
-- Create mining_investments table
CREATE TABLE public.mining_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  investment_amount NUMERIC NOT NULL,
  daily_return_rate NUMERIC NOT NULL,
  maturity_days INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_earned NUMERIC NOT NULL DEFAULT 0,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  next_payout_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mining_payouts table
CREATE TABLE public.mining_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.mining_investments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payout_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.mining_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_payouts ENABLE ROW LEVEL SECURITY;

-- Create policies for mining_investments
CREATE POLICY "Users can view their own mining investments" 
  ON public.mining_investments 
  FOR SELECT 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own mining investments" 
  ON public.mining_investments 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own mining investments" 
  ON public.mining_investments 
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

-- Create policies for mining_payouts (users can only view, system creates payouts)
CREATE POLICY "Users can view their mining payouts" 
  ON public.mining_payouts 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.mining_investments 
      WHERE id = mining_payouts.investment_id 
      AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "System can create mining payouts" 
  ON public.mining_payouts 
  FOR INSERT 
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_mining_investments_user_id ON public.mining_investments(user_id);
CREATE INDEX idx_mining_investments_status ON public.mining_investments(status);
CREATE INDEX idx_mining_investments_next_payout_date ON public.mining_investments(next_payout_date);
CREATE INDEX idx_mining_payouts_investment_id ON public.mining_payouts(investment_id);
