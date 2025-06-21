
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

const SuperAdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is specifically a superadmin
  const { data: isSuperAdmin, isLoading } = useQuery({
    queryKey: ['superadmin-check', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
      
      console.log('Super Admin Check:', data);
      return data?.role === 'superadmin';
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-exchange-bg flex items-center justify-center">
        <div className="text-exchange-text-secondary">Verifying Super Admin Access...</div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-exchange-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-exchange-text-primary">
                Super Admin
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="destructive" className="bg-red-600">
                  <Shield className="w-3 h-3 mr-1" />
                  Superadmin Access
                </Badge>
                <span className="text-exchange-text-secondary text-sm">
                  Full Platform Control
                </span>
              </div>
            </div>
          </div>
          <p className="text-exchange-text-secondary text-lg">
            Complete platform administration and user management dashboard
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-exchange-card-bg border border-exchange-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-exchange-accent">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-exchange-accent">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="kyc" className="data-[state=active]:bg-exchange-accent">
              <FileCheck className="w-4 h-4 mr-2" />
              KYC
            </TabsTrigger>
            <TabsTrigger value="deposits" className="data-[state=active]:bg-exchange-accent">
              <DollarSign className="w-4 h-4 mr-2" />
              Deposits
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-exchange-accent">
              <CreditCard className="w-4 h-4 mr-2" />
              Withdrawals
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-exchange-accent">
              <UserCheck className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-exchange-accent">
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
    </div>
  );
};

export default SuperAdminPage;
