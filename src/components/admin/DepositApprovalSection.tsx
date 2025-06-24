import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

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

  const { data: deposits, isLoading } = useQuery({
    queryKey: ['admin-deposits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DepositRequest[];
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated admin user found');
      }

      console.log('Starting deposit approval process:', { id, status, notes, adminId: user.id });

      // Update deposit request status
      const { error: depositError } = await supabase
        .from('deposit_requests')
        .update({
          status,
          admin_notes: notes,
          admin_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (depositError) {
        console.error('Deposit request update error:', depositError);
        throw depositError;
      }

      // Only credit wallet balance if deposit is approved
      if (status === 'approved') {
        const deposit = deposits?.find(d => d.id === id);
        if (deposit) {
          console.log('Crediting wallet balance for approved deposit:', {
            userId: deposit.user_id,
            currency: deposit.currency,
            amount: deposit.amount
          });

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

          console.log('Successfully credited wallet balance');
        }
      }

      // Log admin activity
      const { error: activityError } = await supabase
        .from('admin_activities')
        .insert({
          admin_id: user.id,
          action_type: `deposit_${status}`,
          target_table: 'deposit_requests',
          target_record_id: id,
          action_details: { status, notes, amount: deposits?.find(d => d.id === id)?.amount },
        });
        
      if (activityError) {
        console.error('Activity log error:', activityError);
        // Don't throw here, just log the error
      }
      
      return { status, notes };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      
      if (data.status === 'approved') {
        toast.success('Deposit approved successfully! Funds have been credited to user wallet.');
      } else if (data.status === 'rejected') {
        toast.success('Deposit rejected successfully. User has been notified.');
      } else {
        toast.success('Deposit request updated successfully');
      }
      
      setSelectedDeposit(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      console.error('Deposit approval failed:', error);
      toast.error(`Failed to update deposit request: ${error.message}`);
    },
  });

  const handleApprove = (deposit: DepositRequest) => {
    console.log('Approving deposit:', deposit.id);
    updateDepositMutation.mutate({
      id: deposit.id,
      status: 'approved',
      notes: adminNotes || 'Deposit approved by admin - funds credited to wallet',
    });
  };

  const handleReject = (deposit: DepositRequest) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    console.log('Rejecting deposit:', deposit.id);
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

  const pendingDeposits = deposits?.filter(d => d.status === 'pending') || [];

  return (
    <Card className="bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <CardTitle className="text-exchange-text-primary">
          Deposit Approvals
          {pendingDeposits.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingDeposits.length} Pending
            </Badge>
          )}
        </CardTitle>
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
                                {updateDepositMutation.isPending ? 'Processing...' : 'Approve & Credit Wallet'}
                              </Button>
                              <Button
                                onClick={() => handleReject(deposit)}
                                disabled={updateDepositMutation.isPending}
                                variant="destructive"
                              >
                                <X className="w-4 h-4 mr-1" />
                                {updateDepositMutation.isPending ? 'Processing...' : 'Reject'}
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
