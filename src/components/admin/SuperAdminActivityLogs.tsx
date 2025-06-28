
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Activity, User, Shield } from 'lucide-react';
import { format } from 'date-fns';

type AdminActivity = {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  target_table: string | null;
  target_record_id: string | null;
  action_details: any;
  created_at: string;
  profiles?: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const SuperAdminActivityLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-activities', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('admin_activities')
        .select(`
          *,
          profiles!admin_activities_admin_id_fkey (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data, error } = await query;
      if (error) throw error;
      return data as AdminActivity[];
    },
  });

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('user')) return <User className="w-4 h-4" />;
    if (actionType.includes('deposit') || actionType.includes('withdrawal')) return <Activity className="w-4 h-4" />;
    if (actionType.includes('kyc')) return <Shield className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionBadge = (actionType: string) => {
    if (actionType.includes('approved')) return <Badge className="bg-green-600">Approved</Badge>;
    if (actionType.includes('rejected')) return <Badge variant="destructive">Rejected</Badge>;
    if (actionType.includes('created')) return <Badge variant="secondary">Created</Badge>;
    if (actionType.includes('updated')) return <Badge className="bg-blue-600">Updated</Badge>;
    return <Badge variant="outline">{actionType}</Badge>;
  };

  // Filter activities based on search term
  const filteredActivities = activities?.filter(activity => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      activity.action_type?.toLowerCase().includes(searchLower) ||
      activity.target_table?.toLowerCase().includes(searchLower) ||
      activity.admin_id?.toLowerCase().includes(searchLower) ||
      activity.profiles?.email?.toLowerCase().includes(searchLower) ||
      activity.profiles?.first_name?.toLowerCase().includes(searchLower) ||
      activity.profiles?.last_name?.toLowerCase().includes(searchLower) ||
      JSON.stringify(activity.action_details)?.toLowerCase().includes(searchLower)
    );
  });

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
        <CardTitle className="text-exchange-text-primary flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Admin Activity Logs
          <Badge variant="outline" className="ml-2">
            {filteredActivities?.length || 0} Activities
          </Badge>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-exchange-text-secondary w-4 h-4" />
            <Input
              placeholder="Search by action, admin email, table, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-exchange-bg border-exchange-border text-exchange-text-primary"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities?.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="text-exchange-text-secondary">
                    {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-exchange-text-primary">
                        {activity.profiles?.email || 'Unknown Admin'}
                      </div>
                      <div className="text-sm text-exchange-text-secondary font-mono">
                        {activity.admin_id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(activity.action_type)}
                      {getActionBadge(activity.action_type)}
                    </div>
                  </TableCell>
                  <TableCell className="text-exchange-text-secondary">
                    {activity.target_table && (
                      <div>
                        <div className="font-medium">{activity.target_table}</div>
                        {activity.target_record_id && (
                          <div className="text-xs font-mono">
                            {activity.target_record_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {activity.action_details && (
                      <div className="text-sm text-exchange-text-secondary max-w-xs">
                        <pre className="whitespace-pre-wrap text-xs bg-exchange-bg p-2 rounded border border-exchange-border overflow-x-auto">
                          {JSON.stringify(activity.action_details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {(!filteredActivities || filteredActivities.length === 0) && (
          <div className="text-center py-8 text-exchange-text-secondary">
            {searchTerm ? 'No activity logs found matching your search' : 'No activity logs found'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminActivityLogs;
