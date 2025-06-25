
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
      console.log('Checking KYC status for user:', user?.id);
      
      // First check the user's profile for the latest KYC status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      console.log('Profile KYC status:', profileData?.kyc_status);

      // Check for any KYC submissions
      const { data: submissionData, error: submissionError } = await supabase
        .from('kyc_submissions')
        .select('id, status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (submissionError && submissionError.code !== 'PGRST116') {
        console.error('Submission error:', submissionError);
        throw submissionError;
      }

      console.log('Latest KYC submission:', submissionData);

      // Use the profile status as the primary source, but fall back to submission status
      const currentStatus = profileData?.kyc_status || submissionData?.status || 'pending';
      
      setKycStatus(currentStatus);
      setHasSubmission(!!submissionData);
      
      console.log('Final KYC status set to:', currentStatus);
    } catch (error) {
      console.error('Error checking KYC status:', error);
      toast.error('Failed to check KYC status');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription to profile changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload);
          if (payload.new?.kyc_status) {
            setKycStatus(payload.new.kyc_status);
            if (payload.new.kyc_status === 'verified') {
              toast.success('Your KYC has been approved! You are now verified.');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'resubmission_required':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Your KYC verification has been approved! You are verified.';
      case 'rejected':
        return 'Your KYC submission was rejected. Please submit new documents.';
      case 'resubmission_required':
        return 'Please resubmit your KYC documents with the requested changes.';
      case 'pending':
        return hasSubmission ? 'Your KYC documents are under review' : 'Complete your identity verification';
      default:
        return 'Complete your identity verification';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'resubmission_required':
        return 'Resubmission Required';
      case 'pending':
        return 'Pending';
      default:
        return 'Not Started';
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
                  {kycStatus === 'verified' 
                    ? 'Enhanced trading limits unlocked'
                    : 'Verify your identity to unlock higher withdrawal limits'
                  }
                </p>
              </div>
            </div>
            
            <div className={`px-3 py-1 text-sm rounded-full font-medium ${
              kycStatus === 'verified' 
                ? 'bg-green-500/20 text-green-400' 
                : kycStatus === 'rejected'
                ? 'bg-red-500/20 text-red-400'
                : kycStatus === 'resubmission_required'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {getStatusLabel(kycStatus)}
            </div>
          </div>
        </CardContent>
      </Card>

      {((kycStatus === 'pending' && !hasSubmission) || kycStatus === 'rejected' || kycStatus === 'resubmission_required') ? (
        <KYCUploadForm />
      ) : null}
    </div>
  );
};

export default KYCSection;
