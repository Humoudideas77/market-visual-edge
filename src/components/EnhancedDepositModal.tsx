
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
      console.log('Fetching crypto addresses...');
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('is_active', true)
        .order('currency');

      if (error) {
        console.error('Error fetching crypto addresses:', error);
        throw error;
      }
      
      console.log('Fetched crypto addresses:', data);
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
    if (!user) return null;
    
    setUploadingScreenshot(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('Uploading screenshot to:', fileName);
      
      const { data, error } = await supabase.storage
        .from('deposit-screenshots')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      const { data: urlData } = supabase.storage
        .from('deposit-screenshots')
        .getPublicUrl(data.path);

      console.log('Public URL:', urlData.publicUrl);
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

    if (parseFloat(amount) < 60) {
      toast.error('Minimum deposit amount is $60');
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
      if (!screenshotUrl) {
        throw new Error('Failed to upload screenshot');
      }

      console.log('Creating deposit request with screenshot URL:', screenshotUrl);

      // Create deposit request - Fixed typo here
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

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast.success('Deposit request submitted successfully. We will review and process it within 24 hours.');
      
      // Reset form
      setAmount('');
      setScreenshot(null);
      onClose();
    } catch (error: any) {
      console.error('Error submitting deposit:', error);
      toast.error(error.message || 'Failed to submit deposit request');
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
              className="w-full p-2 border rounded-md bg-white"
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
                className="w-full p-2 border rounded-md bg-white"
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
            <div className="bg-gray-50 rounded-lg p-4 border">
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
                <div className="flex-1 p-2 bg-white rounded border font-mono text-sm break-all">
                  {selectedAddress.wallet_address}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCopyAddress(selectedAddress.wallet_address)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {copiedAddress === selectedAddress.wallet_address ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-600 mt-2">
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
              className="w-full"
              min="60"
              step="0.01"
            />
            <p className="text-xs text-gray-600 mt-1">
              Minimum deposit: $60 USD
            </p>
          </div>

          {/* Screenshot Upload */}
          <div>
            <Label htmlFor="screenshot" className="text-sm font-medium mb-2 block">
              Transaction Screenshot *
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {screenshot ? screenshot.name : 'Click to upload transaction screenshot'}
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG up to 5MB
                </span>
              </label>
            </div>
          </div>

          {/* Deposit Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Important Instructions:
            </h4>
            <ul className="text-xs text-gray-700 space-y-1">
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
            className="w-full bg-green-600 hover:bg-green-700"
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
