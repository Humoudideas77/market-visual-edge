
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2, Plus } from 'lucide-react';

interface ManualDepositForm {
  currency: string;
  network: string;
  walletAddress: string;
  qrCodeFile: FileList;
  notes?: string;
}

const SUPPORTED_CURRENCIES = [
  'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'DOGE', 'AVAX'
];

const NETWORKS = [
  'Bitcoin', 'Ethereum', 'BSC', 'Polygon', 'Solana', 'Ripple', 'Litecoin', 'Bitcoin Cash', 'Cardano', 'Polkadot', 'Chainlink', 'Dogecoin', 'Avalanche'
];

const ManualDepositUpload = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ManualDepositForm>();

  const selectedCurrency = watch('currency');

  const onSubmit = async (data: ManualDepositForm) => {
    try {
      setIsSubmitting(true);

      // Check if address already exists for this currency
      const { data: existingAddress } = await supabase
        .from('crypto_addresses')
        .select('id')
        .eq('currency', data.currency)
        .eq('wallet_address', data.walletAddress)
        .single();

      if (existingAddress) {
        toast.error('This wallet address already exists for the selected currency');
        return;
      }

      let qrCodeUrl = null;

      // Upload QR code if provided
      if (data.qrCodeFile && data.qrCodeFile.length > 0) {
        const file = data.qrCodeFile[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${data.currency}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('qr-codes')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload QR code');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('qr-codes')
          .getPublicUrl(fileName);

        qrCodeUrl = publicUrl;
      }

      // Insert the new crypto address
      const { error: insertError } = await supabase
        .from('crypto_addresses')
        .insert({
          currency: data.currency,
          network: data.network,
          wallet_address: data.walletAddress,
          qr_code_url: qrCodeUrl,
          is_active: true
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Failed to add deposit address');
        return;
      }

      toast.success(`${data.currency} deposit address added successfully`);
      reset();
    } catch (error) {
      console.error('Error adding deposit address:', error);
      toast.error('An error occurred while adding the deposit address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Plus className="w-5 h-5" />
          Manual Deposit Address Upload
        </CardTitle>
        <CardDescription>
          Add new cryptocurrency deposit addresses with QR codes for user deposits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-white">Currency *</Label>
              <Select onValueChange={(value) => setValue('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-red-400 text-sm">Currency is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="network" className="text-white">Network *</Label>
              <Select onValueChange={(value) => setValue('network', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((network) => (
                    <SelectItem key={network} value={network}>
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.network && (
                <p className="text-red-400 text-sm">Network is required</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletAddress" className="text-white">Wallet Address *</Label>
            <Input
              id="walletAddress"
              {...register('walletAddress', { required: 'Wallet address is required' })}
              placeholder="Enter wallet address"
              className="font-mono text-sm"
            />
            {errors.walletAddress && (
              <p className="text-red-400 text-sm">{errors.walletAddress.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="qrCode" className="text-white">QR Code Image</Label>
            <Input
              id="qrCode"
              type="file"
              accept="image/*"
              {...register('qrCodeFile')}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
            <p className="text-gray-400 text-xs">Upload a QR code image for this deposit address (optional)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Add any additional notes about this deposit address"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Deposit Address...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Add Deposit Address
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualDepositUpload;
