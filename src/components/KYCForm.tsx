
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Check, FileText } from 'lucide-react';

const KYCForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    phone_number: '',
  });
  const [documents, setDocuments] = useState({
    front_document: null as File | null,
    back_document: null as File | null,
    selfie: null as File | null,
  });
  const [documentUrls, setDocumentUrls] = useState({
    front_document_url: '',
    back_document_url: '',
    selfie_url: '',
  });

  const uploadDocument = async (file: File, type: string) => {
    if (!user) return null;

    setUploading(type);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      console.log(`Uploading ${type} document:`, fileName);

      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (error) {
        console.error(`Upload error for ${type}:`, error);
        throw error;
      }

      console.log(`Upload successful for ${type}:`, data);

      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      console.log(`Public URL for ${type}:`, urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}`);
      return null;
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof documents) => {
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

    setDocuments({ ...documents, [type]: file });

    // Upload immediately
    const url = await uploadDocument(file, type);
    if (url) {
      const urlKey = `${type}_url` as keyof typeof documentUrls;
      setDocumentUrls({ ...documentUrls, [urlKey]: url });
      toast.success(`${type.replace('_', ' ')} uploaded successfully`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (!formData.full_name || !formData.date_of_birth || !formData.nationality || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!documentUrls.front_document_url || !documentUrls.selfie_url) {
      toast.error('Please upload at least front document and selfie');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting KYC request:', {
        user_id: user.id,
        ...formData,
        ...documentUrls
      });

      const { data, error } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          nationality: formData.nationality,
          address: formData.address,
          phone_number: formData.phone_number || null,
          front_document_url: documentUrls.front_document_url,
          back_document_url: documentUrls.back_document_url || null,
          selfie_url: documentUrls.selfie_url,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('KYC submission created:', data);
      toast.success('KYC submission successful! Your documents are under review.');
      
      // Reset form
      setFormData({
        full_name: '',
        date_of_birth: '',
        nationality: '',
        address: '',
        phone_number: '',
      });
      setDocuments({
        front_document: null,
        back_document: null,
        selfie: null,
      });
      setDocumentUrls({
        front_document_url: '',
        back_document_url: '',
        selfie_url: '',
      });

    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      toast.error(error.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <CardTitle className="text-exchange-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          KYC Verification
        </CardTitle>
        <p className="text-sm text-exchange-text-secondary">
          Complete your identity verification to unlock all features
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name" className="text-exchange-text-secondary">
                Full Name *
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="date_of_birth" className="text-exchange-text-secondary">
                Date of Birth *
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="nationality" className="text-exchange-text-secondary">
                Nationality *
              </Label>
              <Input
                id="nationality"
                type="text"
                placeholder="Enter your nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone_number" className="text-exchange-text-secondary">
                Phone Number
              </Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-exchange-text-secondary">
              Address *
            </Label>
            <Textarea
              id="address"
              placeholder="Enter your full address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-exchange-bg border-exchange-border text-exchange-text-primary"
              rows={3}
              required
            />
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-exchange-text-primary">
              Document Upload
            </h3>

            {/* Front Document */}
            <div>
              <Label className="text-exchange-text-secondary">
                Front of ID/Passport *
              </Label>
              <div className="mt-2 border-2 border-dashed border-exchange-border rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'front_document')}
                  className="hidden"
                  id="front-document-upload"
                />
                <label htmlFor="front-document-upload" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-exchange-text-secondary">
                      Click to upload front of document
                    </p>
                  </div>
                </label>
                
                {uploading === 'front_document' && (
                  <p className="text-sm text-blue-600 text-center mt-2">Uploading...</p>
                )}
                
                {documentUrls.front_document_url && (
                  <p className="text-sm text-green-600 text-center mt-2 flex items-center justify-center">
                    <Check className="w-4 h-4 mr-1" />
                    Front document uploaded
                  </p>
                )}
              </div>
            </div>

            {/* Back Document */}
            <div>
              <Label className="text-exchange-text-secondary">
                Back of ID (if applicable)
              </Label>
              <div className="mt-2 border-2 border-dashed border-exchange-border rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'back_document')}
                  className="hidden"
                  id="back-document-upload"
                />
                <label htmlFor="back-document-upload" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-exchange-text-secondary">
                      Click to upload back of document
                    </p>
                  </div>
                </label>
                
                {uploading === 'back_document' && (
                  <p className="text-sm text-blue-600 text-center mt-2">Uploading...</p>
                )}
                
                {documentUrls.back_document_url && (
                  <p className="text-sm text-green-600 text-center mt-2 flex items-center justify-center">
                    <Check className="w-4 h-4 mr-1" />
                    Back document uploaded
                  </p>
                )}
              </div>
            </div>

            {/* Selfie */}
            <div>
              <Label className="text-exchange-text-secondary">
                Selfie with ID *
              </Label>
              <div className="mt-2 border-2 border-dashed border-exchange-border rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'selfie')}
                  className="hidden"
                  id="selfie-upload"
                />
                <label htmlFor="selfie-upload" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-exchange-text-secondary">
                      Click to upload selfie with ID
                    </p>
                  </div>
                </label>
                
                {uploading === 'selfie' && (
                  <p className="text-sm text-blue-600 text-center mt-2">Uploading...</p>
                )}
                
                {documentUrls.selfie_url && (
                  <p className="text-sm text-green-600 text-center mt-2 flex items-center justify-center">
                    <Check className="w-4 h-4 mr-1" />
                    Selfie uploaded
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Important Notes:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Ensure all documents are clear and readable</li>
              <li>• Documents must be valid and not expired</li>
              <li>• Selfie should clearly show your face and the document</li>
              <li>• Processing time: 1-3 business days</li>
              <li>• All information must match your government-issued ID</li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={loading || uploading !== null || !documentUrls.front_document_url || !documentUrls.selfie_url}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Submitting...' : 'Submit KYC Verification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default KYCForm;
