
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Upload } from 'lucide-react';

const KYCForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    personalIdNumber: '',
  });
  const [files, setFiles] = useState({
    idCard: null as File | null,
    passport: null as File | null,
    utilityBill: null as File | null,
    selfieWithId: null as File | null,
  });

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
    }
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${folder}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
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

    // Validate required fields
    if (!formData.fullName || !formData.dateOfBirth || !formData.nationality || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!files.idCard && !files.passport) {
      toast.error('Please upload either ID card or passport');
      return;
    }

    if (!files.utilityBill) {
      toast.error('Please upload utility bill');
      return;
    }

    if (!files.selfieWithId) {
      toast.error('Please upload selfie with ID');
      return;
    }

    setLoading(true);

    try {
      // Upload files
      const uploadPromises = [];
      let idCardUrl = null, passportUrl = null, utilityBillUrl = null, selfieWithIdUrl = null;

      if (files.idCard) {
        uploadPromises.push(
          uploadFile(files.idCard, 'id-cards').then(url => { idCardUrl = url; })
        );
      }

      if (files.passport) {
        uploadPromises.push(
          uploadFile(files.passport, 'passports').then(url => { passportUrl = url; })
        );
      }

      if (files.utilityBill) {
        uploadPromises.push(
          uploadFile(files.utilityBill, 'utility-bills').then(url => { utilityBillUrl = url; })
        );
      }

      if (files.selfieWithId) {
        uploadPromises.push(
          uploadFile(files.selfieWithId, 'selfies').then(url => { selfieWithIdUrl = url; })
        );
      }

      await Promise.all(uploadPromises);

      // Check if any upload failed
      if (
        (files.idCard && !idCardUrl) ||
        (files.passport && !passportUrl) ||
        (files.utilityBill && !utilityBillUrl) ||
        (files.selfieWithId && !selfieWithIdUrl)
      ) {
        throw new Error('Failed to upload some files');
      }

      // Submit KYC data
      const { error } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth,
          nationality: formData.nationality,
          address: formData.address,
          personal_id_number: formData.personalIdNumber || null,
          id_card_url: idCardUrl,
          passport_url: passportUrl,
          utility_bill_url: utilityBillUrl,
          selfie_with_id_url: selfieWithIdUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('KYC submission completed successfully!');
      
      // Reset form
      setFormData({
        fullName: '',
        dateOfBirth: '',
        nationality: '',
        address: '',
        personalIdNumber: '',
      });
      setFiles({
        idCard: null,
        passport: null,
        utilityBill: null,
        selfieWithId: null,
      });

      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => { input.value = ''; });

    } catch (error) {
      console.error('KYC submission error:', error);
      toast.error('Failed to submit KYC documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadButton = ({ 
    id, 
    label, 
    file, 
    onChange, 
    required = false 
  }: { 
    id: string; 
    label: string; 
    file: File | null; 
    onChange: (file: File | null) => void;
    required?: boolean;
  }) => (
    <div>
      <Label htmlFor={id} className="text-exchange-text-secondary">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="mt-2">
        <input
          id={id}
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(id)?.click()}
          className="w-full border-exchange-border text-exchange-text-secondary hover:bg-exchange-bg"
        >
          <Upload className="w-4 h-4 mr-2" />
          {file ? file.name : `Upload ${label}`}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <CardTitle className="text-exchange-text-primary flex items-center gap-2">
          <Shield className="w-5 h-5 text-yellow-500" />
          KYC Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName" className="text-exchange-text-secondary">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="dateOfBirth" className="text-exchange-text-secondary">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="nationality" className="text-exchange-text-secondary">
                Nationality <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nationality"
                placeholder="Enter your nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="personalIdNumber" className="text-exchange-text-secondary">
                Personal ID Number
              </Label>
              <Input
                id="personalIdNumber"
                placeholder="Enter ID number (optional)"
                value={formData.personalIdNumber}
                onChange={(e) => setFormData({ ...formData, personalIdNumber: e.target.value })}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-exchange-text-secondary">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              placeholder="Enter your full address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-exchange-text-primary font-medium">Document Uploads</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUploadButton
                id="idCard"
                label="ID Card"
                file={files.idCard}
                onChange={(file) => handleFileChange('idCard', file)}
              />

              <FileUploadButton
                id="passport"
                label="Passport"
                file={files.passport}
                onChange={(file) => handleFileChange('passport', file)}
              />

              <FileUploadButton
                id="utilityBill"
                label="Utility Bill"
                file={files.utilityBill}
                onChange={(file) => handleFileChange('utilityBill', file)}
                required
              />

              <FileUploadButton
                id="selfieWithId"
                label="Selfie with ID"
                file={files.selfieWithId}
                onChange={(file) => handleFileChange('selfieWithId', file)}
                required
              />
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              <strong>Note:</strong> Please ensure all documents are clear and readable. 
              Upload either ID Card or Passport (or both). Utility Bill and Selfie with ID are required.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {loading ? 'Submitting...' : 'Submit KYC Documents'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default KYCForm;
