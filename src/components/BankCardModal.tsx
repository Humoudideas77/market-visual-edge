
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CreditCard, Plus, Edit } from 'lucide-react';

interface BankCard {
  id: string;
  bank_name: string;
  bank_number: string;
  bank_address: string;
  swift_code: string;
  payee_name: string;
  zip_code: string;
  payee_address: string;
  is_default: boolean;
}

interface BankCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCard?: BankCard | null;
  onSuccess: () => void;
}

const BankCardModal = ({ isOpen, onClose, editCard, onSuccess }: BankCardModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: editCard?.bank_name || '',
    bank_number: editCard?.bank_number || '',
    bank_address: editCard?.bank_address || '',
    swift_code: editCard?.swift_code || '',
    payee_name: editCard?.payee_name || '',
    zip_code: editCard?.zip_code || '',
    payee_address: editCard?.payee_address || '',
    is_default: editCard?.is_default || false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to manage bank cards');
      return;
    }

    // Validate required fields
    const requiredFields = ['bank_name', 'bank_number', 'bank_address', 'swift_code', 'payee_name', 'zip_code', 'payee_address'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`${field.replace('_', ' ')} is required`);
        return;
      }
    }

    setLoading(true);

    try {
      if (editCard) {
        // Update existing card
        const { error } = await supabase
          .from('bank_cards')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editCard.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Bank card updated successfully');
      } else {
        // Create new card
        const { error } = await supabase
          .from('bank_cards')
          .insert({
            ...formData,
            user_id: user.id
          });

        if (error) throw error;
        toast.success('Bank card added successfully');
      }

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        bank_name: '',
        bank_number: '',
        bank_address: '',
        swift_code: '',
        payee_name: '',
        zip_code: '',
        payee_address: '',
        is_default: false,
      });
    } catch (error: any) {
      console.error('Error saving bank card:', error);
      toast.error('Failed to save bank card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {editCard ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {editCard ? 'Edit Bank Card' : 'Add Bank Card'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bank_name" className="text-sm font-medium">
              Bank Name *
            </Label>
            <Input
              id="bank_name"
              type="text"
              placeholder="e.g., Chase Bank"
              value={formData.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              className="exchange-input mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="bank_number" className="text-sm font-medium">
              Account Number *
            </Label>
            <Input
              id="bank_number"
              type="text"
              placeholder="Account number"
              value={formData.bank_number}
              onChange={(e) => handleInputChange('bank_number', e.target.value)}
              className="exchange-input mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="swift_code" className="text-sm font-medium">
              SWIFT Code *
            </Label>
            <Input
              id="swift_code"
              type="text"
              placeholder="e.g., CHASUS33"
              value={formData.swift_code}
              onChange={(e) => handleInputChange('swift_code', e.target.value)}
              className="exchange-input mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="payee_name" className="text-sm font-medium">
              Account Holder Name *
            </Label>
            <Input
              id="payee_name"
              type="text"
              placeholder="Full name as on bank account"
              value={formData.payee_name}
              onChange={(e) => handleInputChange('payee_name', e.target.value)}
              className="exchange-input mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="bank_address" className="text-sm font-medium">
              Bank Address *
            </Label>
            <Input
              id="bank_address"
              type="text"
              placeholder="Bank branch address"
              value={formData.bank_address}
              onChange={(e) => handleInputChange('bank_address', e.target.value)}
              className="exchange-input mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="payee_address" className="text-sm font-medium">
              Account Holder Address *
            </Label>
            <Input
              id="payee_address"
              type="text"
              placeholder="Your address"
              value={formData.payee_address}
              onChange={(e) => handleInputChange('payee_address', e.target.value)}
              className="exchange-input mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="zip_code" className="text-sm font-medium">
              ZIP Code *
            </Label>
            <Input
              id="zip_code"
              type="text"
              placeholder="ZIP/Postal code"
              value={formData.zip_code}
              onChange={(e) => handleInputChange('zip_code', e.target.value)}
              className="exchange-input mt-1"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => handleInputChange('is_default', e.target.checked)}
              className="rounded border-exchange-border"
            />
            <Label htmlFor="is_default" className="text-sm">
              Set as default bank card
            </Label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-exchange-blue hover:bg-exchange-blue/90"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              {editCard ? 'Update Card' : 'Add Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BankCardModal;
