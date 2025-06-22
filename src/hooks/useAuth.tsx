
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
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

  useEffect(() => {
    let mounted = true;

    // Function to handle auth state changes
    const handleAuthStateChange = (event: string, newSession: Session | null) => {
      console.log('Auth state changed:', event, newSession?.user?.email);
      
      if (!mounted) return;

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setSession(newSession);
          setUser(newSession?.user ?? null);
          break;
        case 'SIGNED_OUT':
          // Clear all auth state
          setSession(null);
          setUser(null);
          // Clear any remaining local storage
          localStorage.removeItem('supabase.auth.token');
          break;
        case 'PASSWORD_RECOVERY':
          // Handle password recovery if needed
          break;
        default:
          setSession(newSession);
          setUser(newSession?.user ?? null);
      }
      
      if (loading) {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session with error handling
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          // If session is invalid, clear it
          if (error.message.includes('session_not_found') || error.message.includes('Invalid')) {
            await supabase.auth.signOut({ scope: 'local' });
            setSession(null);
            setUser(null);
          }
        } else {
          console.log('Initial session check:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Unexpected session check error:', err);
        // Clear potentially corrupted session
        await supabase.auth.signOut({ scope: 'local' });
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
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
