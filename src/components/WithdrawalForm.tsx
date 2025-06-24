
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Plus } from 'lucide-react';
import BankCardModal from './BankCardModal';

interface BankCard {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
}

const WithdrawalForm = () => {
  const { user } = useAuth();
  const { getBalance } = useWallet();
  const [loading, setLoading] = useState(false);
  const [bankCards, setBankCards] = useState<BankCard[]>([]);
  const [showBankCardModal, setShowBankCardModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USDT',
    network: 'TRC20',
    bankCardId: '',
  });

  const currencies = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'];
  const networks = ['TRC20', 'ERC20', 'BEP20', 'Solana', 'Bitcoin'];

  useEffect(() => {
    if (user) {
      fetchBankCards();
    }
  }, [user]);

  const fetchBankCards = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_cards')
        .select('id, bank_name, account_holder_name, account_number')
        .eq('user_id', user!.id);

      if (error) throw error;
      setBankCards(data || []);
    } catch (error) {
      console.error('Error fetching bank cards:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.bankCardId) {
      toast.error('Please select a bank card');
      return;
    }

    // Check balance
    const balance = getBalance(formData.currency);
    if (!balance || balance.available < amount) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: amount,
          currency: formData.currency,
          network: formData.network,
          bank_card_id: formData.bankCardId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Withdrawal request submitted successfully!');
      
      // Reset form
      setFormData({ amount: '', currency: 'USDT', network: 'TRC20', bankCardId: '' });

    } catch (error) {
      console.error('Withdrawal submission error:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const selectedBalance = getBalance(formData.currency);

  return (
    <>
      <Card className="w-full max-w-md mx-auto bg-exchange-card-bg border-exchange-border">
        <CardHeader>
          <CardTitle className="text-exchange-text-primary flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Withdraw Funds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="currency" className="text-exchange-text-secondary">
                Currency
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="bg-exchange-bg border-exchange-border text-exchange-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-exchange-card-bg border-exchange-border">
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency} className="text-exchange-text-primary">
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBalance && (
                <p className="text-sm text-exchange-text-secondary mt-1">
                  Available: {selectedBalance.available} {formData.currency}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="amount" className="text-exchange-text-secondary">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedBalance?.available || 0}
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="network" className="text-exchange-text-secondary">
                Network
              </Label>
              <Select
                value={formData.network}
                onValueChange={(value) => setFormData({ ...formData, network: value })}
              >
                <SelectTrigger className="bg-exchange-bg border-exchange-border text-exchange-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-exchange-card-bg border-exchange-border">
                  {networks.map((network) => (
                    <SelectItem key={network} value={network} className="text-exchange-text-primary">
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-exchange-text-secondary">Bank Card</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBankCardModal(true)}
                  className="border-exchange-border text-exchange-text-secondary hover:bg-exchange-bg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Card
                </Button>
              </div>
              <Select
                value={formData.bankCardId}
                onValueChange={(value) => setFormData({ ...formData, bankCardId: value })}
              >
                <SelectTrigger className="bg-exchange-bg border-exchange-border text-exchange-text-primary">
                  <SelectValue placeholder="Select bank card" />
                </SelectTrigger>
                <SelectContent className="bg-exchange-card-bg border-exchange-border">
                  {bankCards.map((card) => (
                    <SelectItem key={card.id} value={card.id} className="text-exchange-text-primary">
                      {card.bank_name} - {card.account_holder_name} (*{card.account_number.slice(-4)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading || !selectedBalance || selectedBalance.available <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <BankCardModal
        isOpen={showBankCardModal}
        onClose={() => setShowBankCardModal(false)}
        onSuccess={() => {
          setShowBankCardModal(false);
          fetchBankCards();
        }}
      />
    </>
  );
};

export default WithdrawalForm;
