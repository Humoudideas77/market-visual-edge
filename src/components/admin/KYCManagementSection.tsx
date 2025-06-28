
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye, Search, FileCheck, User } from 'lucide-react';
import { format } from 'date-fns';

type KYCSubmission = {
  id: string;
  user_id: string;
  full_name: string;
  nationality: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const KYCManagementSection = () => {
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: kycSubmissions, isLoading } = useQuery({
    queryKey: ['admin-kyc', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('kyc_submissions')
        .select(`
          *,
          profiles (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,nationality.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KYCSubmission[];
    },
  });

  const updateKYCMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated admin user found');
      }

      // Update KYC submission
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

      if (kycError) throw kycError;

      // Update user's KYC status in profiles
      const kyc = kycSubmissions?.find(k => k.id === id);
      if (kyc) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            kyc_status: status === 'approved' ? 'verified' : status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', kyc.user_id);

        if (profileError) throw profileError;
      }

      // Log admin activity
      await supabase.from('admin_activities').insert({
        admin_id: user.id,
        action_type: `kyc_${status}`,
        target_table: 'kyc_submissions',
        target_record_id: id,
        action_details: { status, notes },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
      
      if (variables.status === 'approved') {
        toast.success('KYC approved successfully! User is now verified.');
      } else if (variables.status === 'rejected') {
        toast.success('KYC rejected successfully. User has been notified.');
      }
      
      setSelectedKYC(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      console.error('KYC approval failed:', error);
      toast.error(`Failed to update KYC submission: ${error.message}`);
    },
  });

  const handleApprove = (kyc: KYCSubmission) => {
    updateKYCMutation.mutate({
      id: kyc.id,
      status: 'approved',
      notes: adminNotes || 'KYC approved by admin',
    });
  };

  const handleReject = (kyc: KYCSubmission) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
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
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Filter submissions based on search term
  const filteredSubmissions = kycSubmissions?.filter(submission => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      submission.full_name?.toLowerCase().includes(searchLower) ||
      submission.nationality?.toLowerCase().includes(searchLower) ||
      submission.user_id?.toLowerCase().includes(searchLower) ||
      submission.profiles?.email?.toLowerCase().includes(searchLower) ||
      submission.profiles?.first_name?.toLowerCase().includes(searchLower) ||
      submission.profiles?.last_name?.toLowerCase().includes(searchLower)
    );
  });

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

  const pendingKYCs = filteredSubmissions?.filter(k => k.status === 'pending') || [];

  return (
    <Card className="bg-exchange-card-bg border-exchange-border">
      <CardHeader>
        <CardTitle className="text-exchange-text-primary">
          KYC Management
          {pendingKYCs.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingKYCs.length} Pending
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-exchange-text-secondary w-4 h-4" />
            <Input
              placeholder="Search by name, nationality, email or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-exchange-bg border-exchange-border text-exchange-text-primary"
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
                <TableHead>User</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions?.map((kyc) => (
                <TableRow key={kyc.id}>
                  <TableCell className="text-exchange-text-secondary">
                    {format(new Date(kyc.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-exchange-text-primary">
                        {kyc.profiles?.email || 'No email'}
                      </div>
                      <div className="text-sm font-mono text-exchange-text-secondary">
                        {kyc.user_id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-exchange-text-primary">
                    {kyc.full_name}
                  </TableCell>
                  <TableCell className="text-exchange-text-secondary">
                    {kyc.nationality}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(kyc.status)}
                  </TableCell>
                  <TableCell>
                    {kyc.status === 'pending' ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setAdminNotes(kyc.admin_notes || '');
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-exchange-card-bg border-exchange-border max-w-4xl">
                          <DialogHeader>
                            <DialogTitle className="text-exchange-text-primary">
                              Review KYC Submission
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-exchange-text-secondary">Full Name:</span>
                                <span className="ml-2 font-semibold text-exchange-text-primary">
                                  {kyc.full_name}
                                </span>
                              </div>
                              <div>
                                <span className="text-exchange-text-secondary">Nationality:</span>
                                <span className="ml-2 text-exchange-text-primary">{kyc.nationality}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-exchange-text-secondary">User ID:</span>
                                <span className="ml-2 font-mono text-sm text-exchange-text-primary">
                                  {kyc.user_id}
                                </span>
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
                                className="mt-1 bg-exchange-bg border-exchange-border"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(kyc)}
                                disabled={updateKYCMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                {updateKYCMutation.isPending ? 'Processing...' : 'Approve'}
                              </Button>
                              <Button
                                onClick={() => handleReject(kyc)}
                                disabled={updateKYCMutation.isPending}
                                variant="destructive"
                              >
                                <X className="w-4 h-4 mr-1" />
                                {updateKYCMutation.isPending ? 'Processing...' : 'Reject'}
                              </Button>
                            </div>
                          </div>
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
        
        {(!filteredSubmissions || filteredSubmissions.length === 0) && (
          <div className="text-center py-8 text-exchange-text-secondary">
            {searchTerm ? 'No KYC submissions found matching your search' : 'No KYC submissions found'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KYCManagementSection;
