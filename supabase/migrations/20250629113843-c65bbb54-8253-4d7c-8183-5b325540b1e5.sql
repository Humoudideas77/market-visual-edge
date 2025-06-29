
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "SuperAdmin can view all perpetual positions" ON public.perpetual_positions;
DROP POLICY IF EXISTS "SuperAdmin can update all perpetual positions" ON public.perpetual_positions;
DROP POLICY IF EXISTS "Users can view own positions" ON public.perpetual_positions;
DROP POLICY IF EXISTS "Users can insert own positions" ON public.perpetual_positions;
DROP POLICY IF EXISTS "Users can update own positions" ON public.perpetual_positions;

-- Enable RLS on perpetual_positions if not already enabled
ALTER TABLE public.perpetual_positions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own positions
CREATE POLICY "Users can view own positions" 
  ON public.perpetual_positions 
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own positions
CREATE POLICY "Users can insert own positions" 
  ON public.perpetual_positions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own positions
CREATE POLICY "Users can update own positions" 
  ON public.perpetual_positions 
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid());

-- Allow SuperAdmin to view ALL perpetual positions
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

-- Allow SuperAdmin to update ALL perpetual positions
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

-- Ensure realtime is properly configured for perpetual_positions
ALTER TABLE public.perpetual_positions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.perpetual_positions;

-- Also ensure profiles table has proper RLS for superadmin access
DROP POLICY IF EXISTS "SuperAdmin can view all profiles" ON public.profiles;

CREATE POLICY "SuperAdmin can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'superadmin'
    )
  );
