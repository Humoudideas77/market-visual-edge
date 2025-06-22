
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
      console.log('Header - Starting sign out process');
      
      // Clear the session and sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Header - Sign out error:', error);
        toast.error('Error signing out: ' + error.message);
        return;
      }
      
      console.log('Header - Sign out successful, redirecting...');
      
      // Clear any additional local storage items
      localStorage.removeItem('supabase.auth.token');
      
      // Show success message
      toast.success('You have successfully logged out');
      
      // Force redirect to auth page after a short delay
      setTimeout(() => {
        navigate('/auth', { replace: true });
        window.location.href = '/auth'; // Fallback for complete redirect
      }, 500);
      
    } catch (err) {
      console.error('Header - Unexpected error during sign out:', err);
      toast.error('An error occurred while signing out');
      
      // Force redirect even on error
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 1000);
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
    <header className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between shadow-xl">
      {/* Logo and Main Navigation */}
      <div className="flex items-center space-x-8">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">MC</span>
          </div>
          <span className="text-xl font-bold text-white">MecCrypto</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/exchange" className="text-white hover:text-red-400 transition-colors font-medium">Markets</Link>
          
          {user ? (
            <>
              <Link to="/trading" className="text-white hover:text-red-400 transition-colors font-medium">Trade</Link>
              <Link to="/contracts" className="text-gray-300 hover:text-red-400 transition-colors font-medium">Contracts</Link>
              <Link to="/gold-mining" className="text-gray-300 hover:text-red-400 transition-colors font-medium">Gold Mining</Link>
              <Link to="/launchpad" className="text-gray-300 hover:text-red-400 transition-colors font-medium">Launchpad</Link>
              <Link to="/dashboard" className="text-gray-300 hover:text-red-400 transition-colors font-medium">Assets</Link>
              
              {/* Super Admin Dashboard Link */}
              {userProfile?.role === 'superadmin' && (
                <button 
                  onClick={handleSuperAdminClick}
                  className="text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1 font-medium"
                >
                  <Shield className="w-4 h-4" />
                  <span>Super Admin</span>
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-gray-600 cursor-not-allowed">Trade</span>
              <span className="text-gray-600 cursor-not-allowed">Contracts</span>
              <span className="text-gray-600 cursor-not-allowed">Gold Mining</span>
              <span className="text-gray-600 cursor-not-allowed">Launchpad</span>
            </>
          )}
        </nav>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center space-x-4">
        {/* Language Selector */}
        <div className="flex items-center space-x-1 text-gray-400 hover:text-white cursor-pointer transition-colors">
          <Globe className="w-4 h-4" />
          <span className="text-sm">EN</span>
          <ChevronDown className="w-3 h-3" />
        </div>

        {user ? (
          <>
            {/* Notifications */}
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>

            {/* Settings */}
            <Settings className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />

            {/* User Profile - Updated to handle role-based navigation */}
            <button 
              onClick={handleProfileClick}
              className="flex items-center space-x-2 bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-200"
            >
              {userProfile?.role === 'superadmin' ? (
                <Shield className="w-4 h-4 text-red-400" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
              <span className="text-sm text-white font-medium">
                {userProfile?.role === 'superadmin' ? 'Super Admin' : 'Profile'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-red-400 transition-colors border border-gray-600 rounded-lg hover:border-red-500"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </>
        ) : (
          <>
            {/* Login/Register Buttons for unauthenticated users */}
            <div className="flex items-center space-x-2">
              <Link to="/auth">
                <button className="px-4 py-2 text-white border border-gray-600 rounded-md hover:bg-gray-800 transition-colors">
                  Log In
                </button>
              </Link>
              <Link to="/auth">
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
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
