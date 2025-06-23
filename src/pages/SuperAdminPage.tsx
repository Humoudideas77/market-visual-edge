import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, FileCheck, Activity, DollarSign, UserCheck, Shield, Settings, RefreshCw, Home } from 'lucide-react';
import DepositApprovalSection from '@/components/admin/DepositApprovalSection';
import WithdrawalApprovalSection from '@/components/admin/WithdrawalApprovalSection';
import UserManagementSection from '@/components/admin/UserManagementSection';
import KYCManagementSection from '@/components/admin/KYCManagementSection';
import AdminStatsSection from '@/components/admin/AdminStatsSection';
import SuperAdminActivityLogs from '@/components/admin/SuperAdminActivityLogs';
import SuperAdminPlatformSettings from '@/components/admin/SuperAdminPlatformSettings';
import BackButton from '@/components/BackButton';
import MecBot from '@/components/MecBot';
import ContactMessagesSection from '@/components/admin/ContactMessagesSection';
import { toast } from 'sonner';

const SuperAdminPage = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log('SuperAdminPage - Current state:', { user: user?.email, userRole, authLoading });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.location.reload();
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

  // Show loading while checking authentication
  if (authLoading) {
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

  // Redirect if user is not authenticated
  if (!user) {
    console.log('SuperAdminPage - No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Redirect if user is not a superadmin
  if (userRole !== 'superadmin') {
    console.log('SuperAdminPage - User is not superadmin, role:', userRole, 'redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('SuperAdminPage - Rendering SuperAdmin dashboard for:', user.email);

  return (
    <div className="admin-dashboard-bg min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section with Action Buttons */}
        <div className="flex justify-between items-start mb-6">
          <BackButton fallbackPath="/" label="← Dashboard" />
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              variant="outline" 
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleLandingPageRedirect}
              variant="outline" 
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Main Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl glow-red">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2">
                  Mexc PRO Super Admin
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="destructive" className="bg-red-600 text-white font-bold px-4 py-2 text-sm border border-red-500 shadow-lg">
                    <Shield className="w-4 h-4 mr-2" />
                    Superadmin Access
                  </Badge>
                  <span className="text-gray-300 text-base font-semibold">
                    Welcome, {user.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-xl leading-relaxed font-medium max-w-4xl">
            Complete platform administration and user management dashboard with enhanced monitoring capabilities
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="grid w-full grid-cols-8 bg-gray-900 border-2 border-gray-700 shadow-2xl rounded-xl p-2">
            <TabsTrigger 
              value="overview" 
              className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive"
            >
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="kyc" 
              className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              KYC
            </TabsTrigger>
            <TabsTrigger 
              value="deposits" 
              className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Deposits
            </TabsTrigger>
            <TabsTrigger 
              value="withdrawals" 
              className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Withdrawals
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminStatsSection />
          </TabsContent>

          <TabsContent value="messages">
            <ContactMessagesSection />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementSection />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCManagementSection />
          </TabsContent>

          <TabsContent value="deposits">
            <DepositApprovalSection />
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

      <MecBot />
    </div>
  );
};

export default SuperAdminPage;
