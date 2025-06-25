
-- Create the missing function to generate unique transfer IDs
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

-- Create the trigger function to assign unique transfer ID
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

-- Create the trigger on profiles table to auto-assign unique transfer ID
DROP TRIGGER IF EXISTS set_unique_transfer_id ON public.profiles;
CREATE TRIGGER set_unique_transfer_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION assign_unique_transfer_id();

-- Update existing profiles that don't have unique_transfer_id
UPDATE public.profiles 
SET unique_transfer_id = generate_unique_transfer_id()
WHERE unique_transfer_id IS NULL;
