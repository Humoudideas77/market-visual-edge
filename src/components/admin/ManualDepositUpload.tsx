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
import { Upload, Loader2, Plus, Trash2, Edit, Eye, Image } from 'lucide-react';
import { useCryptoAddresses } from '@/hooks/useCryptoAddresses';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ManualDepositForm {
  currency: string;
  network: string;
  walletAddress: string;
  qrCodeFile: FileList;
  notes?: string;
}

interface EditAddressForm {
  currency: string;
  network: string;
  walletAddress: string;
  qrCodeFile?: FileList;
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
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ManualDepositForm>();
  const { register: editRegister, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue, formState: { errors: editErrors } } = useForm<EditAddressForm>();
  const { addresses, loading, refetch } = useCryptoAddresses();

  const selectedCurrency = watch('currency');

  const onSubmit = async (data: ManualDepositForm) => {
    try {
      setIsSubmitting(true);

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

      if (data.qrCodeFile && data.qrCodeFile.length > 0) {
        const file = data.qrCodeFile[0];
        
        if (!file.type.startsWith('image/')) {
          toast.error('Please upload a valid image file for the QR code');
          return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${data.currency}_${Date.now()}.${fileExt}`;

        console.log('Uploading QR code file:', fileName);

        const { error: uploadError } = await supabase.storage
          .from('qr-codes')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload QR code: ${uploadError.message}`);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('qr-codes')
          .getPublicUrl(fileName);

        qrCodeUrl = publicUrl;
        console.log('QR code uploaded successfully:', qrCodeUrl);
      }

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
        toast.error(`Failed to add deposit address: ${insertError.message}`);
        return;
      }

      toast.success(`${data.currency} deposit address added successfully`);
      reset();
      refetch();
    } catch (error) {
      console.error('Error adding deposit address:', error);
      toast.error('An error occurred while adding the deposit address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (address: any) => {
    setEditingAddress(address);
    setEditValue('currency', address.currency);
    setEditValue('network', address.network);
    setEditValue('walletAddress', address.wallet_address);
  };

  const onEditSubmit = async (data: EditAddressForm) => {
    if (!editingAddress) return;

    try {
      setIsSubmitting(true);

      let qrCodeUrl = editingAddress.qr_code_url;

      if (data.qrCodeFile && data.qrCodeFile.length > 0) {
        const file = data.qrCodeFile[0];
        
        if (!file.type.startsWith('image/')) {
          toast.error('Please upload a valid image file for the QR code');
          return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${data.currency}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('qr-codes')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload QR code: ${uploadError.message}`);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('qr-codes')
          .getPublicUrl(fileName);

        qrCodeUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('crypto_addresses')
        .update({
          currency: data.currency,
          network: data.network,
          wallet_address: data.walletAddress,
          qr_code_url: qrCodeUrl,
        })
        .eq('id', editingAddress.id);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error(`Failed to update deposit address: ${updateError.message}`);
        return;
      }

      toast.success('Deposit address updated successfully');
      setEditingAddress(null);
      resetEdit();
      refetch();
    } catch (error) {
      console.error('Error updating deposit address:', error);
      toast.error('An error occurred while updating the deposit address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (addressId: string, currency: string) => {
    try {
      const { error } = await supabase
        .from('crypto_addresses')
        .delete()
        .eq('id', addressId);

      if (error) {
        console.error('Delete error:', error);
        toast.error(`Failed to delete deposit address: ${error.message}`);
        return;
      }

      toast.success(`${currency} deposit address deleted successfully`);
      refetch();
    } catch (error) {
      console.error('Error deleting deposit address:', error);
      toast.error('An error occurred while deleting the deposit address');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Plus className="w-5 h-5" />
            Manual Deposit Address Upload
          </CardTitle>
          <CardDescription className="text-gray-400">
            Add new cryptocurrency deposit addresses with QR codes for user deposits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-white">Currency *</Label>
                <Select onValueChange={(value) => setValue('currency', value)} required>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency} className="text-white hover:bg-gray-600">
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
                <Select onValueChange={(value) => setValue('network', value)} required>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {NETWORKS.map((network) => (
                      <SelectItem key={network} value={network} className="text-white hover:bg-gray-600">
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
                className="font-mono text-sm bg-gray-700 border-gray-600 text-white"
                required
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
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 bg-gray-700 border-gray-600 text-white"
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
                className="bg-gray-700 border-gray-600 text-white"
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

      {/* Existing Addresses Section */}
      <Card className="w-full bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Eye className="w-5 h-5" />
            Existing Deposit Addresses
          </CardTitle>
          <CardDescription className="text-gray-400">
            View, edit, and manage existing cryptocurrency deposit addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-300">Loading addresses...</span>
            </div>
          ) : addresses.length > 0 ? (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className="p-4 border border-gray-600 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white text-lg">{address.currency}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-300">{address.network}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-400">Wallet Address:</p>
                        <p className="font-mono text-sm text-white bg-gray-800 p-2 rounded break-all">
                          {address.wallet_address}
                        </p>
                      </div>
                      {address.qr_code_url && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowQRCode(address.qr_code_url)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                          >
                            <Image className="w-4 h-4 mr-2" />
                            View QR Code
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(address.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(address)}
                            className="border-blue-500 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-800 border-gray-600">
                          <DialogHeader>
                            <DialogTitle className="text-white">Edit Deposit Address</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Update the deposit address information
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-white">Currency</Label>
                                <Select onValueChange={(value) => setEditValue('currency', value)} defaultValue={editingAddress?.currency}>
                                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-700 border-gray-600">
                                    {SUPPORTED_CURRENCIES.map((currency) => (
                                      <SelectItem key={currency} value={currency} className="text-white hover:bg-gray-600">
                                        {currency}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-white">Network</Label>
                                <Select onValueChange={(value) => setEditValue('network', value)} defaultValue={editingAddress?.network}>
                                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-700 border-gray-600">
                                    {NETWORKS.map((network) => (
                                      <SelectItem key={network} value={network} className="text-white hover:bg-gray-600">
                                        {network}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white">Wallet Address</Label>
                              <Input
                                {...editRegister('walletAddress', { required: true })}
                                className="font-mono text-sm bg-gray-700 border-gray-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white">Update QR Code (Optional)</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                {...editRegister('qrCodeFile')}
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingAddress(null)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-800 border-gray-600">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Deposit Address</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Are you sure you want to delete this {address.currency} deposit address? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(address.id, address.currency)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No deposit addresses found. Add your first address above.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {showQRCode && (
        <Dialog open={!!showQRCode} onOpenChange={() => setShowQRCode(null)}>
          <DialogContent className="bg-gray-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <img
                src={showQRCode}
                alt="QR Code"
                className="max-w-full max-h-96 rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ManualDepositUpload;
