
-- Add policies for SuperAdmin to manage all perpetual positions

-- Policy for SuperAdmin to view all perpetual positions
CREATE POLICY "SuperAdmin can view all perpetual positions" 
  ON public.perpetual_positions 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Policy for SuperAdmin to update all perpetual positions
CREATE POLICY "SuperAdmin can update all perpetual positions" 
  ON public.perpetual_positions 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Policy for SuperAdmin to delete all perpetual positions (if needed)
CREATE POLICY "SuperAdmin can delete all perpetual positions" 
  ON public.perpetual_positions 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Policy for SuperAdmin to view all profiles
CREATE POLICY "SuperAdmin can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'superadmin'
    )
  );
