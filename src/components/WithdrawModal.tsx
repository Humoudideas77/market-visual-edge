
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserActivities } from '@/hooks/useUserActivities';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowUpRight, CreditCard, Bitcoin, Wallet, Zap } from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { logActivity } = useUserActivities();
  const { balances } = useWallet();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [network, setNetwork] = useState('TRC20');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'crypto' | 'bank'>('crypto');
  const [selectedBankCard, setSelectedBankCard] = useState('');

  const { data: bankCards } = useQuery({
    queryKey: ['bank-cards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bank_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalData: any) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: parseFloat(withdrawalData.amount),
          currency: withdrawalData.currency,
          network: withdrawalData.network,
          bank_card_id: withdrawalData.bankCardId || null,
          status: 'pending'
        });

      if (error) throw error;

      // Log the activity
      logActivity('withdrawal_requested');
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      toast.success('Withdrawal request submitted successfully! Our team will process it within 24 hours.');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error('Withdrawal submission failed:', error);
      toast.error(`Failed to submit withdrawal request: ${error.message}`);
    },
  });

  const resetForm = () => {
    setAmount('');
    setCurrency('USDT');
    setNetwork('TRC20');
    setWithdrawalAddress('');
    setSelectedMethod('crypto');
    setSelectedBankCard('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const availableBalance = balances.find(b => b.currency === currency)?.available || 0;
    if (parseFloat(amount) > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (selectedMethod === 'crypto' && !withdrawalAddress) {
      toast.error('Please enter a withdrawal address');
      return;
    }

    if (selectedMethod === 'bank' && !selectedBankCard) {
      toast.error('Please select a bank card');
      return;
    }

    submitWithdrawalMutation.mutate({
      amount,
      currency,
      network: selectedMethod === 'crypto' ? network : 'bank_transfer',
      bankCardId: selectedMethod === 'bank' ? selectedBankCard : null,
    });
  };

  const availableBalance = balances.find(b => b.currency === currency)?.available || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <ArrowUpRight className="w-6 h-6 mr-2 text-red-600" />
            Withdraw Funds
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Method Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${
                selectedMethod === 'crypto' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedMethod('crypto')}
            >
              <CardContent className="p-4 text-center">
                <Bitcoin className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <h3 className="font-semibold">Cryptocurrency</h3>
                <p className="text-sm text-gray-600">Fast & Secure</p>
                <Badge variant="secondary" className="mt-2">Recommended</Badge>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                selectedMethod === 'bank' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedMethod('bank')}
            >
              <CardContent className="p-4 text-center">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold">Bank Transfer</h3>
                <p className="text-sm text-gray-600">To Your Bank</p>
                {!bankCards?.length && (
                  <Badge variant="outline" className="mt-2">Add Card First</Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Amount and Currency Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Available: {availableBalance.toFixed(8)} {currency}
              </p>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {balances.filter(b => b.available > 0).map((balance) => (
                    <SelectItem key={balance.currency} value={balance.currency}>
                      {balance.currency} ({balance.available.toFixed(8)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedMethod === 'crypto' && (
            <>
              {/* Network Selection */}
              <div>
                <Label htmlFor="network">Network</Label>
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currency === 'USDT' && (
                      <>
                        <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                        <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                        <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
                      </>
                    )}
                    {currency === 'BTC' && (
                      <SelectItem value="Bitcoin">Bitcoin Network</SelectItem>
                    )}
                    {currency === 'ETH' && (
                      <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                    )}
                    {currency === 'BNB' && (
                      <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Withdrawal Address */}
              <div>
                <Label htmlFor="withdrawalAddress">Withdrawal Address</Label>
                <Input
                  id="withdrawalAddress"
                  type="text"
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  placeholder="Enter destination address"
                  className="mt-1"
                  required
                />
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Make sure the address supports {currency} on {network} network
                </p>
              </div>
            </>
          )}

          {selectedMethod === 'bank' && (
            <div>
              <Label htmlFor="bankCard">Select Bank Card</Label>
              {bankCards && bankCards.length > 0 ? (
                <Select value={selectedBankCard} onValueChange={setSelectedBankCard}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a bank card" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.bank_name} - ****{card.account_number.slice(-4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Card className="mt-1 bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                    <p className="text-yellow-700">
                      No bank cards found. Please add a bank card first.
                    </p>
                    <Button variant="outline" className="mt-2" size="sm">
                      Add Bank Card
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitWithdrawalMutation.isPending || 
                (selectedMethod === 'bank' && (!bankCards?.length || !selectedBankCard))
              }
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {submitWithdrawalMutation.isPending ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Submit Withdrawal
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
