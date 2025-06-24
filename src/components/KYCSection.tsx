
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import KYCUploadForm from './KYCUploadForm';

const KYCSection = () => {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<string>('pending');
  const [hasSubmission, setHasSubmission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkKYCStatus();
    }
  }, [user]);

  const checkKYCStatus = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      const { data: submissionData, error: submissionError } = await supabase
        .from('kyc_submissions')
        .select('id, status')
        .eq('user_id', user?.id)
        .single();

      if (submissionError && submissionError.code !== 'PGRST116') {
        throw submissionError;
      }

      setKycStatus(submissionData?.status || profileData?.kyc_status || 'pending');
      setHasSubmission(!!submissionData);
    } catch (error) {
      console.error('Error checking KYC status:', error);
      toast.error('Failed to check KYC status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Your KYC verification has been approved!';
      case 'rejected':
        return 'Your KYC submission was rejected. Please submit new documents.';
      case 'pending':
        return hasSubmission ? 'Your KYC documents are under review' : 'Complete your identity verification';
      default:
        return 'Complete your identity verification';
    }
  };

  if (loading) {
    return (
      <Card className="bg-exchange-card-bg border-exchange-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-exchange-border rounded w-3/4"></div>
            <div className="h-4 bg-exchange-border rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-exchange-card-bg border-exchange-border">
        <CardHeader>
          <CardTitle className="text-exchange-text-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-exchange-blue" />
            KYC Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-exchange-bg rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(kycStatus)}
              <div>
                <p className="font-medium text-exchange-text-primary">
                  {getStatusMessage(kycStatus)}
                </p>
                <p className="text-sm text-exchange-text-secondary">
                  {kycStatus === 'approved' 
                    ? 'Enhanced trading limits unlocked'
                    : 'Verify your identity to unlock higher withdrawal limits'
                  }
                </p>
              </div>
            </div>
            
            {kycStatus === 'approved' && (
              <div className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                Verified
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(kycStatus === 'pending' && !hasSubmission) || kycStatus === 'rejected' ? (
        <KYCUploadForm />
      ) : null}
    </div>
  );
};

export default KYCSection;
