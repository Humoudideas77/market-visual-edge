
-- Create customer messages table
CREATE TABLE IF NOT EXISTS public.customer_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  admin_reply TEXT,
  admin_id UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trading chat messages table
CREATE TABLE IF NOT EXISTS public.trading_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trading_enabled BOOLEAN DEFAULT true;

-- Update kyc_submissions table to match the code expectations
ALTER TABLE public.kyc_submissions 
ADD COLUMN IF NOT EXISTS personal_id_number TEXT,
ADD COLUMN IF NOT EXISTS front_document_url TEXT,
ADD COLUMN IF NOT EXISTS back_document_url TEXT;

-- Enable RLS on new tables
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_chat_messages ENABLE ROW LEVEL SECURITY;

-- Customer messages policies
CREATE POLICY "Users can view their own messages" 
  ON public.customer_messages 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" 
  ON public.customer_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all messages" 
  ON public.customer_messages 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Trading chat policies
CREATE POLICY "Users can view all chat messages" 
  ON public.trading_chat_messages 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create chat messages" 
  ON public.trading_chat_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER TABLE public.trading_chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_chat_messages;

-- Enable realtime for customer messages (for admin notifications)
ALTER TABLE public.customer_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_messages;
