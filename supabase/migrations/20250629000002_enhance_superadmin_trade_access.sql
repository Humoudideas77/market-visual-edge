
-- Add SuperAdmin policies for perpetual_positions to allow viewing and managing all trades
CREATE POLICY "SuperAdmin can view all perpetual positions" 
  ON public.perpetual_positions 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "SuperAdmin can update all perpetual positions" 
  ON public.perpetual_positions 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

-- Enable realtime for perpetual_positions table
ALTER TABLE public.perpetual_positions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.perpetual_positions;
