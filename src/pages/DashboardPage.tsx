
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Shield, 
  Wallet, 
  TrendingUp, 
  Settings, 
  LogOut,
  Eye,
  EyeOff,
  CreditCard,
  History,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  kyc_status: string;
  created_at: string;
  updated_at: string;
}

const DashboardPage = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      
      setUser(user);
      
      // Fetch user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(profileData);
      }
      
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Error signing out');
      } else {
        toast.success('Signed out successfully');
        navigate('/');
      }
    } catch (err) {
      toast.error('An error occurred while signing out');
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getKycStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-exchange-bg flex items-center justify-center">
        <div className="text-exchange-text-secondary">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-exchange-bg">
      {/* Header */}
      <header className="bg-exchange-panel border-b border-exchange-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-exchange-blue to-exchange-green rounded"></div>
              <h1 className="text-xl font-bold text-exchange-text-primary">MEXC Pro</h1>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <h2 className="text-lg text-exchange-text-secondary">Dashboard</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              className="text-red-500 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-exchange-text-primary mb-2">
            Welcome back, {profile?.first_name || 'Trader'}!
          </h1>
          <p className="text-exchange-text-secondary">
            Manage your account and start trading with advanced tools.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Account Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="bg-exchange-panel border-exchange-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-exchange-text-primary">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-exchange-text-secondary">Name</p>
                  <p className="text-exchange-text-primary font-medium">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : 'Not provided'
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-exchange-text-secondary">Email</p>
                  <p className="text-exchange-text-primary font-medium">
                    {profile?.email || user?.email}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-exchange-text-secondary">Member Since</p>
                  <p className="text-exchange-text-primary font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-exchange-text-secondary">KYC Status</span>
                  <Badge className={`${getKycStatusColor(profile?.kyc_status || 'pending')} text-white`}>
                    {getKycStatusText(profile?.kyc_status || 'pending')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="bg-exchange-panel border-exchange-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-exchange-text-primary">
                  <Shield className="w-5 h-5" />
                  <span>Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <Badge variant="outline">Not Set</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Verification</span>
                  <Badge className="bg-green-500 text-white">Verified</Badge>
                </div>
                <Button className="w-full" variant="outline">
                  Security Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Trading & Balances */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Overview */}
            <Card className="bg-exchange-panel border-exchange-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-exchange-text-primary">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5" />
                    <span>Portfolio Overview</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalances(!showBalances)}
                  >
                    {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-exchange-bg rounded-lg">
                    <p className="text-sm text-exchange-text-secondary mb-1">Total Balance</p>
                    <p className="text-2xl font-bold text-exchange-text-primary">
                      {showBalances ? '$0.00' : '****'}
                    </p>
                    <p className="text-xs text-exchange-green">+0.00%</p>
                  </div>
                  
                  <div className="text-center p-4 bg-exchange-bg rounded-lg">
                    <p className="text-sm text-exchange-text-secondary mb-1">Available</p>
                    <p className="text-2xl font-bold text-exchange-text-primary">
                      {showBalances ? '$0.00' : '****'}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-exchange-bg rounded-lg">
                    <p className="text-sm text-exchange-text-secondary mb-1">In Orders</p>
                    <p className="text-2xl font-bold text-exchange-text-primary">
                      {showBalances ? '$0.00' : '****'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <Button className="flex-1 bg-exchange-green hover:bg-exchange-green/90">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Deposit
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-exchange-panel border-exchange-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-exchange-text-primary">
                  <TrendingUp className="w-5 h-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    className="h-20 flex flex-col space-y-2 bg-exchange-blue hover:bg-exchange-blue/90"
                    onClick={() => navigate('/trading')}
                  >
                    <TrendingUp className="w-6 h-6" />
                    <span>Start Trading</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col space-y-2"
                    onClick={() => navigate('/')}
                  >
                    <History className="w-6 h-6" />
                    <span>View Markets</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-exchange-panel border-exchange-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-exchange-text-primary">
                  <History className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-exchange-text-secondary">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Your trading history will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
