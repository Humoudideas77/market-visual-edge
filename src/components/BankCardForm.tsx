
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BankCardFormProps {
  onSuccess: () => void;
}

const BankCardForm: React.FC<BankCardFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    bankAddress: '',
    swiftCode: '',
    routingNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bank_cards')
        .insert({
          user_id: user.id,
          bank_name: formData.bankName,
          account_holder_name: formData.accountHolderName,
          account_number: formData.accountNumber,
          bank_address: formData.bankAddress,
          swift_code: formData.swiftCode,
          routing_number: formData.routingNumber,
        });

      if (error) throw error;

      toast.success('Bank card added successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error adding bank card:', error);
      toast.error('Failed to add bank card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="bankName" className="text-exchange-text-secondary">
          Bank Name
        </Label>
        <Input
          id="bankName"
          placeholder="Enter bank name"
          value={formData.bankName}
          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
          required
        />
      </div>

      <div>
        <Label htmlFor="accountHolderName" className="text-exchange-text-secondary">
          Account Holder Name
        </Label>
        <Input
          id="accountHolderName"
          placeholder="Enter account holder name"
          value={formData.accountHolderName}
          onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
          className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
          required
        />
      </div>

      <div>
        <Label htmlFor="accountNumber" className="text-exchange-text-secondary">
          Account Number
        </Label>
        <Input
          id="accountNumber"
          placeholder="Enter account number"
          value={formData.accountNumber}
          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
          className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
          required
        />
      </div>

      <div>
        <Label htmlFor="swiftCode" className="text-exchange-text-secondary">
          SWIFT Code
        </Label>
        <Input
          id="swiftCode"
          placeholder="Enter SWIFT code"
          value={formData.swiftCode}
          onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
          className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
          required
        />
      </div>

      <div>
        <Label htmlFor="bankAddress" className="text-exchange-text-secondary">
          Bank Address
        </Label>
        <Input
          id="bankAddress"
          placeholder="Enter bank address"
          value={formData.bankAddress}
          onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value })}
          className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
        />
      </div>

      <div>
        <Label htmlFor="routingNumber" className="text-exchange-text-secondary">
          Routing Number
        </Label>
        <Input
          id="routingNumber"
          placeholder="Enter routing number"
          value={formData.routingNumber}
          onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
          className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? 'Adding...' : 'Add Bank Card'}
      </Button>
    </form>
  );
};

export default BankCardForm;
