
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('PublicRoute - Auth state:', { user: user?.email, userRole, loading });
    
    if (!loading && user && userRole !== null) {
      console.log('PublicRoute - Redirecting authenticated user with role:', userRole);
      
      if (userRole === 'superadmin') {
        console.log('PublicRoute - Redirecting superadmin to /superadmin-dashboard');
        navigate('/superadmin-dashboard', { replace: true });
      } else {
        console.log('PublicRoute - Redirecting regular user to /dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, userRole, loading, navigate]);

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

  // Only render children if user is not authenticated or role is not yet determined
  if (!user || userRole === null) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
};

export default PublicRoute;
