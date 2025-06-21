
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';

const KYCSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [kycData, setKycData] = useState({
    full_name: '',
    date_of_birth: '',
    nationality: '',
    address: ''
  });

  const handleSubmitKYC = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          full_name: kycData.full_name,
          date_of_birth: kycData.date_of_birth,
          nationality: kycData.nationality,
          address: kycData.address,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('KYC submission successful! We will review your information within 24-48 hours.');
      setKycData({ full_name: '', date_of_birth: '', nationality: '', address: '' });
    } catch (error) {
      toast.error('Failed to submit KYC information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
          KYC Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              {getStatusIcon('pending')}
              <span className="ml-2 text-sm font-medium text-gray-900">
                Complete your identity verification
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Verify your identity to unlock higher withdrawal limits and enhanced security features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-700">Full Name</Label>
              <Input
                value={kycData.full_name}
                onChange={(e) => setKycData(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-1"
                placeholder="Enter your full legal name"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-700">Date of Birth</Label>
              <Input
                type="date"
                value={kycData.date_of_birth}
                onChange={(e) => setKycData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-700">Nationality</Label>
              <Input
                value={kycData.nationality}
                onChange={(e) => setKycData(prev => ({ ...prev, nationality: e.target.value }))}
                className="mt-1"
                placeholder="Your nationality"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-700">Address</Label>
              <Textarea
                value={kycData.address}
                onChange={(e) => setKycData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1 resize-none"
                placeholder="Your complete address"
                rows={3}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Document Upload</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Upload ID Document</p>
                <p className="text-xs text-gray-500">Passport, Driver's License, or National ID</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Upload Proof of Address</p>
                <p className="text-xs text-gray-500">Utility bill or bank statement</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmitKYC}
            disabled={loading || !kycData.full_name || !kycData.date_of_birth}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Submitting...' : 'Submit KYC Information'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCSection;
