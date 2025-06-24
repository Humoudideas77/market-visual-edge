import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

interface FloatingLabelInputProps {
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  required?: boolean;
  minLength?: number;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

const FloatingLabelInput = ({ 
  id, 
  type, 
  value, 
  onChange, 
  label, 
  required = false, 
  minLength, 
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword
}: FloatingLabelInputProps) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = focused || hasValue;

  return (
    <div className="relative">
      <input
        id={id}
        type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        minLength={minLength}
        className={`
          w-full px-4 py-3 bg-exchange-bg border-2 rounded-lg text-exchange-text-primary
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-0 focus:border-exchange-blue
          placeholder-transparent peer
          ${showPasswordToggle ? 'pr-12' : ''}
          ${focused ? 'border-exchange-blue' : 'border-exchange-border hover:border-exchange-border/80'}
        `}
        placeholder={label}
      />
      
      <label
        htmlFor={id}
        className={`
          absolute left-4 transition-all duration-200 ease-in-out pointer-events-none
          ${shouldFloat 
            ? 'top-0 -translate-y-1/2 px-2 bg-exchange-panel text-sm font-medium' 
            : 'top-1/2 -translate-y-1/2 text-base'
          }
          ${focused 
            ? 'text-exchange-blue' 
            : hasValue 
              ? 'text-exchange-text-primary' 
              : 'text-exchange-text-secondary'
          }
        `}
      >
        {label}
      </label>
      
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-exchange-text-secondary hover:text-exchange-text-primary transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
};

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.role === 'superadmin') {
            navigate('/superadmin-dashboard');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(error.message);
        }
      } else {
        // Handle superadmin creation
        if (email === 'xgroup7509@gmail.com' && data.user && data.session) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'superadmin' })
            .eq('id', data.user.id);
          
          if (!profileError) {
            toast.success('MecCrypto superadmin account created successfully!');
            navigate('/superadmin-dashboard');
            return;
          }
        }
        
        if (data.user && !data.session) {
          toast.success('MecCrypto account created! Please check your email for verification.');
        } else {
          toast.success('MecCrypto account created successfully!');
        }
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials.');
        } else {
          setError(error.message);
        }
      } else {
        toast.success('Signed in to MecCrypto successfully!');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-exchange-bg flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Branding */}
        <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-exchange-blue to-exchange-green rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-exchange-text-primary">MecCrypto</h1>
            </div>
            <p className="text-xl text-exchange-text-secondary">
              The world's most secure cryptocurrency exchange platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-exchange-panel border border-exchange-border rounded-lg p-6 text-center">
              <Shield className="w-8 h-8 text-exchange-blue mx-auto mb-3" />
              <h3 className="font-semibold text-exchange-text-primary mb-2">Bank-Level Security</h3>
              <p className="text-sm text-exchange-text-secondary">Advanced encryption and multi-layer security</p>
            </div>
            
            <div className="bg-exchange-panel border border-exchange-border rounded-lg p-6 text-center">
              <TrendingUp className="w-8 h-8 text-exchange-green mx-auto mb-3" />
              <h3 className="font-semibold text-exchange-text-primary mb-2">Advanced Trading</h3>
              <p className="text-sm text-exchange-text-secondary">Professional trading tools and analytics</p>
            </div>
            
            <div className="bg-exchange-panel border border-exchange-border rounded-lg p-6 text-center">
              <Users className="w-8 h-8 text-exchange-blue mx-auto mb-3" />
              <h3 className="font-semibold text-exchange-text-primary mb-2">Global Community</h3>
              <p className="text-sm text-exchange-text-secondary">Join millions of traders worldwide</p>
            </div>
          </div>

          
        </div>

        {/* Right side - Auth Forms */}
        <div className="flex justify-center order-1 lg:order-2">
          <Card className="w-full max-w-md bg-exchange-panel border-2 border-exchange-border shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl text-exchange-text-primary font-bold">Welcome to MecCrypto</CardTitle>
              <CardDescription className="text-exchange-text-secondary text-lg">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-exchange-accent">
                  <TabsTrigger 
                    value="signin" 
                    className="data-[state=active]:bg-exchange-blue data-[state=active]:text-white font-medium"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="data-[state=active]:bg-exchange-green data-[state=active]:text-white font-medium"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {error && (
                  <Alert className="mb-6 border-2 border-red-500 bg-red-500/10">
                    <AlertDescription className="text-red-500 font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <FloatingLabelInput
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      label="Email Address"
                      required
                    />
                    
                    <FloatingLabelInput
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      label="Password"
                      required
                      showPasswordToggle
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-exchange-blue hover:bg-exchange-blue/90 text-white py-3 text-lg font-medium"
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : 'Sign In to MecCrypto'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FloatingLabelInput
                        id="firstname"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        label="First Name"
                        required
                      />
                      
                      <FloatingLabelInput
                        id="lastname"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        label="Last Name"
                        required
                      />
                    </div>

                    <FloatingLabelInput
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      label="Email Address"
                      required
                    />
                    
                    <div className="space-y-2">
                      <FloatingLabelInput
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        label="Create Password"
                        required
                        minLength={6}
                        showPasswordToggle
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                      />
                      <p className="text-xs text-exchange-text-secondary px-1">
                        Password must be at least 6 characters long
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-exchange-green hover:bg-exchange-green/90 text-white py-3 text-lg font-medium"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Create MecCrypto Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
