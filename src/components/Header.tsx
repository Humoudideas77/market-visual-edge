
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield,
  Home
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user role:', error);
          } else {
            setUserRole(data?.role || 'user');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  const handleDashboardClick = () => {
    if (userRole === 'superadmin') {
      navigate('/superadmin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded"></div>
            <span className="text-xl font-bold text-gray-900">MecCrypto</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/exchange" className="text-gray-700 hover:text-red-600 transition-colors">
              Markets
            </Link>
            {user && (
              <>
                <Link to="/trading" className="text-gray-700 hover:text-red-600 transition-colors">
                  Trade
                </Link>
                <Link to="/contracts" className="text-gray-700 hover:text-red-600 transition-colors">
                  Contracts
                </Link>
                <Link to="/gold-mining" className="text-gray-700 hover:text-red-600 transition-colors">
                  Gold Mining
                </Link>
                <Link to="/launchpad" className="text-gray-700 hover:text-red-600 transition-colors">
                  Launchpad
                </Link>
                <Link to="/my-assets" className="text-gray-700 hover:text-red-600 transition-colors">
                  Assets
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-gray-700 hover:text-red-600">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
                    {userRole === 'superadmin' && (
                      <Shield className="w-4 h-4 text-red-600" />
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    {user.email}
                    {userRole === 'superadmin' && (
                      <div className="text-xs text-red-600 font-semibold">Super Admin</div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDashboardClick} className="cursor-pointer">
                    <Home className="w-4 h-4 mr-2" />
                    {userRole === 'superadmin' ? 'Super Admin Dashboard' : 'Dashboard'}
                  </DropdownMenuItem>
                  {userRole === 'superadmin' && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      User Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
