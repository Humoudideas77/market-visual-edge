
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Activity, Users, Shield, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import ActivityMonitor from './ActivityMonitor';

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
  const [newAdminActivitiesCount, setNewAdminActivitiesCount] = useState(0);

  const { data: adminActivities, isLoading: adminLoading, refetch: refetchAdmin } = useQuery({
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

  // Set up real-time subscriptions for admin activity updates
  useEffect(() => {
    const adminActivityChannel = supabase
      .channel('admin-activities-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_activities',
        },
        () => {
          console.log('New admin activity detected, refreshing...');
          setNewAdminActivitiesCount(prev => prev + 1);
          refetchAdmin();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(adminActivityChannel);
    };
  }, [refetchAdmin]);

  const getActivityBadge = (actionType: string) => {
    if (actionType.includes('approved')) return 'default';
    if (actionType.includes('rejected')) return 'destructive';
    if (actionType.includes('created') || actionType.includes('updated')) return 'secondary';
    return 'outline';
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (adminLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-exchange-card-bg border-exchange-border">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 bg-exchange-border rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="user-activities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-exchange-card-bg border border-exchange-border">
          <TabsTrigger 
            value="user-activities" 
            className="data-[state=active]:bg-exchange-accent flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            User Activities
          </TabsTrigger>
          <TabsTrigger 
            value="admin-activities" 
            className="data-[state=active]:bg-exchange-accent flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Admin Activities
            {newAdminActivitiesCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                <Bell className="w-3 h-3 mr-1" />
                {newAdminActivitiesCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-activities" className="space-y-6">
          <ActivityMonitor />
        </TabsContent>

        <TabsContent value="admin-activities" className="space-y-6">
          <Card className="bg-exchange-card-bg border-exchange-border">
            <CardHeader>
              <CardTitle className="text-exchange-text-primary flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Activity Logs
                {newAdminActivitiesCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    <Bell className="w-3 h-3 mr-1" />
                    {newAdminActivitiesCount} New
                  </Badge>
                )}
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
                    {adminActivities?.map((activity) => (
                      <TableRow key={activity.id} className="hover:bg-gray-800/50">
                        <TableCell className="text-exchange-text-secondary">
                          {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-exchange-text-secondary">
                          {activity.admin_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-exchange-text-secondary" />
                            <Badge variant={getActivityBadge(activity.action_type)}>
                              {formatActionType(activity.action_type)}
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
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {(!adminActivities || adminActivities.length === 0) && (
                <div className="text-center py-8 text-exchange-text-secondary">
                  No admin activities found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminActivityLogs;
