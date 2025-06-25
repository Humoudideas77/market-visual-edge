
-- First, drop the existing trigger that depends on the function
DROP TRIGGER IF EXISTS assign_transfer_id_trigger ON public.profiles;
DROP TRIGGER IF EXISTS set_unique_transfer_id ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS public.assign_unique_transfer_id();
DROP FUNCTION IF EXISTS public.generate_unique_transfer_id();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the generate_unique_transfer_id function
CREATE OR REPLACE FUNCTION public.generate_unique_transfer_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 12-character alphanumeric ID (uppercase)
        new_id := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
        
        -- Check if this ID already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE unique_transfer_id = new_id) INTO id_exists;
        
        -- Exit loop if ID is unique
        IF NOT id_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- Create the assign_unique_transfer_id function
CREATE OR REPLACE FUNCTION public.assign_unique_transfer_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.unique_transfer_id IS NULL THEN
        NEW.unique_transfer_id := public.generate_unique_transfer_id();
    END IF;
    RETURN NEW;
END;
$$;

-- Create the trigger on profiles table
CREATE TRIGGER set_unique_transfer_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.assign_unique_transfer_id();

-- Update the handle_new_user function to work correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.generate_unique_transfer_id() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.assign_unique_transfer_id() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;

-- Ensure the unique_transfer_id column exists and has proper constraints
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_transfer_id TEXT UNIQUE;

-- Update existing profiles that don't have a unique_transfer_id
UPDATE public.profiles 
SET unique_transfer_id = public.generate_unique_transfer_id() 
WHERE unique_transfer_id IS NULL;
