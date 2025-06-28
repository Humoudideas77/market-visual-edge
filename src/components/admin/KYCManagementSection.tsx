
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye, ExternalLink, FileImage, Search } from 'lucide-react';
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
  admin_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string | null;
  user_first_name?: string | null;
  user_last_name?: string | null;
};

const KYCManagementSection = () => {
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: kycSubmissions, isLoading } = useQuery({
    queryKey: ['admin-kyc', searchTerm],
    queryFn: async () => {
      console.log('Fetching KYC submissions with search term:', searchTerm);
      
      // First, get all KYC submissions
      let kycQuery = supabase
        .from('kyc_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        kycQuery = kycQuery.or(`full_name.ilike.%${searchTerm}%,nationality.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`);
      }
      
      const { data: kycData, error: kycError } = await kycQuery;
      
      if (kycError) {
        console.error('Error fetching KYC submissions:', kycError);
        throw kycError;
      }

      if (!kycData || kycData.length === 0) {
        return [];
      }

      // Get user IDs from KYC submissions
      const userIds = kycData.map(kyc => kyc.user_id);
      
      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Don't throw here, just continue without profile data
      }

      // Create a map of user_id to profile data
      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      // Combine KYC data with profile data
      const enrichedData = kycData.map(kyc => {
        const profile = profileMap.get(kyc.user_id);
        return {
          ...kyc,
          user_email: profile?.email || null,
          user_first_name: profile?.first_name || null,
          user_last_name: profile?.last_name || null,
        };
      });

      console.log('Enriched KYC data:', enrichedData);
      return enrichedData as KYCSubmission[];
    },
  });

  const updateKYCMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('Starting KYC update:', { id, status, notes, adminId: user.id });
      
      // Get the KYC submission to find the user_id before updating
      const kycSubmission = kycSubmissions?.find(k => k.id === id);
      if (!kycSubmission) {
        throw new Error('KYC submission not found');
      }

      // Update KYC submission with proper admin_id field name
      const { error: kycError } = await supabase
        .from('kyc_submissions')
        .update({
          status,
          admin_notes: notes,
          admin_id: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (kycError) {
        console.error('KYC submission update error:', kycError);
        throw kycError;
      }

      // Update user's kyc_status in profiles table - use 'verified' instead of 'approved'
      const profileStatus = status === 'approved' ? 'verified' : status;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: profileStatus,
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
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-exchange-text-secondary w-4 h-4" />
            <Input
              placeholder="Search by name, nationality, address, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-exchange-bg border-exchange-border"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User Details</TableHead>
                <TableHead>Personal Info</TableHead>
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
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-exchange-text-primary">
                        {kyc.user_email || 'No email'}
                      </div>
                      <div className="text-sm text-exchange-text-secondary">
                        {kyc.user_first_name && kyc.user_last_name
                          ? `${kyc.user_first_name} ${kyc.user_last_name}`
                          : 'No name'}
                      </div>
                      <div className="text-xs font-mono text-exchange-text-secondary">
                        {kyc.user_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-exchange-text-primary">
                        {kyc.full_name}
                      </div>
                      <div className="text-sm text-exchange-text-secondary">
                        {kyc.nationality}
                      </div>
                      <div className="text-xs text-exchange-text-secondary">
                        DOB: {format(new Date(kyc.date_of_birth), 'MMM dd, yyyy')}
                      </div>
                    </div>
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
                                  <span className="text-exchange-text-secondary">User Email:</span>
                                  <span className="ml-2 text-exchange-text-primary">
                                    {selectedKYC.user_email || 'No email'}
                                  </span>
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
                                  placeholder="Add notes (required for rejection)"
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
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-exchange-text-secondary text-sm">
                        {kyc.status === 'approved' ? 'Approved' : 'Rejected'}
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
