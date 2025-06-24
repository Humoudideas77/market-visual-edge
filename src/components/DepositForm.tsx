
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Copy, Check, QrCode } from 'lucide-react';

interface CryptoAddress {
  id: string;
  currency: string;
  network: string;
  wallet_address: string;
  qr_code_url: string | null;
  is_active: boolean;
}

const DepositForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoAddress[]>([]);
  const [addressCopied, setAddressCopied] = useState(false);
  const [formData, setFormData] = useState({
    currency: 'USDT',
    network: 'TRC20',
    amount: '',
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const currencies = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'];
  const networks = ['TRC20', 'ERC20', 'BEP20', 'Solana', 'Bitcoin'];

  useEffect(() => {
    if (user) {
      fetchCryptoAddresses();
    }
  }, [user]);

  const fetchCryptoAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setCryptoAddresses(data || []);
    } catch (error) {
      console.error('Error fetching crypto addresses:', error);
      toast.error('Failed to load deposit addresses');
    }
  };

  const selectedAddress = cryptoAddresses.find(
    addr => addr.currency === formData.currency && addr.network === formData.network
  );

  const handleScreenshotUpload = async (file: File) => {
    if (!user) return null;

    setUploadingScreenshot(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('deposit-screenshots')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('deposit-screenshots')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      toast.error('Failed to upload screenshot');
      return null;
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setScreenshot(file);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAddressCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
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

    if (amount < 10) {
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
      const screenshotUrl = await handleScreenshotUpload(screenshot);
      if (!screenshotUrl) {
        throw new Error('Failed to upload screenshot');
      }

      // Create deposit request
      const { error } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: user.id,
          currency: formData.currency,
          network: formData.network,
          amount: amount,
          screenshot_url: screenshotUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Deposit request submitted successfully!');
      
      // Reset form
      setFormData({ currency: 'USDT', network: 'TRC20', amount: '' });
      setScreenshot(null);

    } catch (error) {
      console.error('Deposit submission error:', error);
      toast.error('Failed to submit deposit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <CardTitle className="text-exchange-text-primary flex items-center gap-2">
          <QrCode className="w-5 h-5 text-green-500" />
          Deposit Funds
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
            <Label htmlFor="amount" className="text-exchange-text-secondary">
              Amount (USD)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="10"
              placeholder="Minimum $10"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
              required
            />
          </div>

          {selectedAddress && (
            <div className="bg-exchange-bg p-4 rounded-lg border border-exchange-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-exchange-text-primary">
                  Deposit Address
                </h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(selectedAddress.wallet_address)}
                  className="border-exchange-border text-exchange-text-secondary"
                >
                  {addressCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              {selectedAddress.qr_code_url && (
                <div className="text-center mb-3">
                  <img 
                    src={selectedAddress.qr_code_url}
                    alt="QR Code"
                    className="mx-auto w-24 h-24 border border-exchange-border rounded"
                  />
                </div>
              )}

              <div className="bg-exchange-card-bg p-2 rounded border border-exchange-border">
                <p className="text-xs font-mono text-exchange-text-primary break-all">
                  {selectedAddress.wallet_address}
                </p>
              </div>
            </div>
          )}

          <div>
            <Label className="text-exchange-text-secondary">
              Transaction Screenshot
            </Label>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-exchange-text-secondary
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
                required
              />
              {screenshot && (
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <Check className="w-4 h-4 mr-1" />
                  File selected: {screenshot.name}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || uploadingScreenshot}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading || uploadingScreenshot ? 'Processing...' : 'Submit Deposit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DepositForm;
