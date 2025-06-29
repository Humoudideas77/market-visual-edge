
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  isAdmin: false,
  isSuperAdmin: false,
  signOut: async () => {},
  refreshUserRole: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const refreshUserRole = async () => {
    if (!user?.id) {
      setUserRole(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      return;
    }

    try {
      console.log('Refreshing user role for user:', user.email);
      
      // Use the new secure function to get user role
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role_secure', {
        user_uuid: user.id
      });

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        setUserRole('user');
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      const role = roleData || 'user';
      console.log('User role fetched:', role);
      
      setUserRole(role);
      setIsAdmin(role === 'admin' || role === 'superadmin');
      setIsSuperAdmin(role === 'superadmin');
      
      console.log('Role state updated:', { role, isAdmin: role === 'admin' || role === 'superadmin', isSuperAdmin: role === 'superadmin' });
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      setUserRole('user');
      setIsAdmin(false);
      setIsSuperAdmin(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process');
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      setUserRole(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      
      // Clear localStorage
      localStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('Sign out completed successfully');
      
      // Force reload to clear any cached state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear everything and redirect
      localStorage.clear();
      window.location.href = '/auth';
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = (event: string, newSession: Session | null) => {
      console.log('Auth state changed:', event);
      
      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setSession(newSession);
          setUser(newSession?.user ?? null);
          // Defer role fetching to avoid blocking auth state change
          if (newSession?.user) {
            setTimeout(() => {
              if (mounted) refreshUserRole();
            }, 0);
          }
          break;
        case 'SIGNED_OUT':
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          localStorage.clear();
          break;
        default:
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            setTimeout(() => {
              if (mounted) refreshUserRole();
            }, 0);
          } else {
            setUserRole(null);
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
      }
      
      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            // Defer role fetching
            setTimeout(() => {
              if (mounted) refreshUserRole();
            }, 0);
          }
        }
      } catch (err) {
        console.error('Unexpected session check error:', err);
        setSession(null);
        setUser(null);
        setUserRole(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh user role when user changes
  useEffect(() => {
    if (user?.id && !loading) {
      refreshUserRole();
    }
  }, [user?.id, loading]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole, 
      isAdmin, 
      isSuperAdmin, 
      signOut, 
      refreshUserRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
