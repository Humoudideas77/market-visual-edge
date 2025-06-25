
-- First, let's check if the profiles table has the correct structure and constraints
-- Ensure unique_transfer_id column exists and has proper constraints
ALTER TABLE public.profiles 
ALTER COLUMN unique_transfer_id DROP NOT NULL;

-- Make sure the column has a proper unique constraint
DROP INDEX IF EXISTS idx_profiles_unique_transfer_id;
CREATE UNIQUE INDEX idx_profiles_unique_transfer_id ON public.profiles(unique_transfer_id) WHERE unique_transfer_id IS NOT NULL;

-- Recreate the trigger to ensure it's working properly
DROP TRIGGER IF EXISTS set_unique_transfer_id ON public.profiles;
CREATE TRIGGER set_unique_transfer_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION assign_unique_transfer_id();

-- Update the handle_new_user function to work with the unique_transfer_id requirement
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
