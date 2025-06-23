
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

  const createProfileIfMissing = async (userId: string, email: string) => {
    try {
      console.log('createProfileIfMissing - Creating profile for user:', userId, email);
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', fetchError);
        return 'user';
      }

      if (existingProfile) {
        console.log('Profile exists with role:', existingProfile.role);
        return existingProfile.role || 'user';
      }

      // Determine role based on email
      const role = email === 'sabilkhattak77@gmail.com' ? 'superadmin' : 'user';
      console.log('Creating new profile with role:', role);

      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          role: role
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return 'user';
      }

      console.log('Profile created successfully with role:', role);
      return role;
    } catch (error) {
      console.error('createProfileIfMissing - Exception:', error);
      return 'user';
    }
  };

  const fetchUserRole = async (userId: string, email: string) => {
    try {
      console.log('fetchUserRole - Fetching role for user:', userId, email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('fetchUserRole - Error fetching user role:', error);
        // Try to create profile if there's an error
        const role = await createProfileIfMissing(userId, email);
        setUserRole(role);
        return;
      }

      if (!data) {
        console.log('fetchUserRole - No profile found, creating one');
        const role = await createProfileIfMissing(userId, email);
        setUserRole(role);
        return;
      }

      const role = data.role || 'user';
      console.log('fetchUserRole - Role found:', role);
      setUserRole(role);
    } catch (error) {
      console.error('fetchUserRole - Exception:', error);
      setUserRole('user');
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process');
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      setUserRole(null);
      
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cached IndexedDB data if present
      if ('indexedDB' in window) {
        try {
          // Clear Supabase's internal storage
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name?.includes('supabase')) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (e) {
          console.log('IndexedDB cleanup skipped:', e);
        }
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('Sign out completed successfully');
      
      // Force reload to clear any cached state and redirect to auth
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear everything and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth';
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event: string, newSession: Session | null) => {
      console.log('Auth state changed:', event, newSession?.user?.email);
      
      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user?.email) {
            // Use setTimeout to defer the database call
            setTimeout(() => {
              if (mounted) {
                fetchUserRole(newSession.user.id, newSession.user.email!);
              }
            }, 0);
          }
          break;
        case 'SIGNED_OUT':
          setSession(null);
          setUser(null);
          setUserRole(null);
          // Clear storage on sign out
          localStorage.clear();
          sessionStorage.clear();
          break;
        default:
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user?.email) {
            setTimeout(() => {
              if (mounted) {
                fetchUserRole(newSession.user.id, newSession.user.email!);
              }
            }, 0);
          } else {
            setUserRole(null);
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
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user?.email) {
            await fetchUserRole(session.user.id, session.user.email);
          }
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
