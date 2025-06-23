
-- First, let's make the user_id column nullable to allow anonymous submissions
ALTER TABLE public.customer_messages ALTER COLUMN user_id DROP NOT NULL;

-- Drop all existing policies and recreate them properly
DROP POLICY IF EXISTS "Allow contact form submissions" ON public.customer_messages;
DROP POLICY IF EXISTS "Allow users to view their own messages" ON public.customer_messages;
DROP POLICY IF EXISTS "Allow admins to view all messages" ON public.customer_messages;
DROP POLICY IF EXISTS "Allow admins to update messages" ON public.customer_messages;

-- Create a simple policy that allows anyone to insert messages
CREATE POLICY "Allow anyone to submit contact messages" 
  ON public.customer_messages 
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to view their own messages (including anonymous ones)
CREATE POLICY "Allow users to view their messages" 
  ON public.customer_messages 
  FOR SELECT 
  USING (
    user_id IS NULL OR 
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- Allow admins to view all messages
CREATE POLICY "Allow admins to view all messages" 
  ON public.customer_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Allow admins to update messages
CREATE POLICY "Allow admins to update messages" 
  ON public.customer_messages 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );
