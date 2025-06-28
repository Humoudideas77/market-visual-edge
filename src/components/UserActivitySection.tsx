
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  FileCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const UserActivitySection = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  // Fetch user activities
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['user-activities', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch deposit requests
  const { data: deposits, isLoading: depositsLoading } = useQuery({
    queryKey: ['user-deposits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch withdrawal requests
  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['user-withdrawals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch KYC submissions
  const { data: kycSubmissions, isLoading: kycLoading } = useQuery({
    queryKey: ['user-kyc', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch trade history
  const { data: trades, isLoading: tradesLoading } = useQuery({
    queryKey: ['user-trades', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('trade_pnl')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'deposit_request_created':
      case 'deposit_status_changed':
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case 'withdrawal_request_created':
      case 'withdrawal_status_changed':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'kyc_submission_created':
      case 'kyc_status_changed':
        return <FileCheck className="w-4 h-4 text-blue-400" />;
      case 'trade_executed':
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-900/30 text-yellow-300 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
      case 'completed':
        return <Badge variant="secondary" className="bg-green-900/30 text-green-300 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge variant="secondary" className="bg-red-900/30 text-red-300 border-red-600"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'under_review':
        return <Badge variant="secondary" className="bg-blue-900/30 text-blue-300 border-blue-600"><AlertCircle className="w-3 h-3 mr-1" />Under Review</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-300 border-gray-600">{status}</Badge>;
    }
  };

  const isLoading = activitiesLoading || depositsLoading || withdrawalsLoading || kycLoading || tradesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-300">Loading activities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-600 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 text-red-400" />
                Activity Center
              </CardTitle>
              <CardDescription className="text-gray-400">
                Track all your account activities and transactions
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                refetchActivities();
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 bg-gray-700 border border-gray-600">
              <TabsTrigger value="all" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:text-white">All Activities</TabsTrigger>
              <TabsTrigger value="deposits" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:text-white">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:text-white">Withdrawals</TabsTrigger>
              <TabsTrigger value="kyc" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:text-white">KYC</TabsTrigger>
              <TabsTrigger value="trades" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:text-white">Trades</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-4">
                {activities && activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600">
                      {getActivityIcon(activity.activity_type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white capitalize">
                            {activity.activity_type.replace(/_/g, ' ')}
                          </p>
                          <span className="text-xs text-gray-400">
                            {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        {activity.device_info && (
                          <p className="text-xs text-gray-400 mt-1">
                            {JSON.stringify(activity.device_info)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No activities found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="deposits" className="mt-4">
              <div className="space-y-4">
                {deposits && deposits.length > 0 ? (
                  deposits.map((deposit) => (
                    <div key={deposit.id} className="flex items-start space-x-3 p-4 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600">
                      <ArrowDownLeft className="w-4 h-4 text-green-400 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">
                            Deposit Request - {deposit.currency}
                          </p>
                          {getStatusBadge(deposit.status)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Amount: {deposit.amount} {deposit.currency} • Network: {deposit.network}
                        </p>
                        <span className="text-xs text-gray-500">
                          {format(new Date(deposit.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ArrowDownLeft className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No deposit requests found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-4">
              <div className="space-y-4">
                {withdrawals && withdrawals.length > 0 ? (
                  withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-start space-x-3 p-4 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600">
                      <ArrowUpRight className="w-4 h-4 text-red-400 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">
                            Withdrawal Request - {withdrawal.currency}
                          </p>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Amount: {withdrawal.amount} {withdrawal.currency} • Network: {withdrawal.network}
                        </p>
                        <span className="text-xs text-gray-500">
                          {format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ArrowUpRight className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No withdrawal requests found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="kyc" className="mt-4">
              <div className="space-y-4">
                {kycSubmissions && kycSubmissions.length > 0 ? (
                  kycSubmissions.map((kyc) => (
                    <div key={kyc.id} className="flex items-start space-x-3 p-4 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600">
                      <FileCheck className="w-4 h-4 text-blue-400 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">
                            KYC Submission - {kyc.full_name}
                          </p>
                          {getStatusBadge(kyc.status)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Nationality: {kyc.nationality} • DOB: {format(new Date(kyc.date_of_birth), 'MMM dd, yyyy')}
                        </p>
                        <span className="text-xs text-gray-500">
                          {format(new Date(kyc.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No KYC submissions found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="trades" className="mt-4">
              <div className="space-y-4">
                {trades && trades.length > 0 ? (
                  trades.map((trade) => (
                    <div key={trade.id} className="flex items-start space-x-3 p-4 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600">
                      {trade.pnl_amount >= 0 ? 
                        <TrendingUp className="w-4 h-4 text-green-400 mt-1" /> : 
                        <TrendingDown className="w-4 h-4 text-red-400 mt-1" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">
                            {trade.trade_side.toUpperCase()} {trade.trade_pair}
                          </p>
                          <span className={`text-sm font-semibold ${trade.pnl_amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.pnl_amount >= 0 ? '+' : ''}{trade.pnl_amount} {trade.currency}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Entry: {trade.entry_price} • Exit: {trade.exit_price} • Size: {trade.trade_size}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {format(new Date(trade.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                          <span className={`text-xs font-medium ${trade.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.pnl_percentage >= 0 ? '+' : ''}{trade.pnl_percentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No trades found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivitySection;
