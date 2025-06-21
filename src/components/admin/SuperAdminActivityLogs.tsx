
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Activity, Users, LogIn, FileCheck, DollarSign, CreditCard } from 'lucide-react';

type ActivityLog = {
  id: string;
  admin_id: string;
  action_type: string;
  target_table: string | null;
  target_record_id: string | null;
  target_user_id: string | null;
  action_details: any;
  created_at: string;
};

const SuperAdminActivityLogs = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['superadmin-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  const { data: userActivities, isLoading: userActivitiesLoading } = useQuery({
    queryKey: ['user-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const getActivityIcon = (actionType: string) => {
    if (actionType.includes('user')) return Users;
    if (actionType.includes('login')) return LogIn;
    if (actionType.includes('kyc')) return FileCheck;
    if (actionType.includes('deposit')) return DollarSign;
    if (actionType.includes('withdrawal')) return CreditCard;
    return Activity;
  };

  const getActivityBadge = (actionType: string) => {
    if (actionType.includes('approved')) return 'default';
    if (actionType.includes('rejected')) return 'destructive';
    if (actionType.includes('created') || actionType.includes('updated')) return 'secondary';
    return 'outline';
  };

  if (isLoading || userActivitiesLoading) {
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
    <div className="space-y-6">
      <Card className="bg-exchange-card-bg border-exchange-border">
        <CardHeader>
          <CardTitle className="text-exchange-text-primary flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Admin Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities?.map((activity) => {
                  const Icon = getActivityIcon(activity.action_type);
                  return (
                    <TableRow key={activity.id}>
                      <TableCell className="text-exchange-text-secondary">
                        {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-exchange-text-secondary">
                        {activity.admin_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-exchange-text-secondary" />
                          <Badge variant={getActivityBadge(activity.action_type)}>
                            {activity.action_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-exchange-text-secondary">
                        {activity.target_table || 'N/A'}
                      </TableCell>
                      <TableCell className="text-exchange-text-secondary text-sm">
                        {activity.target_user_id && (
                          <span className="font-mono">
                            User: {activity.target_user_id.slice(0, 8)}...
                          </span>
                        )}
                        {activity.action_details && (
                          <div className="text-xs mt-1 opacity-75">
                            {JSON.stringify(activity.action_details).slice(0, 50)}...
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {(!activities || activities.length === 0) && (
            <div className="text-center py-8 text-exchange-text-secondary">
              No admin activities found
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-exchange-card-bg border-exchange-border">
        <CardHeader>
          <CardTitle className="text-exchange-text-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userActivities?.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-exchange-text-secondary">
                      {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-exchange-text-secondary">
                      {activity.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {activity.activity_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-exchange-text-secondary">
                      {activity.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell className="text-exchange-text-secondary text-sm">
                      {activity.user_agent ? activity.user_agent.slice(0, 50) + '...' : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {(!userActivities || userActivities.length === 0) && (
            <div className="text-center py-8 text-exchange-text-secondary">
              No user activities found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminActivityLogs;
