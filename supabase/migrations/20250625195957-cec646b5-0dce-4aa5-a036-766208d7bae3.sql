
-- Create perpetual_positions table for storing perpetual trading positions
CREATE TABLE public.perpetual_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pair TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  size NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  leverage NUMERIC NOT NULL,
  margin NUMERIC NOT NULL,
  liquidation_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Add Row Level Security (RLS)
ALTER TABLE public.perpetual_positions ENABLE ROW LEVEL SECURITY;

-- Create policies for perpetual_positions
CREATE POLICY "Users can view their own positions" 
  ON public.perpetual_positions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own positions" 
  ON public.perpetual_positions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions" 
  ON public.perpetual_positions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own positions" 
  ON public.perpetual_positions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_perpetual_positions_user_id ON public.perpetual_positions(user_id);
CREATE INDEX idx_perpetual_positions_pair ON public.perpetual_positions(pair);
CREATE INDEX idx_perpetual_positions_status ON public.perpetual_positions(status);
