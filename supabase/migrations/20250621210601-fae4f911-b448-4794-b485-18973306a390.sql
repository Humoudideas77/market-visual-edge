
-- Update the user with email 'sabilahmad@fann.art' to have superadmin role
UPDATE public.profiles 
SET role = 'superadmin'::user_role, updated_at = NOW()
WHERE email = 'sabilahmad@fann.art';

-- If the profile doesn't exist yet, we need to get the user ID from auth.users and insert it
-- This handles the case where the user signed up but the profile wasn't created automatically
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
SELECT 
    au.id, 
    au.email, 
    'superadmin'::user_role,
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email = 'sabilahmad@fann.art'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO UPDATE SET 
    role = 'superadmin'::user_role,
    updated_at = NOW();
