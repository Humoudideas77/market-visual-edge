
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import KYCUploadForm from './KYCUploadForm';

const KYCSection = () => {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<string>('pending');
  const [hasSubmission, setHasSubmission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkKYCStatus();
      
      // Set up real-time subscription for KYC status changes
      const channel = supabase
        .channel('kyc-status-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kyc_submissions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('KYC status changed, refreshing...');
            checkKYCStatus();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          () => {
            console.log('Profile updated, refreshing KYC status...');
            checkKYCStatus();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const checkKYCStatus = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First check the user's profile for kyc_status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      // Then check for KYC submissions
      const { data: submissionData, error: submissionError } = await supabase
        .from('kyc_submissions')
        .select('id, status, admin_notes')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (submissionError) {
        console.error('KYC submission fetch error:', submissionError);
        throw submissionError;
      }

      console.log('KYC Status Check:', {
        profileStatus: profileData?.kyc_status,
        submissionStatus: submissionData?.status,
        hasSubmission: !!submissionData
      });

      // Use the most recent submission status if available, otherwise use profile status
      const currentStatus = submissionData?.status || profileData?.kyc_status || 'pending';
      
      setKycStatus(currentStatus);
      setHasSubmission(!!submissionData);
      setAdminNotes(submissionData?.admin_notes || null);

    } catch (error) {
      console.error('Error checking KYC status:', error);
      toast.error('Failed to check KYC status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    checkKYCStatus();
    toast.info('Refreshing KYC status...');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
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
      case 'approved':
        return 'Your KYC verification has been approved!';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      case 'resubmission_required':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
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
                {adminNotes && (kycStatus === 'rejected' || kycStatus === 'resubmission_required') && (
                  <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
                    <p className="font-medium text-yellow-400 mb-1">Admin Notes:</p>
                    <p className="text-exchange-text-secondary">{adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`px-3 py-1 text-sm rounded-full ${getStatusColor(kycStatus)}`}>
              {kycStatus === 'approved' && 'Verified'}
              {kycStatus === 'pending' && 'Under Review'}
              {kycStatus === 'rejected' && 'Rejected'}
              {kycStatus === 'resubmission_required' && 'Needs Resubmission'}
            </div>
          </div>
        </CardContent>
      </Card>

      {((kycStatus === 'pending' && !hasSubmission) || kycStatus === 'rejected' || kycStatus === 'resubmission_required') && (
        <KYCUploadForm onSubmissionComplete={checkKYCStatus} />
      )}
    </div>
  );
};

export default KYCSection;
