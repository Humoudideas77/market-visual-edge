
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserDashboardRouteProps {
  children: React.ReactNode;
}

const UserDashboardRoute = ({ children }: UserDashboardRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check user role from database
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-role-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user && !authLoading,
  });

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        // Not authenticated, redirect to auth page
        navigate('/auth', { replace: true });
      } else if (userProfile?.role === 'superadmin') {
        // Superadmin trying to access user dashboard, redirect to admin dashboard
        navigate('/superadmin-dashboard', { replace: true });
      }
    }
  }, [user, userProfile, authLoading, profileLoading, navigate]);

  if (authLoading || profileLoading) {
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
  if (!user || userProfile?.role === 'superadmin') {
    return null;
  }

  return <>{children}</>;
};

export default UserDashboardRoute;
