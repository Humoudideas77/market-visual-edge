
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Calendar, MapPin, User, Globe } from 'lucide-react';

interface KYCUploadFormProps {
  onSubmissionComplete?: () => void;
}

const KYCUploadForm: React.FC<KYCUploadFormProps> = ({ onSubmissionComplete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    nationality: '',
    dateOfBirth: '',
  });
  const [files, setFiles] = useState({
    idCard: null as File | null,
    passport: null as File | null,
    utilityBill: null as File | null,
    selfieWithId: null as File | null,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${path}_${Date.now()}.${fileExt}`;

      console.log(`Uploading file: ${fileName}`);

      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('File upload error:', error);
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      console.log(`File uploaded successfully: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to submit KYC documents');
      return;
    }

    if (!formData.fullName || !formData.address || !formData.nationality || !formData.dateOfBirth) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting KYC submission process...');
      
      // Upload files and get URLs
      const uploadPromises = [];
      let idCardUrl = null;
      let passportUrl = null;
      let utilityBillUrl = null;
      let selfieWithIdUrl = null;

      if (files.idCard) {
        uploadPromises.push(
          uploadFile(files.idCard, 'id_card').then(url => { idCardUrl = url; })
        );
      }

      if (files.passport) {
        uploadPromises.push(
          uploadFile(files.passport, 'passport').then(url => { passportUrl = url; })
        );
      }

      if (files.utilityBill) {
        uploadPromises.push(
          uploadFile(files.utilityBill, 'utility_bill').then(url => { utilityBillUrl = url; })
        );
      }

      if (files.selfieWithId) {
        uploadPromises.push(
          uploadFile(files.selfieWithId, 'selfie_with_id').then(url => { selfieWithIdUrl = url; })
        );
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      console.log('All files uploaded, submitting KYC data...');

      // Submit KYC data to database
      const kycData = {
        user_id: user.id,
        full_name: formData.fullName,
        address: formData.address,
        nationality: formData.nationality,
        date_of_birth: formData.dateOfBirth,
        id_card_url: idCardUrl,
        passport_url: passportUrl,
        utility_bill_url: utilityBillUrl,
        selfie_with_id_url: selfieWithIdUrl,
        status: 'pending',
      };

      console.log('Submitting KYC data:', kycData);

      const { data, error } = await supabase
        .from('kyc_submissions')
        .insert(kycData)
        .select()
        .single();

      if (error) {
        console.error('KYC submission error:', error);
        throw error;
      }

      console.log('KYC submission successful:', data);

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'pending',
          kyc_submission_id: data.id 
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't throw error here as the submission was successful
      }

      toast.success('KYC documents submitted successfully! Your submission is now under review.');
      
      // Reset form
      setFormData({
        fullName: '',
        address: '',
        nationality: '',
        dateOfBirth: '',
      });
      setFiles({
        idCard: null,
        passport: null,
        utilityBill: null,
        selfieWithId: null,
      });

      // Call the callback if provided
      if (onSubmissionComplete) {
        onSubmissionComplete();
      }

    } catch (error) {
      console.error('KYC submission failed:', error);
      toast.error('Failed to submit KYC documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({ 
    field, 
    label, 
    required = false 
  }: { 
    field: keyof typeof files; 
    label: string; 
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <Label className="text-exchange-text-secondary flex items-center gap-2">
        <FileText className="w-4 h-4" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
          className="bg-exchange-bg border-exchange-border text-exchange-text-primary file:bg-exchange-accent file:border-0 file:text-white file:rounded file:px-2 file:py-1"
        />
        {files[field] && (
          <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <FileText className="w-4 h-4" />
              File selected: {files[field]?.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <CardTitle className="text-exchange-text-primary flex items-center gap-2">
          <Upload className="w-5 h-5 text-exchange-blue" />
          Submit KYC Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-exchange-text-secondary flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-exchange-text-secondary flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Nationality <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => handleInputChange('nationality', value)} required>
                <SelectTrigger className="bg-exchange-bg border-exchange-border text-exchange-text-primary">
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pakistani">Pakistani</SelectItem>
                  <SelectItem value="Indian">Indian</SelectItem>
                  <SelectItem value="Bangladeshi">Bangladeshi</SelectItem>
                  <SelectItem value="American">American</SelectItem>
                  <SelectItem value="British">British</SelectItem>
                  <SelectItem value="Canadian">Canadian</SelectItem>
                  <SelectItem value="Australian">Australian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-exchange-text-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-exchange-text-secondary flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your full address"
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-exchange-text-primary border-b border-exchange-border pb-2">
              Document Uploads
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUploadField field="idCard" label="ID Card / CNIC" />
              <FileUploadField field="passport" label="Passport" />
              <FileUploadField field="utilityBill" label="Utility Bill" />
              <FileUploadField field="selfieWithId" label="Selfie with ID" />
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-400 mb-2 font-medium">Important Notes:</p>
            <ul className="text-xs text-exchange-text-secondary space-y-1">
              <li>• All documents must be clear and readable</li>
              <li>• Accepted formats: JPG, PNG, PDF</li>
              <li>• Maximum file size: 5MB per file</li>
              <li>• Processing time: 1-3 business days</li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-exchange-accent hover:bg-exchange-accent/80 text-white"
          >
            {loading ? 'Submitting...' : 'Submit KYC Documents'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default KYCUploadForm;
