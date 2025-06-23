
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can create their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposit requests" ON public.deposit_requests;

-- Create working RLS policies for deposit_requests
CREATE POLICY "Users can view their own deposit requests" 
  ON public.deposit_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposit requests" 
  ON public.deposit_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to view and manage all deposit requests
CREATE POLICY "Admins can manage all deposit requests" 
  ON public.deposit_requests 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Also fix bank_cards table policies while we're at it
DROP POLICY IF EXISTS "Users can view their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Users can create their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Users can update their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Users can delete their own bank cards" ON public.bank_cards;
DROP POLICY IF EXISTS "Admins can view all bank cards" ON public.bank_cards;

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

CREATE POLICY "Admins can manage all bank cards" 
  ON public.bank_cards 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );
