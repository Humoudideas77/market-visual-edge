
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, CreditCard, FileCheck, Activity, DollarSign, UserCheck, Shield, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DepositApprovalSection from '@/components/admin/DepositApprovalSection';
import WithdrawalApprovalSection from '@/components/admin/WithdrawalApprovalSection';
import UserManagementSection from '@/components/admin/UserManagementSection';
import KYCManagementSection from '@/components/admin/KYCManagementSection';
import AdminStatsSection from '@/components/admin/AdminStatsSection';
import SuperAdminActivityLogs from '@/components/admin/SuperAdminActivityLogs';
import SuperAdminPlatformSettings from '@/components/admin/SuperAdminPlatformSettings';
import BackButton from '@/components/BackButton';
import MecBot from '@/components/MecBot';

const SuperAdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  console.log('SuperAdminPage - Current URL:', window.location.pathname);
  console.log('SuperAdminPage - User:', user?.email);

  // Check if user is specifically a superadmin
  const { data: userProfile, isLoading: profileLoading, error } = useQuery({
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
      <div className="admin-dashboard-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <div className="text-gray-900 text-base font-bold">Verifying Super Admin Access...</div>
        </div>
      </div>
    );
  }

  // Show error if profile fetch failed
  if (error) {
    console.log('SuperAdminPage - Showing error state:', error);
    return (
      <div className="admin-dashboard-bg flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <div className="text-red-600 text-xl font-bold">Error Loading Profile</div>
          <div className="text-gray-800 text-base leading-relaxed font-medium">
            Failed to verify admin access. Please try refreshing the page.
          </div>
          <div className="text-sm text-gray-700 bg-gray-100 p-3 rounded-lg font-medium">
            Error: {error.message}
          </div>
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
    <div className="admin-dashboard-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Back Button - Top Left */}
        <div className="mb-6">
          <BackButton fallbackPath="/" label="← Dashboard" />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-2">
                  MecCrypto Super Admin
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="destructive" className="bg-red-600 text-white font-bold px-4 py-2 text-sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Superadmin Access
                  </Badge>
                  <span className="text-gray-700 text-base font-semibold">
                    Welcome, {userProfile.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-800 text-xl leading-relaxed font-medium max-w-4xl">
            Complete platform administration and user management dashboard with enhanced monitoring capabilities
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-7 bg-white border-2 border-gray-200 shadow-lg rounded-xl p-2">
            <TabsTrigger 
              value="overview" 
              className="admin-tab-button data-[state=active]:admin-tab-active admin-tab-inactive"
            >
              <Activity className="w-4 h-4 mr-2" />
              Overview
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

      {/* MecBot Integration for SuperAdmin monitoring */}
      <MecBot />
    </div>
  );
};

export default SuperAdminPage;
