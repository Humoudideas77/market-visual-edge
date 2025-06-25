
-- First, let's ensure the generate_unique_transfer_id function exists
CREATE OR REPLACE FUNCTION public.generate_unique_transfer_id()
RETURNS text
LANGUAGE plpgsql
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

-- Now create the trigger function that depends on the above function
CREATE OR REPLACE FUNCTION public.assign_unique_transfer_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.unique_transfer_id IS NULL THEN
        NEW.unique_transfer_id := generate_unique_transfer_id();
    END IF;
    RETURN NEW;
END;
$$;

-- Drop existing trigger to recreate it
DROP TRIGGER IF EXISTS set_unique_transfer_id ON public.profiles;

-- Create the trigger
CREATE TRIGGER set_unique_transfer_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION assign_unique_transfer_id();

-- Ensure the handle_new_user function works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

-- Make sure the trigger on auth.users exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
