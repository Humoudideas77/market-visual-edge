
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Settings, User, ChevronDown, Globe, LogOut, Shield, MessageCircle, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  console.log('Header render - user:', !!user, 'mobile menu:', isMobileMenuOpen);

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
      
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    try {
      toast.loading('Signing out...');
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
    }
  };

  const handleProfileClick = () => {
    if (userProfile?.role === 'superadmin') {
      navigate('/superadmin');
    } else {
      navigate('/dashboard');
    }
    setIsMobileMenuOpen(false);
  };

  const handleSuperAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/superadmin');
    setIsMobileMenuOpen(false);
  };

  const handleNotificationClick = () => {
    toast.info('Notifications feature coming soon!');
  };

  const handleSettingsClick = () => {
    toast.info('Settings panel coming soon!');
  };

  const handleSupportClick = () => {
    navigate('/');
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const contactSection = document.querySelector('.contact-form-section');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const toggleMobileMenu = () => {
    console.log('Toggle mobile menu clicked');
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Check if user is superadmin
  const isSuperAdmin = userProfile?.role === 'superadmin';

  return (
    <header className="bg-gray-900 border-b border-gray-700 w-full px-4 sm:px-6 py-3 flex items-center justify-between shadow-xl relative">
      {/* Logo */}
      <div className="flex items-center space-x-2 min-w-0">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xs sm:text-sm">MC</span>
          </div>
          <span className="text-base sm:text-xl font-bold text-white">MexcCrypto</span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-6">
        <Link to="/exchange" className="text-white hover:text-red-400 transition-colors font-medium">Markets</Link>
        
        {user ? (
          <>
            <Link to="/trading" className="text-white hover:text-red-400 transition-colors font-medium">Trade</Link>
            <Link to="/contracts" className="text-gray-300 hover:text-red-400 transition-colors font-medium">Contracts</Link>
            <Link to="/gold-mining" className="text-gray-300 hover:text-red-400 transition-colors font-medium">Gold Mining</Link>
            <Link to="/launchpad" className="text-gray-300 hover:text-red-400 transition-colors font-medium">Launchpad</Link>
            <Link to="/dashboard" className="text-gray-300 hover:text-red-400 transition-colors font-medium">Assets</Link>
            
            {isSuperAdmin && (
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
        
        <button 
          onClick={handleSupportClick}
          className="text-gray-300 hover:text-blue-400 transition-colors flex items-center space-x-1 font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Customer Support</span>
        </button>
      </nav>

      {/* Right Side Controls */}
      <div className="flex items-center space-x-1 sm:space-x-3">
        {/* Language Selector - Hidden on small screens and hidden for non-superadmin users */}
        {isSuperAdmin && (
          <div className="hidden sm:flex items-center space-x-1 text-gray-400 hover:text-white cursor-pointer transition-colors">
            <Globe className="w-4 h-4" />
            <span className="text-sm">EN</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        )}

        {user ? (
          <>
            {/* Desktop Controls */}
            <div className="hidden sm:flex items-center space-x-2">
              {/* Notifications - Only show for superadmin */}
              {isSuperAdmin && (
                <button onClick={handleNotificationClick} className="hover:bg-gray-800 p-2 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </button>
              )}

              {/* Settings - Only show for superadmin */}
              {isSuperAdmin && (
                <button onClick={handleSettingsClick} className="hover:bg-gray-800 p-2 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                </button>
              )}

              {/* User Profile */}
              <button 
                onClick={handleProfileClick}
                className="flex items-center space-x-2 bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-200"
              >
                {isSuperAdmin ? (
                  <Shield className="w-4 h-4 text-red-400" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
                <span className="text-sm text-white font-medium">
                  {isSuperAdmin ? 'Super Admin' : 'Profile'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-red-400 transition-colors border border-gray-600 rounded-lg hover:border-red-500 hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors border border-gray-600 rounded-lg hover:bg-gray-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </>
        ) : (
          <>
            <div className="hidden sm:flex items-center space-x-2">
              <Link to="/auth">
                <button className="px-4 py-2 text-white border border-gray-600 rounded-md hover:bg-gray-800 transition-colors text-sm">
                  Login
                </button>
              </Link>
              <Link to="/auth">
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm">
                  Sign Up
                </button>
              </Link>
            </div>

            {/* Mobile Auth Buttons */}
            <div className="flex sm:hidden items-center space-x-1">
              <Link to="/auth">
                <button className="px-3 py-2 text-white border border-gray-600 rounded-md hover:bg-gray-800 transition-colors text-xs">
                  Login
                </button>
              </Link>
              <Link to="/auth">
                <button className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs">
                  Sign Up
                </button>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && user && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMobileMenu}
          />
          
          {/* Menu Content */}
          <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-700 shadow-xl z-50 pt-16">
            <div className="px-4 py-4 space-y-4 max-h-screen overflow-y-auto">
              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                <Link to="/exchange" onClick={closeMobileMenu} className="block text-white hover:text-red-400 transition-colors font-medium py-3 border-b border-gray-700">
                  Markets
                </Link>
                <Link to="/trading" onClick={closeMobileMenu} className="block text-white hover:text-red-400 transition-colors font-medium py-3 border-b border-gray-700">
                  Trade
                </Link>
                <Link to="/contracts" onClick={closeMobileMenu} className="block text-gray-300 hover:text-red-400 transition-colors font-medium py-3 border-b border-gray-700">
                  Contracts
                </Link>
                <Link to="/gold-mining" onClick={closeMobileMenu} className="block text-gray-300 hover:text-red-400 transition-colors font-medium py-3 border-b border-gray-700">
                  Gold Mining
                </Link>
                <Link to="/launchpad" onClick={closeMobileMenu} className="block text-gray-300 hover:text-red-400 transition-colors font-medium py-3 border-b border-gray-700">
                  Launchpad
                </Link>
                <Link to="/dashboard" onClick={closeMobileMenu} className="block text-gray-300 hover:text-red-400 transition-colors font-medium py-3 border-b border-gray-700">
                  Assets
                </Link>
                
                {isSuperAdmin && (
                  <button 
                    onClick={handleSuperAdminClick}
                    className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors font-medium py-3 border-b border-gray-700 w-full text-left"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Super Admin</span>
                  </button>
                )}
                
                <button 
                  onClick={handleSupportClick}
                  className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors font-medium py-3 border-b border-gray-700 w-full text-left"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Customer Support</span>
                </button>
              </div>

              <div className="border-t border-gray-700 pt-4 space-y-3">
                {/* Mobile User Actions - Only show notifications and settings for superadmin */}
                {isSuperAdmin && (
                  <>
                    <button onClick={handleNotificationClick} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors py-3 w-full text-left">
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </button>
                    
                    <button onClick={handleSettingsClick} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors py-3 w-full text-left">
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </button>
                  </>
                )}
                
                <button 
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors py-3 w-full text-left"
                >
                  {isSuperAdmin ? (
                    <Shield className="w-5 h-5 text-red-400" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span>{isSuperAdmin ? 'Super Admin Panel' : 'My Profile'}</span>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors py-3 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>

                {/* Language Selector in Mobile - Only show for superadmin */}
                {isSuperAdmin && (
                  <div className="flex items-center space-x-2 text-gray-400 hover:text-white cursor-pointer transition-colors py-3">
                    <Globe className="w-5 h-5" />
                    <span>English</span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
