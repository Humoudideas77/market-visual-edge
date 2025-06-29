
-- Create RPC function for SuperAdmin to get all perpetual positions
CREATE OR REPLACE FUNCTION public.get_all_perpetual_positions_for_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  pair text,
  side text,
  size numeric,
  entry_price numeric,
  exit_price numeric,
  leverage numeric,
  margin numeric,
  liquidation_price numeric,
  status text,
  created_at timestamp with time zone,
  closed_at timestamp with time zone,
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is a superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Access denied. SuperAdmin role required.';
  END IF;

  -- Return all active perpetual positions with user email
  RETURN QUERY
  SELECT 
    pp.id,
    pp.user_id,
    pp.pair,
    pp.side,
    pp.size,
    pp.entry_price,
    pp.exit_price,
    pp.leverage,
    pp.margin,
    pp.liquidation_price,
    pp.status,
    pp.created_at,
    pp.closed_at,
    COALESCE(p.email, 'Unknown User') as user_email
  FROM public.perpetual_positions pp
  LEFT JOIN public.profiles p ON pp.user_id = p.id
  WHERE pp.status = 'active'
  ORDER BY pp.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_perpetual_positions_for_admin() TO authenticated;
