
-- Add fixed_pnl column to perpetual_positions table
ALTER TABLE public.perpetual_positions 
ADD COLUMN fixed_pnl NUMERIC DEFAULT NULL;
