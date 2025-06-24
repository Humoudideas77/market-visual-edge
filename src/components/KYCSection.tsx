
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserActivities } from '@/hooks/useUserActivities';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import KYCUploadForm from './KYCUploadForm';

const KYCSection = () => {
  const { user } = useAuth();
  const { logActivity } = useUserActivities();
  const [showUploadForm, setShowUploadForm] = useState(false);

  const { data: kycSubmission, isLoading } = useQuery({
    queryKey: ['kyc-submission', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching KYC submission:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });

  const handleStartKYC = () => {
    setShowUploadForm(true);
    logActivity('kyc_process_started');
  };

  const handleKYCSubmitted = () => {
    setShowUploadForm(false);
    logActivity('kyc_documents_submitted');
    toast.success('KYC documents submitted successfully. We will review them within 24-48 hours.');
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
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showUploadForm) {
    return <KYCUploadForm onSubmitted={handleKYCSubmitted} onCancel={() => setShowUploadForm(false)} />;
  }

  if (!kycSubmission) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            Identity Verification (KYC)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Complete your identity verification to unlock all platform features and increase your withdrawal limits.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Required Documents:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Government-issued ID (passport or driver's license)</li>
                <li>• Proof of address (utility bill or bank statement)</li>
                <li>• Selfie with your ID document</li>
              </ul>
            </div>
            <Button 
              onClick={handleStartKYC}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Start Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(kycSubmission.status)}
            <span className="ml-2">Identity Verification</span>
          </div>
          {getStatusBadge(kycSubmission.status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {kycSubmission.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Your documents are under review. We'll notify you once the verification is complete.
              </p>
            </div>
          )}
          
          {kycSubmission.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">
                ✅ Your identity has been verified successfully!
              </p>
              <p className="text-green-700 text-sm mt-1">
                You now have access to all platform features and higher withdrawal limits.
              </p>
            </div>
          )}
          
          {kycSubmission.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">
                Your verification was not approved.
              </p>
              {kycSubmission.admin_notes && (
                <p className="text-red-700 text-sm mt-2">
                  <strong>Reason:</strong> {kycSubmission.admin_notes}
                </p>
              )}
              <Button 
                onClick={handleStartKYC}
                className="bg-red-600 hover:bg-red-700 text-white mt-3"
                size="sm"
              >
                Submit New Documents
              </Button>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <p><strong>Submitted:</strong> {new Date(kycSubmission.created_at).toLocaleDateString()}</p>
            {kycSubmission.reviewed_at && (
              <p><strong>Reviewed:</strong> {new Date(kycSubmission.reviewed_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCSection;
