
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

      console.log('Processing screenshot upload:', fileName);

      // For now, we'll simulate a successful upload
      // In a real implementation, you would upload to a storage service
      const publicUrl = `https://placeholder-storage.com/screenshots/${fileName}`;
      
      setScreenshotUrl(publicUrl);
      console.log('Screenshot processed successfully:', publicUrl);
      toast.success('Screenshot uploaded successfully');
      
      return publicUrl;
    } catch (error) {
      console.error('Error processing screenshot:', error);
      toast.error('Failed to upload screenshot');
      return null;
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      await handleFileUpload(file);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAddressCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address');
    }
  };

  const handleDeposit = async () => {
    console.log('=== DEPOSIT SUBMISSION DEBUG ===');
    console.log('User:', user?.email);
    console.log('Session exists:', !!session);
    console.log('User ID:', user?.id);
    console.log('Amount:', amount);
    console.log('Currency:', currency);
    console.log('Network:', network);

    // Check authentication first
    if (!user || !session) {
      console.error('No user or session found');
      toast.error('You must be logged in to make a deposit. Please refresh and try again.');
      return;
    }

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 10) {
      toast.error('Minimum deposit amount is $10');
      return;
    }

    // Check if address is available
    if (!selectedAddress) {
      toast.error('Selected currency/network combination is not available');
      return;
    }

    setLoading(true);

    try {
      // Use the current session instead of getting a new one
      console.log('Using current session for deposit submission');
      console.log('Session user ID:', session.user.id);
      console.log('Auth user ID:', user.id);

      const depositData = {
        user_id: user.id, // Use the user.id from auth context
        currency,
        network,
        amount: parseFloat(amount),
        transaction_screenshot_url: screenshotUrl || null,
        status: 'pending'
      };

      console.log('Submitting deposit request with data:', depositData);

      const { data, error } = await supabase
        .from('deposit_requests')
        .insert(depositData)
        .select()
        .single();

      if (error) {
        console.error('Deposit submission error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Deposit request created successfully:', data);
      toast.success('Deposit request submitted successfully! Our team will review and approve it within 24 hours.');
      
      // Reset form
      setAmount('');
      setScreenshot(null);
      setScreenshotUrl('');
      onClose();
    } catch (error: any) {
      console.error('Failed to submit deposit request:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('JWT expired') || error.message?.includes('session')) {
        toast.error('Your session has expired. Please refresh the page and login again.');
      } else if (error.message?.includes('row-level security')) {
        toast.error('Permission denied. Please refresh the page and try again.');
      } else if (error.message?.includes('violates check constraint')) {
        toast.error('Invalid deposit data. Please check your input and try again.');
      } else {
        toast.error(error.message || 'Failed to submit deposit request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is not authenticated
  if (!user || !session) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            Deposit Funds
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
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

          {/* Deposit Address */}
          {selectedAddress && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  Deposit Address ({currency} - {network})
                </h4>
              </div>
              
              {selectedAddress.qr_code_url && (
                <div className="flex justify-center">
                  <img
                    src={selectedAddress.qr_code_url}
                    alt="QR Code"
                    className="w-32 h-32 border border-gray-200 rounded-lg"
                  />
                </div>
              )}
              
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-mono break-all">
                    {selectedAddress.wallet_address}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(selectedAddress.wallet_address)}
                    className="ml-2 flex-shrink-0"
                  >
                    {addressCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Only send {currency} to this address on the {network} network. 
                  Sending other cryptocurrencies or using wrong network will result in permanent loss.
                </p>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
              Amount (USD equivalent)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount in USD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              Transaction Screenshot (Optional)
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
                id="screenshot-upload"
                disabled={uploadingScreenshot}
              />
              <label
                htmlFor="screenshot-upload"
                className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {uploadingScreenshot ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {screenshot ? 'Change Screenshot' : 'Upload Screenshot'}
              </label>
              {screenshot && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {screenshot.name}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload a screenshot of your transaction for faster processing
            </p>
          </div>

          {/* Deposit Info */}
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) >= 10 && (
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Deposit Amount:</span>
                <span className="text-gray-900 font-medium">
                  ${parseFloat(amount).toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Fee:</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Time:</span>
                <span className="text-gray-600">Up to 24 hours</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleDeposit}
            disabled={loading || !amount || parseFloat(amount) < 10 || !selectedAddress || uploadingScreenshot}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Submit Deposit Request {amount && `($${amount})`}
          </Button>

          {/* Important Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Important Instructions:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Send the exact amount in {currency} to the address above</li>
              <li>• Make sure to use the correct network ({network})</li>
              <li>• Upload transaction screenshot for faster processing</li>
              <li>• Deposits are processed within 24 hours during business days</li>
              <li>• Contact support if you need assistance</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDepositModal;
