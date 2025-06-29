
-- First, remove all existing superadmin roles
UPDATE public.profiles 
SET role = 'user'::user_role, updated_at = NOW()
WHERE role = 'superadmin';

-- Delete any duplicate profile entries to prevent the "multiple rows" error
DELETE FROM public.profiles p1 
WHERE EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.email = p1.email 
    AND p2.id > p1.id
);

-- Now set only xgroup7509@gmail.com as superadmin
UPDATE public.profiles 
SET role = 'superadmin'::user_role, updated_at = NOW()
WHERE email = 'xgroup7509@gmail.com';

-- If the profile doesn't exist yet, create it
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
SELECT 
    au.id, 
    au.email, 
    'superadmin'::user_role,
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email = 'xgroup7509@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO UPDATE SET 
    role = 'superadmin'::user_role,
    email = 'xgroup7509@gmail.com',
    updated_at = NOW();

-- Clean up any orphaned profiles (profiles without corresponding auth users)
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);
