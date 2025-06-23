
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
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

  const signOut = async () => {
    try {
      console.log('Starting sign out process');
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      
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
          break;
        case 'SIGNED_OUT':
          setSession(null);
          setUser(null);
          localStorage.clear();
          break;
        default:
          setSession(newSession);
          setUser(newSession?.user ?? null);
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
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Unexpected session check error:', err);
        setSession(null);
        setUser(null);
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
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
