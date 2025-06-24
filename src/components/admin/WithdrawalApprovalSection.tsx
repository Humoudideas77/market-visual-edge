
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Check, X, Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  network: string;
  status: string;
  bank_card_id: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const WithdrawalApprovalSection = () => {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading, refetch } = useQuery({
    queryKey: ['admin-withdrawals-v4'],
    queryFn: async () => {
      console.log('Fetching withdrawals for admin dashboard...');
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching withdrawals:', error);
        throw error;
      }
      console.log('Withdrawals fetched successfully:', data?.length || 0, 'records');
      return data as WithdrawalRequest[];
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    console.log('Setting up real-time subscription for withdrawals...');
    
    const channel = supabase
      .channel('withdrawal-changes-v3')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
        },
        (payload) => {
          console.log('Real-time withdrawal update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-v4'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up withdrawal subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      console.log('Updating withdrawal:', { id, status, notes });
      
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status,
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating withdrawal:', error);
        throw error;
      }

      if (status === 'approved') {
        const withdrawal = withdrawals?.find(w => w.id === id);
        if (withdrawal) {
          console.log('Updating wallet balance for approved withdrawal:', withdrawal);
          const { error: walletError } = await supabase.rpc('update_wallet_balance', {
            p_user_id: withdrawal.user_id,
            p_currency: withdrawal.currency,
            p_amount: withdrawal.amount,
            p_operation: 'subtract'
          });
          
          if (walletError) {
            console.error('Error updating wallet balance:', walletError);
            throw walletError;
          }
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error: activityError } = await supabase.from('admin_activities').insert({
          admin_id: session.user.id,
          action_type: `withdrawal_${status}`,
          target_table: 'withdrawal_requests',
          target_record_id: id,
          action_details: { status, notes },
        });
        
        if (activityError) {
          console.error('Error logging admin activity:', activityError);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-v4'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      
      if (variables.status === 'approved') {
        toast({ 
          title: 'Withdrawal approved successfully',
          description: 'Funds have been deducted from user wallet'
        });
      } else {
        toast({ title: 'Withdrawal request updated successfully' });
      }
      
      setSelectedWithdrawal(null);
      setAdminNotes('');
    },
    onError: (error) => {
      console.error('Withdrawal approval error:', error);
      toast({ title: 'Failed to update withdrawal request', variant: 'destructive' });
    },
  });

  const handleApprove = (withdrawal: WithdrawalRequest) => {
    updateWithdrawalMutation.mutate({
      id: withdrawal.id,
      status: 'approved',
      notes: adminNotes || 'Approved by admin',
    });
  };

  const handleReject = (withdrawal: WithdrawalRequest) => {
    if (!adminNotes.trim()) {
      toast({ title: 'Please provide a reason for rejection', variant: 'destructive' });
      return;
    }
    updateWithdrawalMutation.mutate({
      id: withdrawal.id,
      status: 'rejected',
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleRefresh = () => {
    console.log('Manually refreshing withdrawals...');
    refetch();
    toast({ title: 'Refreshing withdrawals...', description: 'Latest data will be loaded shortly' });
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

  const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending') || [];

  return (
    <Card className="bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-exchange-text-primary">
            Withdrawal Approvals ({withdrawals?.length || 0} total)
            {pendingWithdrawals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingWithdrawals.length} Pending
              </Badge>
            )}
          </CardTitle>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency/Network</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals?.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell className="text-exchange-text-secondary">
                    {format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-exchange-text-secondary">
                    {withdrawal.user_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-semibold text-exchange-text-primary">
                    ${withdrawal.amount}
                  </TableCell>
                  <TableCell className="text-exchange-text-secondary">
                    {withdrawal.currency} ({withdrawal.network})
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(withdrawal.status)}
                  </TableCell>
                  <TableCell>
                    {withdrawal.status === 'pending' ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setAdminNotes(withdrawal.admin_notes || '');
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-exchange-card-bg border-exchange-border">
                          <DialogHeader>
                            <DialogTitle className="text-exchange-text-primary">
                              Review Withdrawal Request
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-exchange-text-secondary">Amount:</span>
                                <span className="ml-2 font-semibold text-exchange-text-primary">
                                  ${withdrawal.amount} {withdrawal.currency}
                                </span>
                              </div>
                              <div>
                                <span className="text-exchange-text-secondary">Network:</span>
                                <span className="ml-2 text-exchange-text-primary">{withdrawal.network}</span>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-exchange-text-secondary">
                                Admin Notes
                              </label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes (required for rejection)"
                                className="mt-1 bg-exchange-bg border-exchange-border"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(withdrawal)}
                                disabled={updateWithdrawalMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(withdrawal)}
                                disabled={updateWithdrawalMutation.isPending}
                                variant="destructive"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-exchange-text-secondary text-sm">
                        {withdrawal.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {(!withdrawals || withdrawals.length === 0) && (
          <div className="text-center py-8 text-exchange-text-secondary">
            No withdrawal requests found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WithdrawalApprovalSection;
