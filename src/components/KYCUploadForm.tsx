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

const KYCUploadForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [kycData, setKycData] = useState({
    full_name: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    personal_id_number: '',
    front_document: null as File | null,
    back_document: null as File | null
  });

  const handleFileUpload = (field: 'front_document' | 'back_document', file: File | null) => {
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

  const submitKYC = async () => {
    if (!user || !kycData.full_name.trim() || !kycData.date_of_birth || !kycData.nationality.trim() || !kycData.address.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let frontDocUrl = null;
      let backDocUrl = null;

      // Upload front document if provided
      if (kycData.front_document) {
        const frontPath = `${user.id}/front_${Date.now()}_${kycData.front_document.name}`;
        frontDocUrl = await uploadFile(kycData.front_document, frontPath);
      }

      // Upload back document if provided
      if (kycData.back_document) {
        const backPath = `${user.id}/back_${Date.now()}_${kycData.back_document.name}`;
        backDocUrl = await uploadFile(kycData.back_document, backPath);
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
          front_document_url: frontDocUrl,
          back_document_url: backDocUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('KYC submission successful! MecCrypto will review your documents within 24-48 hours.');
      setKycData({
        full_name: '',
        date_of_birth: '',
        nationality: '',
        address: '',
        personal_id_number: '',
        front_document: null,
        back_document: null
      });

      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => input.value = '');
      
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
          <CardTitle className="text-exchange-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5" />
            MecCrypto KYC Document Upload
          </CardTitle>
          <BackButton fallbackPath="/dashboard" label="← Back" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Required for Enhanced Security</span>
          </div>
          <p className="text-sm text-exchange-text-secondary">
            Complete KYC verification to unlock higher withdrawal limits and enhanced trading features on MecCrypto.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-exchange-text-primary">Full Name *</Label>
              <Input
                value={kycData.full_name}
                onChange={(e) => setKycData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
                className="bg-exchange-bg border-exchange-border"
                required
              />
            </div>
            <div>
              <Label className="text-exchange-text-primary">Date of Birth *</Label>
              <Input
                type="date"
                value={kycData.date_of_birth}
                onChange={(e) => setKycData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                className="bg-exchange-bg border-exchange-border"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-exchange-text-primary">Nationality *</Label>
              <Input
                value={kycData.nationality}
                onChange={(e) => setKycData(prev => ({ ...prev, nationality: e.target.value }))}
                placeholder="Enter your nationality"
                className="bg-exchange-bg border-exchange-border"
                required
              />
            </div>
            <div>
              <Label className="text-exchange-text-primary">Personal ID Number</Label>
              <Input
                value={kycData.personal_id_number}
                onChange={(e) => setKycData(prev => ({ ...prev, personal_id_number: e.target.value }))}
                placeholder="Enter your national ID or passport number"
                className="bg-exchange-bg border-exchange-border"
              />
            </div>
          </div>

          <div>
            <Label className="text-exchange-text-primary">Address *</Label>
            <Input
              value={kycData.address}
              onChange={(e) => setKycData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter your full address"
              className="bg-exchange-bg border-exchange-border"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-exchange-text-primary">Front of Document</Label>
              <div className="mt-2 border-2 border-dashed border-exchange-border rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-exchange-text-secondary mx-auto mb-2" />
                <p className="text-sm text-exchange-text-secondary mb-2">
                  Upload front side of ID/Passport
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('front_document', e.target.files?.[0] || null)}
                  className="w-full text-sm text-exchange-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-exchange-blue file:text-white hover:file:bg-exchange-blue/90"
                />
                {kycData.front_document && (
                  <p className="text-xs text-green-400 mt-2">
                    ✓ {kycData.front_document.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-exchange-text-primary">Back of Document</Label>
              <div className="mt-2 border-2 border-dashed border-exchange-border rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-exchange-text-secondary mx-auto mb-2" />
                <p className="text-sm text-exchange-text-secondary mb-2">
                  Upload back side of ID/Passport
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('back_document', e.target.files?.[0] || null)}
                  className="w-full text-sm text-exchange-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-exchange-blue file:text-white hover:file:bg-exchange-blue/90"
                />
                {kycData.back_document && (
                  <p className="text-xs text-green-400 mt-2">
                    ✓ {kycData.back_document.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={submitKYC}
              disabled={loading || !kycData.full_name.trim() || !kycData.date_of_birth || !kycData.nationality.trim() || !kycData.address.trim()}
              className="bg-exchange-blue hover:bg-exchange-blue/90"
            >
              {loading ? 'Submitting...' : 'Submit KYC Documents'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCUploadForm;
