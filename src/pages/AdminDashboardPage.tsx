import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, FileCheck, Activity, DollarSign, UserCheck, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DepositApprovalSection from '@/components/admin/DepositApprovalSection';
import WithdrawalApprovalSection from '@/components/admin/WithdrawalApprovalSection';
import UserManagementSection from '@/components/admin/UserManagementSection';
import KYCManagementSection from '@/components/admin/KYCManagementSection';
import AdminStatsSection from '@/components/admin/AdminStatsSection';
import ContactMessagesSection from '@/components/admin/ContactMessagesSection';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is admin
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      return data?.role === 'admin' || data?.role === 'superadmin';
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-exchange-bg flex items-center justify-center">
        <div className="text-exchange-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-exchange-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-exchange-text-primary mb-2">
            Admin Dashboard
          </h1>
          <p className="text-exchange-text-secondary">
            Manage deposits, withdrawals, users, and KYC submissions
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-exchange-card-bg border border-exchange-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-exchange-accent">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-exchange-accent">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="deposits" className="data-[state=active]:bg-exchange-accent">
              <DollarSign className="w-4 h-4 mr-2" />
              Deposits
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-exchange-accent">
              <CreditCard className="w-4 h-4 mr-2" />
              Withdrawals
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-exchange-accent">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="kyc" className="data-[state=active]:bg-exchange-accent">
              <FileCheck className="w-4 h-4 mr-2" />
              KYC
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminStatsSection />
          </TabsContent>

          <TabsContent value="messages">
            <ContactMessagesSection />
          </TabsContent>

          <TabsContent value="deposits">
            <DepositApprovalSection />
          </TabsContent>

          <TabsContent value="withdrawals">
            <WithdrawalApprovalSection />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementSection />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCManagementSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
