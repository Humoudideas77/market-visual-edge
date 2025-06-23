
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  signOut: async () => {},
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

  const ensureProfile = async (userId: string, email: string) => {
    try {
      console.log('ensureProfile - Checking/creating profile for:', email);
      
      // Determine role based on email
      const role = email === 'sabilkhattak77@gmail.com' ? 'superadmin' : 'user';
      console.log('ensureProfile - Determined role:', role);

      // Insert or update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          role: role
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('ensureProfile - Error upserting profile:', error);
        return 'user';
      }

      console.log('ensureProfile - Profile upserted successfully with role:', role);
      return role;
    } catch (error) {
      console.error('ensureProfile - Exception:', error);
      return 'user';
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process');
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      setUserRole(null);
      
      // Clear browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('Sign out completed successfully');
      
      // Force reload to clear any cached state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force reload even if there's an error
      window.location.href = '/auth';
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event: string, newSession: Session | null) => {
      console.log('Auth state changed:', event, newSession?.user?.email);
      
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        
        // Ensure profile exists and get role
        try {
          const role = await ensureProfile(newSession.user.id, newSession.user.email!);
          if (mounted) {
            setUserRole(role);
          }
        } catch (error) {
          console.error('Error ensuring profile:', error);
          if (mounted) {
            setUserRole('user');
          }
        }
      } else {
        setSession(null);
        setUser(null);
        setUserRole(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
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
        } else if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Ensure profile exists and get role
          const role = await ensureProfile(session.user.id, session.user.email!);
          if (mounted) {
            setUserRole(role);
          }
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error('Unexpected session check error:', err);
        setSession(null);
        setUser(null);
        setUserRole(null);
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
    <AuthContext.Provider value={{ user, session, loading, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
