import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, Eye, UserCog, Shield, User } from 'lucide-react';
import { format } from 'date-fns';

type UserRole = 'user' | 'admin' | 'superadmin';

type UserProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  kyc_status: string | null;
  created_at: string;
  updated_at: string;
};

const UserManagementSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      // Log admin activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_activities').insert({
          admin_id: user.id,
          action_type: 'user_role_updated',
          target_user_id: userId,
          target_table: 'profiles',
          target_record_id: userId,
          action_details: { new_role: role },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User role updated successfully' });
      setSelectedUser(null);
      setNewRole('user');
    },
    onError: () => {
      toast({ title: 'Failed to update user role', variant: 'destructive' });
    },
  });

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      user: 'secondary',
      admin: 'default',
      superadmin: 'destructive',
    } as const;
    
    const icons = {
      user: User,
      admin: UserCog,
      superadmin: Shield,
    } as const;

    const Icon = icons[role];
    
    return (
      <Badge variant={variants[role]}>
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getKYCStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Not Started</Badge>;
    
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      resubmission_required: 'outline',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-exchange-card-bg border-exchange-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
        <CardTitle className="text-exchange-text-primary">User Management</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-exchange-text-secondary w-4 h-4" />
            <Input
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-exchange-bg border-exchange-border"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-exchange-text-primary">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : 'Unnamed User'
                        }
                      </div>
                      <div className="text-sm font-mono text-exchange-text-secondary">
                        {user.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-exchange-text-secondary">
                    {user.email || 'No email'}
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    {getKYCStatusBadge(user.kyc_status)}
                  </TableCell>
                  <TableCell className="text-exchange-text-secondary">
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-exchange-card-bg border-exchange-border">
                        <DialogHeader>
                          <DialogTitle className="text-exchange-text-primary">
                            Manage User: {user.first_name} {user.last_name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-exchange-text-secondary">Email:</span>
                              <span className="ml-2 text-exchange-text-primary">{user.email}</span>
                            </div>
                            <div>
                              <span className="text-exchange-text-secondary">Current Role:</span>
                              <span className="ml-2">{getRoleBadge(user.role)}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-exchange-text-secondary">User ID:</span>
                              <span className="ml-2 font-mono text-sm text-exchange-text-primary">
                                {user.id}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-exchange-text-secondary">
                              Change Role
                            </label>
                            <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
                              <SelectTrigger className="mt-1 bg-exchange-bg border-exchange-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-exchange-card-bg border-exchange-border">
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => updateUserRoleMutation.mutate({ 
                                userId: user.id, 
                                role: newRole 
                              })}
                              disabled={updateUserRoleMutation.isPending || newRole === user.role}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Update Role
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {(!users || users.length === 0) && (
          <div className="text-center py-8 text-exchange-text-secondary">
            No users found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagementSection;
