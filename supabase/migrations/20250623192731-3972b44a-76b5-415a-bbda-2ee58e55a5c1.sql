
-- Clean up all existing policies first to avoid conflicts
DO $$
BEGIN
    -- Drop all existing policies on deposit_requests
    DROP POLICY IF EXISTS "Users can insert their own deposit requests" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Users can view their own deposit requests" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Superadmins can do everything with deposit requests" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Admins can do everything with deposit requests" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Admins can manage all deposit requests" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Users can create deposit requests" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Users can view own deposit requests" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Admins can update deposit requests" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Enable select for users on their own data" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Enable all for superadmins" ON public.deposit_requests;
    DROP POLICY IF EXISTS "Enable all for admins" ON public.deposit_requests;

    -- Drop all existing policies on withdrawal_requests
    DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Users can create their own withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Admins can manage all withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Users can create withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON public.withdrawal_requests;

    -- Drop all existing policies on profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Superadmins can update all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Enable insert for new profiles" ON public.profiles;

    -- Drop all existing policies on wallet_balances
    DROP POLICY IF EXISTS "Users can view their own wallet balances" ON public.wallet_balances;
    DROP POLICY IF EXISTS "Users can insert their own wallet balances" ON public.wallet_balances;
    DROP POLICY IF EXISTS "Users can update their own wallet balances" ON public.wallet_balances;
    DROP POLICY IF EXISTS "Users can manage own wallet balances" ON public.wallet_balances;
END $$;

-- Create security definer functions to check user roles without causing recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid 
    AND role IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin_user(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid 
    AND role = 'superadmin'
  );
$$;

-- Ensure all required tables have RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

-- Create new non-recursive policies for profiles
CREATE POLICY "profiles_select_own" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Create policies for deposit_requests
CREATE POLICY "deposit_requests_insert" 
  ON public.deposit_requests 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deposit_requests_select" 
  ON public.deposit_requests 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id OR public.is_admin_user(auth.uid()));

CREATE POLICY "deposit_requests_update" 
  ON public.deposit_requests 
  FOR UPDATE 
  TO authenticated 
  USING (public.is_admin_user(auth.uid()));

-- Create policies for withdrawal_requests
CREATE POLICY "withdrawal_requests_insert" 
  ON public.withdrawal_requests 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "withdrawal_requests_select" 
  ON public.withdrawal_requests 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id OR public.is_admin_user(auth.uid()));

CREATE POLICY "withdrawal_requests_update" 
  ON public.withdrawal_requests 
  FOR UPDATE 
  TO authenticated 
  USING (public.is_admin_user(auth.uid()));

-- Create policies for wallet_balances
CREATE POLICY "wallet_balances_all" 
  ON public.wallet_balances 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id OR public.is_admin_user(auth.uid()));
