import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, FileCheck, Activity, DollarSign, UserCheck, Shield, Settings, RefreshCw, Home, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DepositApprovalSection from '@/components/admin/DepositApprovalSection';
import WithdrawalApprovalSection from '@/components/admin/WithdrawalApprovalSection';
import UserManagementSection from '@/components/admin/UserManagementSection';
import KYCManagementSection from '@/components/admin/KYCManagementSection';
import AdminStatsSection from '@/components/admin/AdminStatsSection';
import SuperAdminActivityLogs from '@/components/admin/SuperAdminActivityLogs';
import SuperAdminPlatformSettings from '@/components/admin/SuperAdminPlatformSettings';
import ManualDepositUpload from '@/components/admin/ManualDepositUpload';
import BackButton from '@/components/BackButton';
import MecBot from '@/components/MecBot';
import ContactMessagesSection from '@/components/admin/ContactMessagesSection';
import TradesManagementSection from '@/components/admin/TradesManagementSection';
import { toast } from 'sonner';

const SuperAdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log('SuperAdminPage - Current URL:', window.location.pathname);
  console.log('SuperAdminPage - User:', user?.email);

  // Check if user is specifically a superadmin
  const { data: userProfile, isLoading: profileLoading, error, refetch } = useQuery({
    queryKey: ['superadmin-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('SuperAdminPage - Checking superadmin status for user:', user.id, user.email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('SuperAdminPage - Error fetching user profile:', error);
        throw error;
      }
      
      console.log('SuperAdminPage - User profile data:', data);
      return data;
    },
    enabled: !!user && !authLoading,
    retry: 3,
    retryDelay: 1000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    toast.info(`Switched to ${newTab.charAt(0).toUpperCase() + newTab.slice(1)} section`);
  };

  const handleLandingPageRedirect = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1 && document.referrer && document.referrer !== window.location.href) {
      // If there's a referrer and it's not the same page, go back
      window.history.back();
    } else {
      // Otherwise, navigate to home
      window.location.href = '/';
    }
  };

  console.log('SuperAdminPage - Render state:', {
    user: user?.email,
    authLoading,
    profileLoading,
    userProfile,
    error,
    currentPath: window.location.pathname
  });

  // Show loading while checking authentication or profile
  if (authLoading || profileLoading) {
    console.log('SuperAdminPage - Showing loading state');
    return (
      <div className="admin-dashboard-bg flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <div className="text-white text-base font-bold">Verifying Super Admin Access...</div>
        </div>
      </div>
    );
  }

  // Show error if profile fetch failed
  if (error) {
    console.log('SuperAdminPage - Showing error state:', error);
    return (
      <div className="admin-dashboard-bg flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 p-6">
          <div className="text-red-400 text-xl font-bold">Error Loading Profile</div>
          <div className="text-gray-300 text-base leading-relaxed font-medium">
            Failed to verify admin access. Please try refreshing the page.
          </div>
          <div className="text-sm text-gray-400 bg-gray-800 p-3 rounded-lg font-medium border border-gray-600">
            Error: {error.message}
          </div>
          <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Redirect if user is not authenticated
  if (!user) {
    console.log('SuperAdminPage - No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Redirect if user is not a superadmin
  if (!userProfile || userProfile.role !== 'superadmin') {
    console.log('SuperAdminPage - User is not superadmin, role:', userProfile?.role);
    return <Navigate to="/dashboard" replace />;
  }

  console.log('SuperAdminPage - Rendering SuperAdmin dashboard for:', userProfile.email);

  return (
    <div className="admin-dashboard-bg min-h-screen w-full overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header Section with Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
          <BackButton fallbackPath="/" label="← Dashboard" />
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              variant="outline" 
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 flex-1 sm:flex-none"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              onClick={handleGoBack}
              variant="outline" 
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 flex-1 sm:flex-none"
            >
              <Home className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Go Back</span>
            </Button>
          </div>
        </div>

        {/* Main Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl glow-red flex-shrink-0">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight mb-1 sm:mb-2">
                  Mexc PRO Super Admin
                </h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <Badge variant="destructive" className="bg-red-600 text-white font-bold px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-red-500 shadow-lg">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Superadmin Access
                  </Badge>
                  <span className="text-gray-300 text-sm sm:text-base font-semibold break-all sm:break-normal">
                    Welcome, {userProfile.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-base sm:text-lg lg:text-xl leading-relaxed font-medium max-w-4xl">
            Complete platform administration and user management dashboard with enhanced monitoring capabilities
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 sm:space-y-8">
          <div className="w-full overflow-x-auto">
            <TabsList className="grid grid-cols-4 lg:grid-cols-10 bg-gray-900 border-2 border-gray-700 shadow-2xl rounded-xl p-1 sm:p-2 min-w-full lg:min-w-0">
              <TabsTrigger 
                value="overview" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Over</span>
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Messages</span>
                <span className="sm:hidden">Msg</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Users</span>
                <span className="sm:hidden">User</span>
              </TabsTrigger>
              <TabsTrigger 
                value="trades" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Trades</span>
                <span className="sm:hidden">Trade</span>
              </TabsTrigger>
              <TabsTrigger 
                value="kyc" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <FileCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">KYC</span>
                <span className="sm:hidden">KYC</span>
              </TabsTrigger>
              <TabsTrigger 
                value="deposits" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Deposits</span>
                <span className="sm:hidden">Dep</span>
              </TabsTrigger>
              <TabsTrigger 
                value="manual-deposit" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">Up</span>
              </TabsTrigger>
              <TabsTrigger 
                value="withdrawals" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Withdrawals</span>
                <span className="sm:hidden">With</span>
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Activity</span>
                <span className="sm:hidden">Act</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive text-xs sm:text-sm px-1 sm:px-2 lg:px-3"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Set</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <AdminStatsSection />
          </TabsContent>

          <TabsContent value="messages">
            <ContactMessagesSection />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementSection />
          </TabsContent>

          <TabsContent value="trades">
            <TradesManagementSection />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCManagementSection />
          </TabsContent>

          <TabsContent value="deposits">
            <DepositApprovalSection />
          </TabsContent>

          <TabsContent value="manual-deposit">
            <ManualDepositUpload />
          </TabsContent>

          <TabsContent value="withdrawals">
            <WithdrawalApprovalSection />
          </TabsContent>

          <TabsContent value="activity">
            <SuperAdminActivityLogs />
          </TabsContent>

          <TabsContent value="settings">
            <SuperAdminPlatformSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* MecBot Integration for SuperAdmin monitoring */}
      <MecBot />
    </div>
  );
};

export default SuperAdminPage;
