
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
      } else if (!isSuperAdmin) {
        console.log('User is not superadmin, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
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

  if (!user || !isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default SuperAdminRoute;
