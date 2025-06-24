import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Check, X, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect } from 'react';

type DepositRequest = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  network: string;
  status: string;
  transaction_screenshot_url: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const DepositApprovalSection = () => {
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: deposits, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-deposits-v4'], // Updated query key for fresh data
    queryFn: async () => {
      console.log('Fetching deposits with updated RLS policies...');
      
      // Get current user session to ensure we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session found');
        throw new Error('Authentication required');
      }
      
      console.log('Session confirmed, fetching deposits...');
      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching deposits:', error);
        throw error;
      }
      
      console.log('Deposits fetched successfully:', data?.length || 0, 'records');
      return data as DepositRequest[];
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    retry: 3,
    retryDelay: 1000,
  });

  // Set up real-time subscription for deposit requests
  useEffect(() => {
    console.log('Setting up real-time subscription for deposits...');
    
    const channel = supabase
      .channel('deposit-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deposit_requests',
        },
        (payload) => {
          console.log('Real-time deposit update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-deposits-v4'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up deposit subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateDepositMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      console.log('Updating deposit:', { id, status, notes });
      
      // Verify session before making update
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }
      
      const { error } = await supabase
        .from('deposit_requests')
        .update({
          status,
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating deposit:', error);
        throw error;
      }

      // If approved, update wallet balance automatically
      if (status === 'approved') {
        const deposit = deposits?.find(d => d.id === id);
        if (deposit) {
          console.log('Updating wallet balance for approved deposit:', deposit);
          const { error: walletError } = await supabase.rpc('update_wallet_balance', {
            p_user_id: deposit.user_id,
            p_currency: deposit.currency,
            p_amount: deposit.amount,
            p_operation: 'add'
          });
          
          if (walletError) {
            console.error('Error updating wallet balance:', walletError);
            throw walletError;
          }
        }
      }

      // Log admin activity
      if (session.user) {
        console.log('Logging admin activity for deposit update');
        const { error: activityError } = await supabase.from('admin_activities').insert({
          admin_id: session.user.id,
          action_type: `deposit_${status}`,
          target_table: 'deposit_requests',
          target_record_id: id,
          action_details: { status, notes },
        });
        
        if (activityError) {
          console.error('Error logging admin activity:', activityError);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits-v4'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      
      if (variables.status === 'approved') {
        toast({ 
          title: 'Deposit approved successfully', 
          description: 'Funds have been credited to user wallet immediately' 
        });
      } else {
        toast({ title: 'Deposit request updated successfully' });
      }
      
      setSelectedDeposit(null);
      setAdminNotes('');
    },
    onError: (error) => {
      console.error('Deposit approval error:', error);
      toast({ title: 'Failed to update deposit request', variant: 'destructive' });
    },
  });

  const handleApprove = (deposit: DepositRequest) => {
    updateDepositMutation.mutate({
      id: deposit.id,
      status: 'approved',
      notes: adminNotes || 'Approved by admin',
    });
  };

  const handleReject = (deposit: DepositRequest) => {
    if (!adminNotes.trim()) {
      toast({ title: 'Please provide a reason for rejection', variant: 'destructive' });
      return;
    }
    updateDepositMutation.mutate({
      id: deposit.id,
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

  const handleViewScreenshot = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRefresh = () => {
    console.log('Manually refreshing deposits...');
    refetch();
    toast({ title: 'Refreshing deposits...', description: 'Latest data will be loaded shortly' });
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

  if (error) {
    console.error('Deposit fetch error:', error);
    return (
      <Card className="bg-exchange-card-bg border-exchange-border">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              Error loading deposits: {error.message}
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingDeposits = deposits?.filter(d => d.status === 'pending') || [];

  return (
    <Card className="bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-exchange-text-primary">
            Deposit Approvals
            {pendingDeposits.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingDeposits.length} Pending
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
                <TableHead>Screenshot</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits?.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell className="text-exchange-text-secondary">
                    {format(new Date(deposit.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-exchange-text-secondary">
                    {deposit.user_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-semibold text-exchange-text-primary">
                    ${deposit.amount}
                  </TableCell>
                  <TableCell className="text-exchange-text-secondary">
                    {deposit.currency} ({deposit.network})
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(deposit.status)}
                  </TableCell>
                  <TableCell>
                    {deposit.transaction_screenshot_url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewScreenshot(deposit.transaction_screenshot_url!)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    ) : (
                      <span className="text-exchange-text-secondary">No screenshot</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deposit.status === 'pending' ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDeposit(deposit);
                              setAdminNotes(deposit.admin_notes || '');
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-exchange-card-bg border-exchange-border">
                          <DialogHeader>
                            <DialogTitle className="text-exchange-text-primary">
                              Review Deposit Request
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-exchange-text-secondary">Amount:</span>
                                <span className="ml-2 font-semibold text-exchange-text-primary">
                                  ${deposit.amount} {deposit.currency}
                                </span>
                              </div>
                              <div>
                                <span className="text-exchange-text-secondary">Network:</span>
                                <span className="ml-2 text-exchange-text-primary">{deposit.network}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-exchange-text-secondary">User ID:</span>
                                <span className="ml-2 font-mono text-sm text-exchange-text-primary">
                                  {deposit.user_id}
                                </span>
                              </div>
                            </div>

                            {deposit.transaction_screenshot_url && (
                              <div>
                                <label className="text-sm font-medium text-exchange-text-secondary mb-2 block">
                                  Transaction Screenshot
                                </label>
                                <div className="border border-exchange-border rounded-lg p-2">
                                  <img 
                                    src={deposit.transaction_screenshot_url}
                                    alt="Transaction Screenshot"
                                    className="max-w-full h-auto max-h-64 mx-auto rounded cursor-pointer"
                                    onClick={() => handleViewScreenshot(deposit.transaction_screenshot_url!)}
                                  />
                                  <p className="text-xs text-exchange-text-secondary mt-1 text-center">
                                    Click to view full size
                                  </p>
                                </div>
                              </div>
                            )}
                            
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
                                onClick={() => handleApprove(deposit)}
                                disabled={updateDepositMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(deposit)}
                                disabled={updateDepositMutation.isPending}
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
                        {deposit.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {(!deposits || deposits.length === 0) && (
          <div className="text-center py-8 text-exchange-text-secondary">
            No deposit requests found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DepositApprovalSection;
