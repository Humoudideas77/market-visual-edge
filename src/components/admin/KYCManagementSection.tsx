import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye, ExternalLink, FileImage } from 'lucide-react';
import { format } from 'date-fns';

type KYCSubmission = {
  id: string;
  user_id: string;
  full_name: string;
  address: string;
  nationality: string;
  date_of_birth: string;
  id_card_url: string | null;
  passport_url: string | null;
  utility_bill_url: string | null;
  selfie_with_id_url: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

const KYCManagementSection = () => {
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: kycSubmissions, isLoading } = useQuery({
    queryKey: ['admin-kyc'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as KYCSubmission[];
    },
  });

  const updateKYCMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('Starting KYC update:', { id, status, notes, adminId: user.id });
      
      // Update KYC submission
      const { error: kycError } = await supabase
        .from('kyc_submissions')
        .update({
          status,
          admin_notes: notes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (kycError) {
        console.error('KYC submission update error:', kycError);
        throw kycError;
      }

      // Get the KYC submission to find the user_id
      const kycSubmission = kycSubmissions?.find(k => k.id === id);
      if (!kycSubmission) {
        throw new Error('KYC submission not found');
      }

      // Update user's kyc_status in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: status,
          kyc_submission_id: id 
        })
        .eq('id', kycSubmission.user_id);
          
      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      console.log('Successfully updated KYC and profile status');

      // Log admin activity
      const { error: activityError } = await supabase
        .from('admin_activities')
        .insert({
          admin_id: user.id,
          action_type: `kyc_${status}`,
          target_table: 'kyc_submissions',
          target_record_id: id,
          action_details: { status, notes, user_id: kycSubmission.user_id },
        });
        
      if (activityError) {
        console.error('Activity log error:', activityError);
        // Don't throw here, just log the error
      }
      
      return { status, notes };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
      
      let message = '';
      switch (data.status) {
        case 'approved':
          message = 'KYC submission approved successfully. User status updated to Verified.';
          break;
        case 'rejected':
          message = 'KYC submission rejected successfully. User has been notified.';
          break;
        case 'resubmission_required':
          message = 'Resubmission requested successfully. User has been notified.';
          break;
        default:
          message = 'KYC submission updated successfully';
      }
      
      toast.success(message);
      setSelectedKYC(null);
      setAdminNotes('');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('KYC update failed:', error);
      toast.error(`Failed to update KYC submission: ${error.message}`);
    },
  });

  const handleApprove = (kyc: KYCSubmission) => {
    console.log('Approving KYC:', kyc.id);
    updateKYCMutation.mutate({
      id: kyc.id,
      status: 'approved',
      notes: adminNotes || 'KYC documents approved by admin',
    });
  };

  const handleReject = (kyc: KYCSubmission) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    console.log('Rejecting KYC:', kyc.id);
    updateKYCMutation.mutate({
      id: kyc.id,
      status: 'rejected',
      notes: adminNotes,
    });
  };

  const handleRequireResubmission = (kyc: KYCSubmission) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide instructions for resubmission');
      return;
    }
    console.log('Requiring resubmission for KYC:', kyc.id);
    updateKYCMutation.mutate({
      id: kyc.id,
      status: 'resubmission_required',
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      resubmission_required: 'outline',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const viewDocument = (url: string | null, title: string) => {
    if (!url) {
      toast.error(`No ${title} provided`);
      return;
    }
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="bg-exchange-card-bg border-exchange-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-exchange-border rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingKYC = kycSubmissions?.filter(k => k.status === 'pending') || [];

  return (
    <Card className="bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <CardTitle className="text-exchange-text-primary">
          KYC Management
          {pendingKYC.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingKYC.length} Pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kycSubmissions?.map((kyc) => (
                <TableRow key={kyc.id}>
                  <TableCell className="text-exchange-text-secondary">
                    {format(new Date(kyc.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-exchange-text-secondary">
                    {kyc.user_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium text-exchange-text-primary">
                    {kyc.full_name}
                  </TableCell>
                  <TableCell className="text-exchange-text-secondary">
                    {kyc.nationality}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(kyc.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDocument(kyc.id_card_url, 'ID Card')}
                        disabled={!kyc.id_card_url}
                        title="ID Card"
                      >
                        <FileImage className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDocument(kyc.passport_url, 'Passport')}
                        disabled={!kyc.passport_url}
                        title="Passport"
                      >
                        <FileImage className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDocument(kyc.utility_bill_url, 'Utility Bill')}
                        disabled={!kyc.utility_bill_url}
                        title="Utility Bill"
                      >
                        <FileImage className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDocument(kyc.selfie_with_id_url, 'Selfie with ID')}
                        disabled={!kyc.selfie_with_id_url}
                        title="Selfie with ID"
                      >
                        <FileImage className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {kyc.status === 'pending' ? (
                      <Dialog open={isDialogOpen && selectedKYC?.id === kyc.id} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                          setSelectedKYC(null);
                          setAdminNotes('');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setAdminNotes(kyc.admin_notes || '');
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-exchange-card-bg border-exchange-border max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-exchange-text-primary">
                              Review KYC Submission
                            </DialogTitle>
                          </DialogHeader>
                          {selectedKYC && selectedKYC.id === kyc.id && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-exchange-text-secondary">Full Name:</span>
                                  <span className="ml-2 font-semibold text-exchange-text-primary">
                                    {selectedKYC.full_name}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-exchange-text-secondary">Nationality:</span>
                                  <span className="ml-2 text-exchange-text-primary">{selectedKYC.nationality}</span>
                                </div>
                                <div>
                                  <span className="text-exchange-text-secondary">Date of Birth:</span>
                                  <span className="ml-2 text-exchange-text-primary">
                                    {format(new Date(selectedKYC.date_of_birth), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-exchange-text-secondary">Address:</span>
                                  <span className="ml-2 text-exchange-text-primary">{selectedKYC.address}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-exchange-text-secondary">User ID:</span>
                                  <span className="ml-2 font-mono text-sm text-exchange-text-primary">
                                    {selectedKYC.user_id}
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-exchange-border pt-4">
                                <h4 className="font-medium text-exchange-text-primary mb-2">Documents</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { url: selectedKYC.id_card_url, label: 'ID Card' },
                                    { url: selectedKYC.passport_url, label: 'Passport' },
                                    { url: selectedKYC.utility_bill_url, label: 'Utility Bill' },
                                    { url: selectedKYC.selfie_with_id_url, label: 'Selfie with ID' },
                                  ].map((doc, index) => (
                                    <Button
                                      key={index}
                                      variant={doc.url ? "outline" : "ghost"}
                                      size="sm"
                                      onClick={() => doc.url && window.open(doc.url, '_blank')}
                                      disabled={!doc.url}
                                      className="justify-start"
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      {doc.label}
                                      {!doc.url && <span className="ml-2 text-xs text-exchange-text-secondary">(Not provided)</span>}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-exchange-text-secondary">
                                  Admin Notes
                                </label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add notes (required for rejection/resubmission)"
                                  className="mt-1 bg-exchange-bg border-exchange-border text-exchange-text-primary"
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleApprove(selectedKYC)}
                                  disabled={updateKYCMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  {updateKYCMutation.isPending ? 'Processing...' : 'Approve'}
                                </Button>
                                <Button
                                  onClick={() => handleReject(selectedKYC)}
                                  disabled={updateKYCMutation.isPending || !adminNotes.trim()}
                                  variant="destructive"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  {updateKYCMutation.isPending ? 'Processing...' : 'Reject'}
                                </Button>
                                <Button
                                  onClick={() => handleRequireResubmission(selectedKYC)}
                                  disabled={updateKYCMutation.isPending || !adminNotes.trim()}
                                  variant="outline"
                                  className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                                >
                                  {updateKYCMutation.isPending ? 'Processing...' : 'Request Resubmission'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-exchange-text-secondary text-sm">
                        {kyc.status === 'approved' ? 'Approved' : 
                         kyc.status === 'rejected' ? 'Rejected' : 'Resubmission Required'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {(!kycSubmissions || kycSubmissions.length === 0) && (
          <div className="text-center py-8 text-exchange-text-secondary">
            No KYC submissions found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KYCManagementSection;
