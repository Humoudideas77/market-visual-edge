
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
      
      // Special handling for Super Admin email - immediate assignment
      if (user.email === 'xgroup7509@gmail.com') {
        console.log('Super Admin detected - immediate role assignment');
        setUserRole('superadmin');
        setIsAdmin(true);
        setIsSuperAdmin(true);
        return;
      }
      
      // Use the secure function to get user role for other users
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
      console.log('Auth state changed:', event, 'User:', newSession?.user?.email);
      
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // Immediate role assignment for Super Admin
      if (newSession?.user?.email === 'xgroup7509@gmail.com') {
        console.log('Super Admin login detected - immediate setup');
        setUserRole('superadmin');
        setIsAdmin(true);
        setIsSuperAdmin(true);
        setLoading(false);
        return;
      }
      
      // For other users, fetch role data
      if (newSession?.user && newSession.user.email !== 'xgroup7509@gmail.com') {
        refreshUserRole();
      } else if (!newSession?.user) {
        setUserRole(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
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
          
          // Immediate setup for Super Admin
          if (session?.user?.email === 'xgroup7509@gmail.com') {
            console.log('Existing Super Admin session detected');
            setUserRole('superadmin');
            setIsAdmin(true);
            setIsSuperAdmin(true);
          } else if (session?.user) {
            refreshUserRole();
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
