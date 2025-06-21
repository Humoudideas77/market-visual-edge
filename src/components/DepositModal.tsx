
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { Loader2, CreditCard, Wallet, Building } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const { depositFunds } = useWallet();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [depositMethod, setDepositMethod] = useState<'card' | 'bank' | 'crypto'>('card');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (depositAmount < 10) {
      toast.error('Minimum deposit amount is $10');
      return;
    }

    setLoading(true);
    
    try {
      const success = await depositFunds(currency, depositAmount);
      
      if (success) {
        toast.success(`Successfully deposited ${depositAmount} ${currency}`);
        setAmount('');
        onClose();
      } else {
        toast.error('Deposit failed. Please try again.');
      }
    } catch (error) {
      toast.error('Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const depositMethods = [
    { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, fee: '2.5%' },
    { id: 'bank', label: 'Bank Transfer', icon: Building, fee: 'Free' },
    { id: 'crypto', label: 'Crypto Transfer', icon: Wallet, fee: 'Network fee' },
  ];

  const currencies = ['USDT', 'BTC', 'ETH', 'BNB'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Deposit Method Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Deposit Method</Label>
            <div className="grid grid-cols-1 gap-2">
              {depositMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setDepositMethod(method.id as any)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      depositMethod === method.id
                        ? 'border-exchange-blue bg-exchange-blue/10'
                        : 'border-exchange-border hover:border-exchange-blue/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-exchange-text-secondary" />
                      <span className="text-exchange-text-primary">{method.label}</span>
                    </div>
                    <span className="text-sm text-exchange-text-secondary">{method.fee}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <Label htmlFor="currency" className="text-sm font-medium mb-2 block">
              Currency
            </Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="exchange-input w-full"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="exchange-input"
              min="10"
              step="0.01"
            />
            <p className="text-xs text-exchange-text-secondary mt-1">
              Minimum deposit: $10 USD
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Select</Label>
            <div className="grid grid-cols-4 gap-2">
              {['100', '500', '1000', '5000'].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount)}
                  className="text-xs"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Deposit Info */}
          {amount && !isNaN(parseFloat(amount)) && (
            <div className="bg-exchange-accent/30 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-exchange-text-secondary">Deposit Amount:</span>
                <span className="text-exchange-text-primary font-medium">
                  {amount} {currency}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-exchange-text-secondary">Processing Fee:</span>
                <span className="text-exchange-text-primary">
                  {depositMethod === 'bank' ? 'Free' : `${depositMethods.find(m => m.id === depositMethod)?.fee}`}
                </span>
              </div>
            </div>
          )}

          {/* Deposit Button */}
          <Button
            onClick={handleDeposit}
            disabled={loading || !amount || parseFloat(amount) < 10}
            className="w-full bg-exchange-green hover:bg-exchange-green/90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Deposit {amount && `${amount} ${currency}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
