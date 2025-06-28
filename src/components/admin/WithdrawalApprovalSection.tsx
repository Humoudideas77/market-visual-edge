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
import { Check, X, Eye, CreditCard } from 'lucide-react';
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
  bank_cards?: {
    id: string;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    swift_code: string;
    routing_number: string | null;
    bank_address: string | null;
  } | null;
}

interface BankCard {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  swift_code: string;
  routing_number: string | null;
  bank_address: string | null;
}

const WithdrawalApprovalSection = () => {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          bank_cards (
            id,
            bank_name,
            account_number,
            account_holder_name,
            swift_code,
            routing_number,
            bank_address
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get user details for each withdrawal
      const userIds = data.map(w => w.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      // Combine withdrawal data with user profiles
      const enrichedData = data.map(withdrawal => {
        const profile = profiles?.find(p => p.id === withdrawal.user_id);
        return {
          ...withdrawal,
          user_email: profile?.email,
          user_first_name: profile?.first_name,
          user_last_name: profile?.last_name,
        };
      });

      return enrichedData as (WithdrawalRequest & {
        user_email?: string;
        user_first_name?: string;
        user_last_name?: string;
      })[];
    },
  });

  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status,
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // If approved, deduct from wallet balance
      if (status === 'approved') {
        const withdrawal = withdrawals?.find(w => w.id === id);
        if (withdrawal) {
          const { error: walletError } = await supabase.rpc('update_wallet_balance', {
            p_user_id: withdrawal.user_id,
            p_currency: withdrawal.currency,
            p_amount: withdrawal.amount,
            p_operation: 'subtract'
          });
          
          if (walletError) throw walletError;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      
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
        <CardTitle className="text-exchange-text-primary">
          Withdrawal Approvals
          {pendingWithdrawals.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingWithdrawals.length} Pending
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
                <TableHead>User Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency/Network</TableHead>
                <TableHead>Bank Details</TableHead>
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
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-exchange-text-primary">
                        {withdrawal.user_email || 'No email'}
                      </div>
                      <div className="text-sm text-exchange-text-secondary">
                        {withdrawal.user_first_name && withdrawal.user_last_name
                          ? `${withdrawal.user_first_name} ${withdrawal.user_last_name}`
                          : 'No name'}
                      </div>
                      <div className="text-xs font-mono text-exchange-text-secondary">
                        {withdrawal.user_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-exchange-text-primary">
                    ${withdrawal.amount}
                  </TableCell>
                  <TableCell className="text-exchange-text-secondary">
                    {withdrawal.currency} ({withdrawal.network})
                  </TableCell>
                  <TableCell className="text-exchange-text-secondary">
                    {withdrawal.bank_cards ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <div className="font-medium">{withdrawal.bank_cards.bank_name}</div>
                        </div>
                        <div className="text-xs">{withdrawal.bank_cards.account_holder_name}</div>
                        <div className="text-xs font-mono">****{withdrawal.bank_cards.account_number.slice(-4)}</div>
                      </div>
                    ) : (
                      <span className="text-red-400">No bank details</span>
                    )}
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
                        <DialogContent className="bg-exchange-card-bg border-exchange-border max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-exchange-text-primary">
                              Review Withdrawal Request
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
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
                              <div className="col-span-2">
                                <span className="text-exchange-text-secondary">User ID:</span>
                                <span className="ml-2 font-mono text-sm text-exchange-text-primary">
                                  {withdrawal.user_id}
                                </span>
                              </div>
                            </div>

                            {/* Bank Card Details Section */}
                            {withdrawal.bank_cards && (
                              <div className="bg-exchange-accent/20 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-exchange-text-primary mb-3 flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  Bank Account Details
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-exchange-text-secondary">Bank Name:</span>
                                    <div className="font-medium text-exchange-text-primary">
                                      {withdrawal.bank_cards.bank_name}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-exchange-text-secondary">Account Holder:</span>
                                    <div className="font-medium text-exchange-text-primary">
                                      {withdrawal.bank_cards.account_holder_name}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-exchange-text-secondary">Account Number:</span>
                                    <div className="font-mono text-exchange-text-primary">
                                      {withdrawal.bank_cards.account_number}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-exchange-text-secondary">SWIFT Code:</span>
                                    <div className="font-mono text-exchange-text-primary">
                                      {withdrawal.bank_cards.swift_code}
                                    </div>
                                  </div>
                                  {withdrawal.bank_cards.routing_number && (
                                    <div>
                                      <span className="text-exchange-text-secondary">Routing Number:</span>
                                      <div className="font-mono text-exchange-text-primary">
                                        {withdrawal.bank_cards.routing_number}
                                      </div>
                                    </div>
                                  )}
                                  {withdrawal.bank_cards.bank_address && (
                                    <div className="col-span-2">
                                      <span className="text-exchange-text-secondary">Bank Address:</span>
                                      <div className="text-exchange-text-primary">
                                        {withdrawal.bank_cards.bank_address}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {!withdrawal.bank_cards && (
                              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-red-400">
                                  <X className="w-4 h-4" />
                                  <span className="font-medium">No Bank Details Found</span>
                                </div>
                                <p className="text-sm text-red-300 mt-1">
                                  This withdrawal request does not have associated bank account details.
                                </p>
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
                                onClick={() => handleApprove(withdrawal)}
                                disabled={updateWithdrawalMutation.isPending || !withdrawal.bank_cards}
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
                        {withdrawal.status === 'approved' ? 'Approved' : 'Rejected'}
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
