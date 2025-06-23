
-- Enable RLS on tables if not already enabled
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can create their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create their own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can view their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Users can create their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Users can update their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Users can delete their own bank cards" ON public.bank_cards;

-- Create RLS policies for deposit_requests
CREATE POLICY "Users can view their own deposit requests" 
  ON public.deposit_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposit requests" 
  ON public.deposit_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for bank_cards
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

-- Allow admins to view and update all records
CREATE POLICY "Admins can view all deposit requests" 
  ON public.deposit_requests 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can view all withdrawal requests" 
  ON public.withdrawal_requests 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can view all bank cards" 
  ON public.bank_cards 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );
