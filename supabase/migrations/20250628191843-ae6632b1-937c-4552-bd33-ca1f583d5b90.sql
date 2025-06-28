
-- Create a comprehensive user activities tracking system

-- First, let's ensure we have proper activity logging for all user actions
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_activities (
    user_id, 
    activity_type, 
    device_info, 
    ip_address, 
    user_agent,
    created_at
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_details,
    p_ip_address,
    p_user_agent,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically log activities for key tables

-- Trigger for deposit requests
CREATE OR REPLACE FUNCTION log_deposit_activity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_user_activity(
      NEW.user_id,
      'deposit_request_created',
      jsonb_build_object(
        'amount', NEW.amount,
        'currency', NEW.currency,
        'network', NEW.network,
        'status', NEW.status
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_user_activity(
      NEW.user_id,
      'deposit_status_changed',
      jsonb_build_object(
        'amount', NEW.amount,
        'currency', NEW.currency,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'admin_id', NEW.admin_id
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for withdrawal requests  
CREATE OR REPLACE FUNCTION log_withdrawal_activity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_user_activity(
      NEW.user_id,
      'withdrawal_request_created',
      jsonb_build_object(
        'amount', NEW.amount,
        'currency', NEW.currency,
        'network', NEW.network,
        'status', NEW.status
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_user_activity(
      NEW.user_id,
      'withdrawal_status_changed',
      jsonb_build_object(
        'amount', NEW.amount,
        'currency', NEW.currency,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'admin_id', NEW.admin_id
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for KYC submissions
CREATE OR REPLACE FUNCTION log_kyc_activity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_user_activity(
      NEW.user_id,
      'kyc_submission_created',
      jsonb_build_object(
        'full_name', NEW.full_name,
        'nationality', NEW.nationality,
        'status', NEW.status
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_user_activity(
      NEW.user_id,
      'kyc_status_changed',
      jsonb_build_object(
        'full_name', NEW.full_name,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'admin_id', NEW.admin_id
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for trades (trade_pnl table)
CREATE OR REPLACE FUNCTION log_trade_activity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_user_activity(
      NEW.user_id,
      'trade_executed',
      jsonb_build_object(
        'trade_pair', NEW.trade_pair,
        'trade_side', NEW.trade_side,
        'entry_price', NEW.entry_price,
        'exit_price', NEW.exit_price,
        'trade_size', NEW.trade_size,
        'pnl_amount', NEW.pnl_amount,
        'pnl_percentage', NEW.pnl_percentage,
        'currency', NEW.currency
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS deposit_activity_trigger ON deposit_requests;
DROP TRIGGER IF EXISTS withdrawal_activity_trigger ON withdrawal_requests;
DROP TRIGGER IF EXISTS kyc_activity_trigger ON kyc_submissions;
DROP TRIGGER IF EXISTS trade_activity_trigger ON trade_pnl;

-- Create the triggers
CREATE TRIGGER deposit_activity_trigger
  AFTER INSERT OR UPDATE ON deposit_requests
  FOR EACH ROW EXECUTE FUNCTION log_deposit_activity();

CREATE TRIGGER withdrawal_activity_trigger
  AFTER INSERT OR UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION log_withdrawal_activity();

CREATE TRIGGER kyc_activity_trigger
  AFTER INSERT OR UPDATE ON kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION log_kyc_activity();

CREATE TRIGGER trade_activity_trigger
  AFTER INSERT ON trade_pnl
  FOR EACH ROW EXECUTE FUNCTION log_trade_activity();

-- Enable realtime for user_activities table
ALTER TABLE user_activities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE user_activities;

-- Create admin notification preferences table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users NOT NULL,
  notification_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, notification_type)
);

-- Enable RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin notifications policies
CREATE POLICY "Admins can manage their notifications" 
  ON public.admin_notifications 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );
