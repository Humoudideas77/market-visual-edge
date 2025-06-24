
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowUpRight, CreditCard, Plus } from 'lucide-react';
import BankCardModal from './BankCardModal';

interface BankCard {
  id: string;
  bank_name: string;
  account_number: string;
  bank_address: string;
  swift_code: string;
  account_holder_name: string;
  routing_number: string;
  is_default: boolean;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawModal = ({ isOpen, onClose }: WithdrawModalProps) => {
  const { user } = useAuth();
  const { getBalance } = useWallet();
  const [loading, setLoading] = useState(false);
  const [bankCards, setBankCards] = useState<BankCard[]>([]);
  const [selectedBankCard, setSelectedBankCard] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [network, setNetwork] = useState('ERC20');
  const [amount, setAmount] = useState('');
  const [showBankCardModal, setShowBankCardModal] = useState(false);

  const currencies = ['USDT', 'BTC', 'ETH', 'BNB'];
  const networkOptions: { [key: string]: string[] } = {
    USDT: ['ERC20', 'TRC20'],
    BTC: ['Bitcoin'],
    ETH: ['ERC20'],
    BNB: ['BEP20']
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchBankCards();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Reset network when currency changes
    const availableNetworks = networkOptions[currency] || [];
    if (availableNetworks.length > 0) {
      setNetwork(availableNetworks[0]);
    }
  }, [currency]);

  const fetchBankCards = async () => {
    if (!user) return;

    try {
      console.log('Fetching bank cards for user:', user.id);
      const { data, error } = await supabase
        .from('bank_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bank cards:', error);
        toast.error('Failed to load bank cards');
        return;
      }
      
      console.log('Bank cards fetched:', data);
      setBankCards(data || []);
      
      // Auto-select default card or first card
      const defaultCard = data?.find(card => card.is_default);
      if (defaultCard) {
        setSelectedBankCard(defaultCard.id);
      } else if (data && data.length > 0) {
        setSelectedBankCard(data[0].id);
      }
    } catch (error) {
      console.error('Unexpected error fetching bank cards:', error);
      toast.error('Failed to load bank cards');
    }
  };

  const selectedCard = bankCards.find(card => card.id === selectedBankCard);
  const balance = getBalance(currency);
  const availableBalance = balance?.available || 0;
  const withdrawAmount = parseFloat(amount) || 0;

  const handleMaxClick = () => {
    const maxAmount = Math.max(0, availableBalance - 1); // Leave 1 unit for fees
    setAmount(maxAmount.toFixed(8));
  };

  const handleWithdraw = async () => {
    if (!user) {
      toast.error('You must be logged in to withdraw');
      return;
    }

    if (!selectedBankCard) {
      toast.error('Please select a bank card');
      return;
    }

    if (!amount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (withdrawAmount < 50) {
      toast.error('Minimum withdrawal amount is $50');
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting withdrawal request:', {
        user_id: user.id,
        bank_card_id: selectedBankCard,
        currency,
        network,
        amount: withdrawAmount
      });

      // Create withdrawal request
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          bank_card_id: selectedBankCard,
          currency,
          network,
          amount: withdrawAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Withdrawal request created:', data);
      toast.success('Withdrawal request submitted successfully. Processing time: 1-3 business days.');
      
      // Reset form
      setAmount('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      toast.error(error.message || 'Failed to submit withdrawal request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ArrowUpRight className="w-5 h-5 mr-2" />
              Withdraw Funds
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Bank Card Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Bank Card</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBankCardModal(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Card
                </Button>
              </div>
              
              {bankCards.length > 0 ? (
                <select
                  value={selectedBankCard}
                  onChange={(e) => setSelectedBankCard(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {bankCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.bank_name} - ****{card.account_number.slice(-4)} ({card.account_holder_name})
                      {card.is_default ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 mb-2">
                    No bank cards added yet
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowBankCardModal(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Add Bank Card
                  </Button>
                </div>
              )}
            </div>

            {/* Selected Card Details */}
            {selectedCard && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Withdrawal Destination
                </h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Bank: {selectedCard.bank_name}</div>
                  <div>Account: ****{selectedCard.account_number.slice(-4)}</div>
                  <div>Holder: {selectedCard.account_holder_name}</div>
                  <div>SWIFT: {selectedCard.swift_code}</div>
                </div>
              </div>
            )}

            {/* Currency Selection */}
            <div>
              <Label htmlFor="currency" className="text-sm font-medium mb-2 block">
                Currency
              </Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            {/* Network Selection */}
            {networkOptions[currency]?.length > 1 && (
              <div>
                <Label htmlFor="network" className="text-sm font-medium mb-2 block">
                  Network
                </Label>
                <select
                  id="network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {networkOptions[currency].map((net) => (
                    <option key={net} value={net}>
                      {net}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Available Balance */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available Balance:</span>
                <span className="text-sm font-mono text-gray-900">
                  {availableBalance.toFixed(8)} {currency}
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMaxClick}
                  disabled={availableBalance <= 0}
                >
                  Max
                </Button>
              </div>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="50"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum withdrawal: $50 USD
              </p>
            </div>

            {/* Withdrawal Summary */}
            {amount && withdrawAmount >= 50 && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Withdrawal Amount:</span>
                  <span className="text-gray-900 font-mono">
                    {withdrawAmount.toFixed(8)} {currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing Fee:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="text-gray-600">1-3 business days</span>
                </div>
              </div>
            )}

            {/* Withdrawal Button */}
            <Button
              onClick={handleWithdraw}
              disabled={loading || !selectedBankCard || !amount || withdrawAmount < 50 || withdrawAmount > availableBalance}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowUpRight className="w-4 h-4 mr-2" />
              )}
              Withdraw {amount && `${amount} ${currency}`}
            </Button>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Important Notice:
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Withdrawals are processed within 1-3 business days</li>
                <li>• Ensure your bank card details are accurate</li>
                <li>• International transfers may take longer</li>
                <li>• Minimum withdrawal amount is $50 USD</li>
                <li>• Contact support for any issues</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Card Modal */}
      <BankCardModal
        isOpen={showBankCardModal}
        onClose={() => setShowBankCardModal(false)}
        onSuccess={fetchBankCards}
      />
    </>
  );
};

export default WithdrawModal;
