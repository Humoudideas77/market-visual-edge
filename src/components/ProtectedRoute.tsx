
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireSuperAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth', { replace: true });
      } else if (requireSuperAdmin && !isSuperAdmin) {
        console.log('User is not superadmin, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else if (!requireSuperAdmin && isSuperAdmin) {
        console.log('Superadmin trying to access user area, redirecting to superadmin dashboard');
        navigate('/superadmin-dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate, requireSuperAdmin, isSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-exchange-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-exchange-text-secondary">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return null;
  }

  if (!requireSuperAdmin && isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
