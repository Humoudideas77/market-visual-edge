
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { user, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth', { replace: true });
      } else if (user.email !== 'xgroup7509@gmail.com') {
        console.log('User is not the designated super admin email, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else if (!isSuperAdmin && user.email === 'xgroup7509@gmail.com') {
        // Force Super Admin status for the designated email
        console.log('Forcing Super Admin access for designated email');
      }
    }
  }, [user, loading, navigate, isSuperAdmin]);

  if (loading) {
    return (
      <div className="admin-dashboard-bg flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <div className="text-white text-base font-bold">Verifying Super Admin Access...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Only allow access for the designated Super Admin email
  if (user.email !== 'xgroup7509@gmail.com') {
    return null;
  }

  return <>{children}</>;
};

export default SuperAdminRoute;
