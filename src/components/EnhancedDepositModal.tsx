
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Copy, QrCode, Upload, Check } from 'lucide-react';

interface CryptoAddress {
  id: string;
  currency: string;
  network: string;
  wallet_address: string;
  qr_code_url: string | null;
  is_active: boolean;
}

interface EnhancedDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedDepositModal = ({ isOpen, onClose }: EnhancedDepositModalProps) => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoAddress[]>([]);
  const [currency, setCurrency] = useState('USDT');
  const [network, setNetwork] = useState('TRC20');
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const currencies = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'];
  const networkOptions: { [key: string]: string[] } = {
    USDT: ['ERC20', 'TRC20'],
    BTC: ['Bitcoin'],
    ETH: ['ERC20'],
    BNB: ['BEP20'],
    SOL: ['Solana']
  };

  useEffect(() => {
    if (isOpen) {
      fetchCryptoAddresses();
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset network when currency changes
    const availableNetworks = networkOptions[currency] || [];
    if (availableNetworks.length > 0) {
      setNetwork(availableNetworks[0]);
    }
  }, [currency]);

  const fetchCryptoAddresses = async () => {
    try {
      console.log('Fetching crypto addresses...');
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching crypto addresses:', error);
        toast.error('Failed to load deposit addresses');
        return;
      }

      console.log('Crypto addresses fetched:', data);
      setCryptoAddresses(data || []);
    } catch (error) {
      console.error('Unexpected error fetching crypto addresses:', error);
      toast.error('Failed to load deposit addresses');
    }
  };

  const selectedAddress = cryptoAddresses.find(
    addr => addr.currency === currency && addr.network === network
  );

  const handleFileUpload = async (file: File) => {
    if (!file || !user) return null;

    setUploadingScreenshot(true);
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('Uploading screenshot to:', fileName);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('deposit-screenshots')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('deposit-screenshots')
        .getPublicUrl(fileName);

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

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setScreenshot(file);
    const url = await handleFileUpload(file);
    if (url) {
      setScreenshotUrl(url);
      toast.success('Screenshot uploaded successfully');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAddressCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to make a deposit');
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

    if (!screenshotUrl) {
      toast.error('Please upload a transaction screenshot');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting deposit request:', {
        user_id: user.id,
        currency,
        network,
        amount: parseFloat(amount),
        screenshot_url: screenshotUrl
      });

      const { data, error } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: user.id,
          currency,
          network,
          amount: parseFloat(amount),
          screenshot_url: screenshotUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Deposit request created:', data);
      toast.success('Deposit request submitted successfully! Processing time: 1-24 hours.');
      
      // Reset form
      setAmount('');
      setScreenshot(null);
      setScreenshotUrl('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting deposit:', error);
      toast.error(error.message || 'Failed to submit deposit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedAddress) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              No deposit address available for {currency} on {network}
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            Deposit {currency}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Currency Selection */}
          <div>
            <Label htmlFor="currency" className="text-sm font-medium mb-2 block">
              Select Currency
            </Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                Select Network
              </Label>
              <select
                id="network"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {networkOptions[currency].map((net) => (
                  <option key={net} value={net}>
                    {net}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Deposit Address */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                Deposit Address ({network})
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(selectedAddress.wallet_address)}
                className="flex items-center gap-1"
              >
                {addressCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {addressCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            
            {/* QR Code */}
            {selectedAddress.qr_code_url && (
              <div className="text-center mb-4">
                <img 
                  src={selectedAddress.qr_code_url}
                  alt="QR Code"
                  className="mx-auto w-32 h-32 border border-gray-200 rounded"
                />
              </div>
            )}

            {/* Address */}
            <div className="bg-white rounded border p-3 font-mono text-sm break-all">
              {selectedAddress.wallet_address}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
              Amount (USD)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="10"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum deposit: $10 USD
            </p>
          </div>

          {/* Screenshot Upload */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Transaction Screenshot
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
                id="screenshot-upload"
              />
              <label htmlFor="screenshot-upload" className="cursor-pointer">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload transaction screenshot
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </label>
            </div>
            
            {uploadingScreenshot && (
              <div className="flex items-center justify-center mt-2">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            )}
            
            {screenshotUrl && (
              <div className="mt-2">
                <p className="text-sm text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-1" />
                  Screenshot uploaded successfully
                </p>
              </div>
            )}
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Important Instructions:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Send only {currency} to this address on {network} network</li>
              <li>• Minimum deposit amount is $10 USD</li>
              <li>• Upload a clear screenshot of your transaction</li>
              <li>• Processing time: 1-24 hours after confirmation</li>
              <li>• Contact support if you have any issues</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !amount || !screenshotUrl || parseFloat(amount) < 10}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <QrCode className="w-4 h-4 mr-2" />
            )}
            Submit Deposit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDepositModal;
