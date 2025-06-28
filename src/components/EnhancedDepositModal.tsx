
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCryptoAddresses } from '@/hooks/useCryptoAddresses';

interface EnhancedDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedDepositModal = ({ isOpen, onClose }: EnhancedDepositModalProps) => {
  const { user } = useAuth();
  const { addresses, loading: addressesLoading, error: addressesError, refetch } = useCryptoAddresses();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get unique currencies and networks from addresses
  const availableCurrencies = [...new Set(addresses.map(addr => addr.currency))];
  const availableNetworks = addresses
    .filter(addr => !selectedCurrency || addr.currency === selectedCurrency)
    .map(addr => addr.network);
  const uniqueNetworks = [...new Set(availableNetworks)];

  // Get the selected address
  const selectedAddress = addresses.find(
    addr => addr.currency === selectedCurrency && addr.network === selectedNetwork
  );

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setScreenshot(file);
      toast.success('Screenshot uploaded successfully');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to make a deposit');
      return;
    }

    if (!selectedCurrency || !selectedNetwork || !amount || !screenshot) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedAddress) {
      toast.error('Invalid currency/network combination');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload screenshot
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('deposit-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload screenshot');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('deposit-screenshots')
        .getPublicUrl(fileName);

      // Create deposit request
      const { error: insertError } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: user.id,
          currency: selectedCurrency,
          network: selectedNetwork,
          amount: parseFloat(amount),
          transaction_screenshot_url: publicUrl,
          status: 'pending'
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Failed to submit deposit request');
        return;
      }

      toast.success('Deposit request submitted successfully');
      
      // Reset form
      setSelectedCurrency('');
      setSelectedNetwork('');
      setAmount('');
      setScreenshot(null);
      onClose();
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error('Failed to submit deposit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset network when currency changes
  useEffect(() => {
    setSelectedNetwork('');
  }, [selectedCurrency]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-red-500" />
            Make a Deposit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-white font-semibold">
              Select Currency *
            </Label>
            {addressesLoading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading available currencies...
              </div>
            ) : addressesError ? (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                Failed to load currencies
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refetch}
                  className="ml-2"
                >
                  Retry
                </Button>
              </div>
            ) : availableCurrencies.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No deposit addresses available. Please contact support.
              </div>
            ) : (
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a cryptocurrency" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Network Selection */}
          {selectedCurrency && (
            <div className="space-y-2">
              <Label htmlFor="network" className="text-white font-semibold">
                Select Network *
              </Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a network" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueNetworks.map((network) => (
                    <SelectItem key={network} value={network}>
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Deposit Address Display */}
          {selectedAddress && (
            <Card className="border-2 border-red-500/20 bg-gray-900/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Deposit Address
                  <Badge variant="secondary" className="ml-auto">
                    {selectedAddress.currency} - {selectedAddress.network}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Wallet Address</Label>
                  <div className="flex gap-2">
                    <Input
                      value={selectedAddress.wallet_address}
                      readOnly
                      className="font-mono text-sm bg-gray-800 border-gray-600"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyAddress(selectedAddress.wallet_address)}
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                {selectedAddress.qr_code_url && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">QR Code</Label>
                    <div className="flex justify-center">
                      <img
                        src={selectedAddress.qr_code_url}
                        alt="QR Code"
                        className="w-48 h-48 border border-gray-600 rounded-lg bg-white p-2"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Amount Input */}
          {selectedAddress && (
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white font-semibold">
                Deposit Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter ${selectedCurrency} amount`}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          )}

          {/* Screenshot Upload */}
          {selectedAddress && (
            <div className="space-y-2">
              <Label htmlFor="screenshot" className="text-white font-semibold">
                Transaction Screenshot *
              </Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="bg-gray-800 border-gray-600 text-white file:bg-red-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4"
              />
              {screenshot && (
                <div className="text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Screenshot uploaded: {screenshot.name}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedAddress || isSubmitting || !amount || !screenshot}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Submitting Deposit Request...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit Deposit Request
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDepositModal;
