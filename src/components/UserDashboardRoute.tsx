
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
        // Not authenticated, redirect to auth page
        console.log('UserDashboardRoute - No user, redirecting to /auth');
        navigate('/auth', { replace: true });
      } else if (userRole === 'superadmin') {
        // Superadmin trying to access user dashboard, redirect to admin dashboard
        console.log('UserDashboardRoute - Superadmin detected, redirecting to /superadmin-dashboard');
        navigate('/superadmin-dashboard', { replace: true });
      }
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

  // Don't render if user is not authenticated or is superadmin
  if (!user || userRole === 'superadmin') {
    console.log('UserDashboardRoute - Blocking access:', { user: !!user, userRole });
    return null;
  }

  console.log('UserDashboardRoute - Allowing access for regular user');
  return <>{children}</>;
};

export default UserDashboardRoute;
