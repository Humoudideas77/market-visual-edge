import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from './BackButton';

interface KYCUploadFormProps {
  onSubmissionComplete?: () => void;
}

const KYCUploadForm = ({ onSubmissionComplete }: KYCUploadFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [kycData, setKycData] = useState({
    full_name: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    personal_id_number: '',
    id_card_front: null as File | null,
    id_card_back: null as File | null,
    passport: null as File | null,
    utility_bill: null as File | null,
    selfie_with_id: null as File | null
  });

  const handleFileUpload = (field: keyof typeof kycData, file: File | null) => {
    setKycData(prev => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(path, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const logUserActivity = async (activityType: string, details: any = null) => {
    if (!user) return;
    
    try {
      await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_details: details,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  };

  const submitKYC = async () => {
    if (!user || !kycData.full_name.trim() || !kycData.date_of_birth || !kycData.nationality.trim() || !kycData.address.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let idCardUrl = null;
      let passportUrl = null;
      let utilityBillUrl = null;
      let selfieWithIdUrl = null;

      // Upload documents
      if (kycData.id_card_front) {
        const frontPath = `${user.id}/id_card_${Date.now()}_${kycData.id_card_front.name}`;
        idCardUrl = await uploadFile(kycData.id_card_front, frontPath);
      }

      if (kycData.passport) {
        const passportPath = `${user.id}/passport_${Date.now()}_${kycData.passport.name}`;
        passportUrl = await uploadFile(kycData.passport, passportPath);
      }

      if (kycData.utility_bill) {
        const utilityPath = `${user.id}/utility_${Date.now()}_${kycData.utility_bill.name}`;
        utilityBillUrl = await uploadFile(kycData.utility_bill, utilityPath);
      }

      if (kycData.selfie_with_id) {
        const selfiePath = `${user.id}/selfie_${Date.now()}_${kycData.selfie_with_id.name}`;
        selfieWithIdUrl = await uploadFile(kycData.selfie_with_id, selfiePath);
      }

      // Submit KYC data
      const { error } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          full_name: kycData.full_name,
          date_of_birth: kycData.date_of_birth,
          nationality: kycData.nationality,
          address: kycData.address,
          personal_id_number: kycData.personal_id_number || null,
          id_card_url: idCardUrl,
          passport_url: passportUrl,
          utility_bill_url: utilityBillUrl,
          selfie_with_id_url: selfieWithIdUrl,
          status: 'pending'
        });

      if (error) throw error;

      // Update user's profile to pending status
      await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', user.id);

      // Log KYC submission activity
      await logUserActivity('kyc_document_submitted', {
        full_name: kycData.full_name,
        nationality: kycData.nationality,
        documents_uploaded: {
          id_card: !!idCardUrl,
          passport: !!passportUrl,
          utility_bill: !!utilityBillUrl,
          selfie_with_id: !!selfieWithIdUrl
        }
      });

      toast.success('KYC submission successful! You will be notified once your KYC is approved.');
      
      // Reset form
      setKycData({
        full_name: '',
        date_of_birth: '',
        nationality: '',
        address: '',
        personal_id_number: '',
        id_card_front: null,
        id_card_back: null,
        passport: null,
        utility_bill: null,
        selfie_with_id: null
      });

      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => input.value = '');

      if (onSubmissionComplete) {
        onSubmissionComplete();
      }
      
    } catch (error) {
      console.error('KYC submission error:', error);
      toast.error('Failed to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-exchange-text-primary flex items-center gap-2 text-lg font-bold">
            <FileText className="w-5 h-5" />
            MecCrypto KYC Document Upload
          </CardTitle>
          <BackButton fallbackPath="/dashboard" label="← Back" />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <span className="text-base font-bold text-blue-600">Required for Enhanced Security</span>
          </div>
          <p className="text-base text-gray-700 font-medium leading-relaxed">
            Complete KYC verification to unlock higher withdrawal limits and enhanced trading features on MecCrypto.
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-900 font-bold text-base mb-3 block">Full Name *</Label>
              <Input
                value={kycData.full_name}
                onChange={(e) => setKycData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full legal name"
                className="enhanced-form-input text-base font-medium h-12"
                required
              />
            </div>
            <div>
              <Label className="text-gray-900 font-bold text-base mb-3 block">Date of Birth *</Label>
              <Input
                type="date"
                value={kycData.date_of_birth}
                onChange={(e) => setKycData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                className="enhanced-form-input text-base font-medium h-12"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-900 font-bold text-base mb-3 block">Nationality *</Label>
              <Input
                value={kycData.nationality}
                onChange={(e) => setKycData(prev => ({ ...prev, nationality: e.target.value }))}
                placeholder="Enter your nationality or citizenship"
                className="enhanced-form-input text-base font-medium h-12"
                required
              />
            </div>
            <div>
              <Label className="text-gray-900 font-bold text-base mb-3 block">Personal ID Number</Label>
              <Input
                value={kycData.personal_id_number}
                onChange={(e) => setKycData(prev => ({ ...prev, personal_id_number: e.target.value }))}
                placeholder="National ID, passport, or driver's license"
                className="enhanced-form-input text-base font-medium h-12"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-900 font-bold text-base mb-3 block">Full Address *</Label>
            <Input
              value={kycData.address}
              onChange={(e) => setKycData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Street address, city, state/province, country"
              className="enhanced-form-input text-base font-medium h-12"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-900 font-bold text-base mb-3 block">ID Card (Front)</Label>
              <div className="mt-2 border-2 border-dashed border-exchange-border rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-exchange-text-secondary mx-auto mb-2" />
                <p className="text-sm text-exchange-text-secondary mb-2">
                  Upload front side of ID Card
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('id_card_front', e.target.files?.[0] || null)}
                  className="w-full text-sm text-exchange-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-exchange-blue file:text-white hover:file:bg-exchange-blue/90"
                />
                {kycData.id_card_front && (
                  <p className="text-xs text-green-400 mt-2">
                    ✓ {kycData.id_card_front.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-900 font-bold text-base mb-3 block">Passport</Label>
              <div className="mt-2 border-2 border-dashed border-exchange-border rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-exchange-text-secondary mx-auto mb-2" />
                <p className="text-sm text-exchange-text-secondary mb-2">
                  Upload passport document
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('passport', e.target.files?.[0] || null)}
                  className="w-full text-sm text-exchange-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-exchange-blue file:text-white hover:file:bg-exchange-blue/90"
                />
                {kycData.passport && (
                  <p className="text-xs text-green-400 mt-2">
                    ✓ {kycData.passport.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-900 font-bold text-base mb-3 block">Utility Bill</Label>
              <div className="mt-2 border-2 border-dashed border-exchange-border rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-exchange-text-secondary mx-auto mb-2" />
                <p className="text-sm text-exchange-text-secondary mb-2">
                  Upload recent utility bill
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('utility_bill', e.target.files?.[0] || null)}
                  className="w-full text-sm text-exchange-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-exchange-blue file:text-white hover:file:bg-exchange-blue/90"
                />
                {kycData.utility_bill && (
                  <p className="text-xs text-green-400 mt-2">
                    ✓ {kycData.utility_bill.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-900 font-bold text-base mb-3 block">Selfie with ID</Label>
              <div className="mt-2 border-2 border-dashed border-exchange-border rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-exchange-text-secondary mx-auto mb-2" />
                <p className="text-sm text-exchange-text-secondary mb-2">
                  Upload selfie holding your ID
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('selfie_with_id', e.target.files?.[0] || null)}
                  className="w-full text-sm text-exchange-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-exchange-blue file:text-white hover:file:bg-exchange-blue/90"
                />
                {kycData.selfie_with_id && (
                  <p className="text-xs text-green-400 mt-2">
                    ✓ {kycData.selfie_with_id.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={submitKYC}
              disabled={loading || !kycData.full_name.trim() || !kycData.date_of_birth || !kycData.nationality.trim() || !kycData.address.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 text-base"
            >
              {loading ? 'Submitting Documents...' : 'Submit KYC Documents'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCUploadForm;
