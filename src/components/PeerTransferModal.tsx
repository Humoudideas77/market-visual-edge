
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/hooks/useWallet';
import { usePeerTransfers } from '@/hooks/usePeerTransfers';
import { SendHorizontal } from 'lucide-react';

interface PeerTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PeerTransferModal = ({ isOpen, onClose }: PeerTransferModalProps) => {
  const { balances } = useWallet();
  const { sendTransfer } = usePeerTransfers();
  const [recipientId, setRecipientId] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableBalances = balances.filter(balance => balance.available > 0);

  const handleTransfer = async () => {
    if (!recipientId.trim() || !amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      const success = await sendTransfer(
        recipientId.trim().toUpperCase(),
        selectedCurrency,
        parseFloat(amount),
        notes.trim() || undefined
      );

      if (success) {
        setRecipientId('');
        setAmount('');
        setNotes('');
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBalance = balances.find(b => b.currency === selectedCurrency);
  const maxAmount = selectedBalance?.available || 0;
  const isValidAmount = parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <SendHorizontal className="w-5 h-5" />
            <span>Send to User</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient ID</Label>
            <Input
              id="recipient"
              placeholder="Enter 12-character user ID (e.g., ABC123DEF456)"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="uppercase font-mono"
              maxLength={12}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the recipient's unique transfer ID
            </p>
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableBalances.map((balance) => (
                  <SelectItem key={balance.currency} value={balance.currency}>
                    {balance.currency} (Available: {balance.available})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {selectedBalance && (
              <p className="text-xs text-muted-foreground mt-1">
                Available: {selectedBalance.available} {selectedCurrency}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add a note for this transfer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!recipientId.trim() || !isValidAmount || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : 'Send Transfer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PeerTransferModal;
