
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
}

const PublicRoute = ({ children, redirectIfAuthenticated = false }: PublicRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && redirectIfAuthenticated) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate, redirectIfAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-exchange-bg flex items-center justify-center">
        <div className="text-exchange-text-secondary">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicRoute;
