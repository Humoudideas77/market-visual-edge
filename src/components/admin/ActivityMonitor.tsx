
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Activity, 
  Users, 
  LogIn, 
  FileCheck, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Bell,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  device_info: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    email: string;
    first_name: string;
  };
}

const ActivityMonitor = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ['user-activities-enhanced', filter],
    queryFn: async () => {
      let query = supabase
        .from('user_activities')
        .select(`
          *,
          profiles!inner(email, first_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.like('activity_type', `%${filter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserActivity[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscriptions for new activities
  useEffect(() => {
    const channel = supabase
      .channel('activity-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities',
        },
        (payload) => {
          console.log('New user activity detected:', payload);
          setNewActivitiesCount(prev => prev + 1);
          
          // Show toast notification for important activities
          const activityType = payload.new.activity_type;
          if (['deposit_request_created', 'withdrawal_request_created', 'kyc_submission_created', 'trade_executed'].includes(activityType)) {
            toast.info(`New ${activityType.replace('_', ' ')} detected!`, {
              action: {
                label: 'View',
                onClick: () => {
                  refetch();
                  setNewActivitiesCount(0);
                }
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const getActivityIcon = (activityType: string) => {
    if (activityType.includes('deposit')) return DollarSign;
    if (activityType.includes('withdrawal')) return CreditCard;
    if (activityType.includes('kyc')) return FileCheck;
    if (activityType.includes('trade')) return TrendingUp;
    if (activityType.includes('login')) return LogIn;
    return Activity;
  };

  const getActivityBadge = (activityType: string) => {
    if (activityType.includes('created')) return 'default';
    if (activityType.includes('approved') || activityType.includes('completed')) return 'default';
    if (activityType.includes('rejected') || activityType.includes('failed')) return 'destructive';
    if (activityType.includes('executed') || activityType.includes('trade')) return 'secondary';
    return 'outline';
  };

  const formatActivityType = (activityType: string) => {
    return activityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDeviceInfo = (deviceInfo: any) => {
    if (!deviceInfo) return 'N/A';
    if (typeof deviceInfo === 'object') {
      return Object.entries(deviceInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
        .slice(0, 100) + '...';
    }
    return String(deviceInfo).slice(0, 50) + '...';
  };

  const filteredActivities = activities?.filter(activity => {
    if (!searchTerm) return true;
    return (
      activity.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  const handleRefresh = () => {
    refetch();
    setNewActivitiesCount(0);
    toast.success('Activity feed refreshed');
  };

  if (isLoading) {
    return (
      <Card className="bg-exchange-card-bg border-exchange-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 bg-exchange-border rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-exchange-text-primary flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-Time User Activity Monitor
            {newActivitiesCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                <Bell className="w-3 h-3 mr-1" />
                {newActivitiesCount} New
              </Badge>
            )}
          </CardTitle>
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-exchange-text-secondary" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                <SelectValue placeholder="Filter by activity" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="kyc">KYC</SelectItem>
                <SelectItem value="trade">Trades</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Input
            placeholder="Search by email, activity type, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-800 border-gray-600"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Device Info</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.activity_type);
                return (
                  <TableRow key={activity.id} className="hover:bg-gray-800/50">
                    <TableCell className="text-exchange-text-secondary">
                      {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-exchange-text-primary font-medium">
                          {activity.profiles?.email || 'Unknown'}
                        </span>
                        <span className="text-xs text-exchange-text-secondary font-mono">
                          {activity.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-exchange-text-secondary" />
                        <Badge variant={getActivityBadge(activity.activity_type)}>
                          {formatActivityType(activity.activity_type)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-exchange-text-secondary text-sm">
                      {formatDeviceInfo(activity.device_info)}
                    </TableCell>
                    <TableCell className="text-exchange-text-secondary">
                      {activity.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell className="text-exchange-text-secondary text-xs">
                      {activity.user_agent ? activity.user_agent.slice(0, 30) + '...' : 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-8 text-exchange-text-secondary">
            No activities found matching your criteria
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityMonitor;
