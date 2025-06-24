import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserActivities } from '@/hooks/useUserActivities';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Upload, QrCode, CreditCard, DollarSign, Bitcoin, Zap } from 'lucide-react';

interface EnhancedDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedDepositModal: React.FC<EnhancedDepositModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { logActivity } = useUserActivities();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [network, setNetwork] = useState('TRC20');
  const [selectedMethod, setSelectedMethod] = useState<'crypto' | 'bank'>('crypto');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState('');

  const { data: cryptoAddresses } = useQuery({
    queryKey: ['crypto-addresses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  const submitDepositMutation = useMutation({
    mutationFn: async (depositData: any) => {
      if (!user) throw new Error('User not authenticated');

      let screenshotUrl = null;
      if (screenshot) {
        // Handle file upload logic here
        console.log('Uploading screenshot:', screenshot.name);
      }

      const { error } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: user.id,
          amount: parseFloat(depositData.amount),
          currency: depositData.currency,
          network: depositData.network,
          screenshot_url: screenshotUrl,
          status: 'pending'
        });

      if (error) throw error;

      // Log the activity
      logActivity('deposit_requested');
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit-requests'] });
      toast.success('Deposit request submitted successfully! Our team will review it shortly.');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error('Deposit submission failed:', error);
      toast.error(`Failed to submit deposit request: ${error.message}`);
    },
  });

  const resetForm = () => {
    setAmount('');
    setCurrency('USDT');
    setNetwork('TRC20');
    setSelectedMethod('crypto');
    setScreenshot(null);
    setTransactionId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (selectedMethod === 'crypto' && !screenshot) {
      toast.error('Please upload a transaction screenshot');
      return;
    }

    submitDepositMutation.mutate({
      amount,
      currency,
      network,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard!');
  };

  const selectedAddress = cryptoAddresses?.find(addr => 
    addr.currency === currency && addr.network === network
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-green-600" />
            Deposit Funds
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
                <p className="text-sm text-gray-600">Instant, Low Fees</p>
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
                <p className="text-sm text-gray-600">Traditional Banking</p>
                <Badge variant="outline" className="mt-2">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>

          {selectedMethod === 'crypto' && (
            <>
              {/* Currency and Network Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="BNB">BNB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
              </div>

              {/* Deposit Address */}
              {selectedAddress && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">Send {currency} to this address:</h3>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-mono break-all">{selectedAddress.wallet_address}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(selectedAddress.wallet_address)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        {selectedAddress.qr_code_url && (
                          <div className="mt-4">
                            <img 
                              src={selectedAddress.qr_code_url} 
                              alt="QR Code" 
                              className="w-32 h-32 mx-auto border rounded"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ Only send {currency} on {network} network to this address
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Screenshot Upload */}
              <div>
                <Label htmlFor="screenshot">Transaction Screenshot *</Label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="mt-1"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Upload a screenshot of your transaction for faster processing
                </p>
              </div>

              {/* Transaction ID */}
              <div>
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction hash/ID"
                  className="mt-1"
                />
              </div>
            </>
          )}

          {selectedMethod === 'bank' && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800 mb-2">Bank Transfer Coming Soon</h3>
                <p className="text-yellow-700">
                  We're working on adding bank transfer options. For now, please use cryptocurrency deposits.
                </p>
              </CardContent>
            </Card>
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
              disabled={submitDepositMutation.isPending || selectedMethod === 'bank'}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {submitDepositMutation.isPending ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Deposit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDepositModal;
