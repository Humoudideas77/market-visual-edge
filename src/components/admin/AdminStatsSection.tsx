
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CreditCard, FileCheck, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminStatsSection = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: pendingDeposits },
        { count: pendingWithdrawals },
        { count: pendingKYC },
        { data: depositSum },
        { data: withdrawalSum }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('deposit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('deposit_requests').select('amount').eq('status', 'approved'),
        supabase.from('withdrawal_requests').select('amount').eq('status', 'approved')
      ]);

      const totalDeposits = depositSum?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalWithdrawals = withdrawalSum?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      return {
        totalUsers: totalUsers || 0,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        pendingKYC: pendingKYC || 0,
        totalDeposits,
        totalWithdrawals,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-exchange-card-bg border-exchange-border">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-exchange-border rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-exchange-border rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Pending Deposits',
      value: stats?.pendingDeposits || 0,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      urgent: (stats?.pendingDeposits || 0) > 0,
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.pendingWithdrawals || 0,
      icon: CreditCard,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      urgent: (stats?.pendingWithdrawals || 0) > 0,
    },
    {
      title: 'Pending KYC',
      value: stats?.pendingKYC || 0,
      icon: FileCheck,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      urgent: (stats?.pendingKYC || 0) > 0,
    },
    {
      title: 'Total Deposits',
      value: `$${stats?.totalDeposits?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      title: 'Total Withdrawals',
      value: `$${stats?.totalWithdrawals?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="bg-exchange-card-bg border-exchange-border relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-exchange-text-secondary">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              {stat.urgent && (
                <Badge variant="destructive" className="absolute -top-2 -right-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Action Needed
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-exchange-text-primary">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0) + (stats?.pendingKYC || 0) > 0 && (
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Pending Actions Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-exchange-text-secondary">
              You have pending items that require your attention. Please review the respective sections.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminStatsSection;
