
# Superadmin Credentials (Development Environment Only)

**⚠️ WARNING: This file contains sensitive information and should NEVER be committed to version control or deployed to production.**

## Superadmin Test Account

For development and testing purposes only:

- **Email:** admin@mexcpro.dev
- **Password:** SuperAdmin2024!
- **Role:** superadmin

## Security Notes

1. These credentials are for development/testing ONLY
2. In production, use strong, unique credentials
3. Enable 2FA for admin accounts
4. Regularly rotate admin passwords
5. Monitor admin activity logs
6. Restrict admin access by IP if possible

## Creating Superadmin Account

To create the superadmin account in your database:

```sql
-- This should be run in your Supabase SQL editor
-- First, sign up normally with the email above, then run:

UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'admin@mexcpro.dev';

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'superadmin'::user_role
FROM auth.users 
WHERE email = 'admin@mexcpro.dev'
ON CONFLICT (id) DO UPDATE SET role = 'superadmin'::user_role;
```

## Access URLs

- **Admin Dashboard:** `/admin`
- **User Management:** Available within admin dashboard
- **KYC Management:** Available within admin dashboard
- **Deposit/Withdrawal Approvals:** Available within admin dashboard

Remember to delete this file before deploying to production!
