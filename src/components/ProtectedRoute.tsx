
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('ProtectedRoute - No user, redirecting to /auth');
        navigate('/auth', { replace: true });
        return;
      }
      
      if (userRole !== 'superadmin') {
        console.log('ProtectedRoute - Non-superadmin user, redirecting to /dashboard');
        navigate('/dashboard', { replace: true });
        return;
      }
      
      console.log('ProtectedRoute - Allowing access for superadmin');
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

  // Only render children if user is authenticated and is superadmin
  if (user && userRole === 'superadmin') {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoute;
