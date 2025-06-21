
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, QrCode, Copy, Check } from 'lucide-react';

interface CryptoAddress {
  id: string;
  currency: string;
  network: string;
  wallet_address: string;
  qr_code_url: string | null;
}

interface EnhancedDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedDepositModal = ({ isOpen, onClose }: EnhancedDepositModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoAddress[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [copiedAddress, setCopiedAddress] = useState('');

  const currencies = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'];

  useEffect(() => {
    if (isOpen) {
      fetchCryptoAddresses();
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset network selection when currency changes
    setSelectedNetwork('');
    const networksForCurrency = cryptoAddresses
      .filter(addr => addr.currency === selectedCurrency)
      .map(addr => addr.network);
    if (networksForCurrency.length === 1) {
      setSelectedNetwork(networksForCurrency[0]);
    }
  }, [selectedCurrency, cryptoAddresses]);

  const fetchCryptoAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('is_active', true)
        .order('currency');

      if (error) throw error;
      setCryptoAddresses(data || []);
    } catch (error) {
      console.error('Error fetching crypto addresses:', error);
      toast.error('Failed to load deposit addresses');
    }
  };

  const selectedAddress = cryptoAddresses.find(
    addr => addr.currency === selectedCurrency && addr.network === selectedNetwork
  );

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopiedAddress(''), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setScreenshot(file);
    }
  };

  const uploadScreenshot = async (file: File): Promise<string | null> => {
    setUploadingScreenshot(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('deposit-screenshots')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('deposit-screenshots')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      toast.error('Failed to upload screenshot');
      return null;
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmitDeposit = async () => {
    if (!user) {
      toast.error('You must be logged in to make a deposit');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select a currency and network');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 10) {
      toast.error('Minimum deposit amount is $10');
      return;
    }

    if (!screenshot) {
      toast.error('Please upload a transaction screenshot');
      return;
    }

    setLoading(true);

    try {
      // Upload screenshot first
      const screenshotUrl = await uploadScreenshot(screenshot);
      if (!screenshotUrl) return;

      // Create deposit request
      const { error } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: user.id,
          currency: selectedCurrency,
          network: selectedNetwork,
          amount: parseFloat(amount),
          transaction_screenshot_url: screenshotUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Deposit request submitted successfully. We will review and process it within 24 hours.');
      
      // Reset form
      setAmount('');
      setScreenshot(null);
      onClose();
    } catch (error: any) {
      console.error('Error submitting deposit:', error);
      toast.error('Failed to submit deposit request');
    } finally {
      setLoading(false);
    }
  };

  const networksForCurrency = cryptoAddresses
    .filter(addr => addr.currency === selectedCurrency)
    .map(addr => ({ network: addr.network, id: addr.id }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crypto Deposit</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Currency Selection */}
          <div>
            <Label htmlFor="currency" className="text-sm font-medium mb-2 block">
              Select Currency
            </Label>
            <select
              id="currency"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="exchange-input w-full"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          {/* Network Selection */}
          {networksForCurrency.length > 1 && (
            <div>
              <Label htmlFor="network" className="text-sm font-medium mb-2 block">
                Select Network
              </Label>
              <select
                id="network"
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="exchange-input w-full"
              >
                <option value="">Choose Network</option>
                {networksForCurrency.map((item) => (
                  <option key={item.id} value={item.network}>
                    {item.network}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Deposit Address */}
          {selectedAddress && (
            <div className="bg-exchange-accent/20 rounded-lg p-4">
              <Label className="text-sm font-medium mb-2 block">
                Deposit Address ({selectedAddress.network})
              </Label>
              
              {/* QR Code */}
              {selectedAddress.qr_code_url && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={selectedAddress.qr_code_url} 
                    alt="QR Code"
                    className="w-32 h-32 border rounded"
                  />
                </div>
              )}

              {/* Address */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-2 bg-exchange-bg rounded border font-mono text-sm break-all">
                  {selectedAddress.wallet_address}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCopyAddress(selectedAddress.wallet_address)}
                  className="bg-exchange-blue hover:bg-exchange-blue/90"
                >
                  {copiedAddress === selectedAddress.wallet_address ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-exchange-text-secondary mt-2">
                Send only {selectedCurrency} to this address via {selectedAddress.network} network.
              </p>
            </div>
          )}

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

          {/* Screenshot Upload */}
          <div>
            <Label htmlFor="screenshot" className="text-sm font-medium mb-2 block">
              Transaction Screenshot *
            </Label>
            <div className="border-2 border-dashed border-exchange-border rounded-lg p-4">
              <input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="hidden"
              />
              <label 
                htmlFor="screenshot"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="w-8 h-8 text-exchange-text-secondary" />
                <span className="text-sm text-exchange-text-secondary">
                  {screenshot ? screenshot.name : 'Click to upload transaction screenshot'}
                </span>
                <span className="text-xs text-exchange-text-muted">
                  PNG, JPG up to 5MB
                </span>
              </label>
            </div>
          </div>

          {/* Deposit Instructions */}
          <div className="bg-exchange-yellow/10 border border-exchange-yellow/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-exchange-text-primary mb-2">
              Important Instructions:
            </h4>
            <ul className="text-xs text-exchange-text-secondary space-y-1">
              <li>• Send the exact amount you entered above</li>
              <li>• Use only the provided address and network</li>
              <li>• Upload a clear screenshot of your transaction</li>
              <li>• Processing time: 1-24 hours after confirmation</li>
              <li>• Do not send from an exchange wallet</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitDeposit}
            disabled={loading || uploadingScreenshot || !selectedAddress || !amount || !screenshot}
            className="w-full bg-exchange-green hover:bg-exchange-green/90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : uploadingScreenshot ? (
              <Upload className="w-4 h-4 mr-2" />
            ) : (
              <QrCode className="w-4 h-4 mr-2" />
            )}
            {uploadingScreenshot ? 'Uploading...' : 'Submit Deposit Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDepositModal;
