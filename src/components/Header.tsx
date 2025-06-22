
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Settings, User, ChevronDown, Globe, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if current user is superadmin
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
      
      console.log('Header - User profile:', data);
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Error signing out');
      } else {
        toast.success('Signed out successfully');
      }
    } catch (err) {
      toast.error('An error occurred while signing out');
    }
  };

  const handleProfileClick = () => {
    // Redirect based on user role
    if (userProfile?.role === 'superadmin') {
      console.log('Header - Navigating to superadmin dashboard');
      navigate('/superadmin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSuperAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Header - Super Admin link clicked, navigating to /superadmin-dashboard');
    navigate('/superadmin-dashboard');
  };

  return (
    <header className="bg-exchange-panel border-b border-exchange-border px-6 py-4 flex items-center justify-between">
      {/* Logo and Main Navigation */}
      <div className="flex items-center space-x-8">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-exchange-blue to-exchange-green rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MC</span>
          </div>
          <span className="text-xl font-bold text-exchange-text-primary">MecCrypto</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/exchange" className="text-exchange-text-primary hover:text-exchange-blue transition-colors">Markets</Link>
          
          {user ? (
            <>
              <Link to="/trading" className="text-exchange-text-primary hover:text-exchange-blue transition-colors">Trade</Link>
              <Link to="/contracts" className="text-exchange-text-secondary hover:text-exchange-blue transition-colors">Contracts</Link>
              <Link to="/gold-mining" className="text-exchange-text-secondary hover:text-exchange-blue transition-colors">Gold Mining</Link>
              <Link to="/launchpad" className="text-exchange-text-secondary hover:text-exchange-blue transition-colors">Launchpad</Link>
              <Link to="/dashboard" className="text-exchange-text-secondary hover:text-exchange-blue transition-colors">Assets</Link>
              
              {/* Super Admin Dashboard Link */}
              {userProfile?.role === 'superadmin' && (
                <button 
                  onClick={handleSuperAdminClick}
                  className="text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1"
                >
                  <Shield className="w-4 h-4" />
                  <span>Super Admin</span>
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-exchange-text-secondary/50 cursor-not-allowed">Trade</span>
              <span className="text-exchange-text-secondary/50 cursor-not-allowed">Contracts</span>
              <span className="text-exchange-text-secondary/50 cursor-not-allowed">Gold Mining</span>
              <span className="text-exchange-text-secondary/50 cursor-not-allowed">Launchpad</span>
            </>
          )}
        </nav>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center space-x-4">
        {/* Language Selector */}
        <div className="flex items-center space-x-1 text-exchange-text-secondary hover:text-exchange-text-primary cursor-pointer">
          <Globe className="w-4 h-4" />
          <span className="text-sm">EN</span>
          <ChevronDown className="w-3 h-3" />
        </div>

        {user ? (
          <>
            {/* Notifications */}
            <div className="relative">
              <Bell className="w-5 h-5 text-exchange-text-secondary hover:text-exchange-text-primary cursor-pointer" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-exchange-red rounded-full"></div>
            </div>

            {/* Settings */}
            <Settings className="w-5 h-5 text-exchange-text-secondary hover:text-exchange-text-primary cursor-pointer" />

            {/* User Profile - Updated to handle role-based navigation */}
            <button 
              onClick={handleProfileClick}
              className="flex items-center space-x-2 bg-exchange-accent px-3 py-2 rounded-lg cursor-pointer hover:bg-exchange-accent/80"
            >
              {userProfile?.role === 'superadmin' ? (
                <Shield className="w-4 h-4 text-red-400" />
              ) : (
                <User className="w-4 h-4 text-exchange-text-primary" />
              )}
              <span className="text-sm text-exchange-text-primary">
                {userProfile?.role === 'superadmin' ? 'Super Admin' : 'Profile'}
              </span>
              <ChevronDown className="w-3 h-3 text-exchange-text-secondary" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-exchange-text-secondary hover:text-exchange-red transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </>
        ) : (
          <>
            {/* Login/Register Buttons for unauthenticated users */}
            <div className="flex items-center space-x-2">
              <Link to="/auth">
                <button className="px-4 py-2 text-exchange-text-primary border border-exchange-border rounded-md hover:bg-exchange-accent transition-colors">
                  Log In
                </button>
              </Link>
              <Link to="/auth">
                <button className="px-4 py-2 bg-exchange-blue text-white rounded-md hover:bg-exchange-blue/90 transition-colors">
                  Sign Up
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
