
-- Fix the customer_messages table RLS policies to allow proper access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.customer_messages;
DROP POLICY IF EXISTS "Allow users to view their own messages" ON public.customer_messages;
DROP POLICY IF EXISTS "Allow admins to view all messages" ON public.customer_messages;

-- Create new policies that allow proper access
-- Allow anyone (authenticated or not) to insert contact messages
CREATE POLICY "Allow contact form submissions" 
  ON public.customer_messages 
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to view their own messages if they are authenticated
CREATE POLICY "Allow users to view their own messages" 
  ON public.customer_messages 
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR user_id IS NULL)
  );

-- Allow admins and superadmins to view all messages
CREATE POLICY "Allow admins to view all messages" 
  ON public.customer_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Allow admins to update message status
CREATE POLICY "Allow admins to update messages" 
  ON public.customer_messages 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );
