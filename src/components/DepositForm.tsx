
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, DollarSign } from 'lucide-react';

const DepositForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USDT',
    network: 'TRC20',
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const currencies = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'];
  const networks = ['TRC20', 'ERC20', 'BEP20', 'Solana', 'Bitcoin'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('deposit-screenshots')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('deposit-screenshots')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!screenshot) {
      toast.error('Please upload a transaction screenshot');
      return;
    }

    setLoading(true);

    try {
      // Upload screenshot
      const screenshotUrl = await uploadScreenshot(screenshot);
      if (!screenshotUrl) {
        throw new Error('Failed to upload screenshot');
      }

      // Create deposit request
      const { error } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: user.id,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          network: formData.network,
          transaction_screenshot_url: screenshotUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Deposit request submitted successfully!');
      
      // Reset form
      setFormData({ amount: '', currency: 'USDT', network: 'TRC20' });
      setScreenshot(null);
      
      // Reset file input
      const fileInput = document.getElementById('screenshot') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

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
          <DollarSign className="w-5 h-5 text-green-500" />
          Deposit Funds
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-exchange-text-secondary">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
              required
            />
          </div>

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
            <Label htmlFor="screenshot" className="text-exchange-text-secondary">
              Transaction Screenshot
            </Label>
            <div className="mt-2">
              <input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('screenshot')?.click()}
                className="w-full border-exchange-border text-exchange-text-secondary hover:bg-exchange-bg"
              >
                <Upload className="w-4 h-4 mr-2" />
                {screenshot ? screenshot.name : 'Upload Screenshot'}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Submitting...' : 'Submit Deposit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DepositForm;
