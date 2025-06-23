
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface UserDashboardRouteProps {
  children: React.ReactNode;
}

const UserDashboardRoute = ({ children }: UserDashboardRouteProps) => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('UserDashboardRoute - Auth state:', { user: user?.email, userRole, authLoading });
    
    if (!authLoading) {
      if (!user) {
        console.log('UserDashboardRoute - No user, redirecting to /auth');
        navigate('/auth', { replace: true });
        return;
      }
      
      if (userRole === 'superadmin') {
        console.log('UserDashboardRoute - Superadmin detected, redirecting to /superadmin-dashboard');
        navigate('/superadmin-dashboard', { replace: true });
        return;
      }
      
      console.log('UserDashboardRoute - Allowing access for regular user');
    }
  }, [user, userRole, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-exchange-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-exchange-text-secondary">Loading...</div>
        </div>
      </div>
    );
  }

  // Only render children if user is authenticated and not superadmin
  if (!user || userRole === 'superadmin') {
    return null;
  }

  return <>{children}</>;
};

export default UserDashboardRoute;
