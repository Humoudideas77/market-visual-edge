
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  Clock, 
  User, 
  MessageSquare, 
  Reply, 
  CheckCircle, 
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ContactMessage {
  id: string;
  user_id: string | null;
  subject: string;
  message: string;
  status: 'open' | 'replied' | 'closed';
  admin_reply: string | null;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

const ContactMessagesSection = () => {
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all contact messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContactMessage[];
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
  });

  // Update message status mutation
  const updateMessageMutation = useMutation({
    mutationFn: async ({ messageId, status, adminReply }: { 
      messageId: string; 
      status: string; 
      adminReply?: string;
    }) => {
      const updateData: any = { status };
      if (adminReply) {
        updateData.admin_reply = adminReply;
      }

      const { error } = await supabase
        .from('customer_messages')
        .update(updateData)
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast.success('Message updated successfully');
      setReplyText('');
      setIsReplying(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update message: ${error.message}`);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Open</Badge>;
      case 'replied':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Replied</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const parseMessageContent = (message: string) => {
    const lines = message.split('\n');
    const nameMatch = lines.find(line => line.startsWith('Name:'));
    const emailMatch = lines.find(line => line.startsWith('Email:'));
    
    const name = nameMatch ? nameMatch.replace('Name:', '').trim() : 'Anonymous';
    const email = emailMatch ? emailMatch.replace('Email:', '').trim() : 'No email';
    
    const messageStartIndex = lines.findIndex(line => line.trim() === 'Message:');
    const actualMessage = messageStartIndex !== -1 
      ? lines.slice(messageStartIndex + 1).join('\n').trim()
      : message;

    return { name, email, actualMessage };
  };

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    await updateMessageMutation.mutateAsync({
      messageId,
      status: 'replied',
      adminReply: replyText
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Contact Messages</h2>
          <p className="text-gray-300">Manage user inquiries and support requests</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="bg-gray-800 text-white border-gray-600">
            {messages?.length || 0} Total Messages
          </Badge>
          <Badge variant="destructive" className="bg-red-600 text-white">
            {messages?.filter(m => m.status === 'open').length || 0} Open
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              All Messages
            </CardTitle>
            <CardDescription className="text-gray-400">
              Click on a message to view details and reply
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {messages?.map((message) => {
                  const { name, email } = parseMessageContent(message.message);
                  return (
                    <Card
                      key={message.id}
                      className={`cursor-pointer transition-all border ${
                        selectedMessage?.id === message.id
                          ? 'bg-gray-700 border-blue-500'
                          : 'bg-gray-800 border-gray-600 hover:bg-gray-750'
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-white font-medium text-sm">{name}</span>
                          </div>
                          {getStatusBadge(message.status)}
                        </div>
                        <p className="text-gray-400 text-xs mb-1">{email}</p>
                        <p className="text-gray-300 text-sm line-clamp-2">{message.subject}</p>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {messages?.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No contact messages yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Details & Reply */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Message Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                {(() => {
                  const { name, email, actualMessage } = parseMessageContent(selectedMessage.message);
                  return (
                    <>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-white font-semibold">{name}</h3>
                            <p className="text-gray-400 text-sm">{email}</p>
                          </div>
                          {getStatusBadge(selectedMessage.status)}
                        </div>
                        <div className="mb-3">
                          <p className="text-gray-300 font-medium mb-1">Subject:</p>
                          <p className="text-white">{selectedMessage.subject}</p>
                        </div>
                        <div>
                          <p className="text-gray-300 font-medium mb-2">Message:</p>
                          <div className="bg-gray-700 p-3 rounded border-l-4 border-blue-500">
                            <p className="text-white whitespace-pre-wrap">{actualMessage}</p>
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs mt-3">
                          Received: {format(new Date(selectedMessage.created_at), 'MMMM dd, yyyy at HH:mm')}
                        </p>
                      </div>

                      {selectedMessage.admin_reply && (
                        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700">
                          <p className="text-blue-300 font-medium mb-2">Admin Reply:</p>
                          <p className="text-white whitespace-pre-wrap">{selectedMessage.admin_reply}</p>
                        </div>
                      )}

                      <div className="space-y-3">
                        {!isReplying ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setIsReplying(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={updateMessageMutation.isPending}
                            >
                              <Reply className="w-4 h-4 mr-2" />
                              Reply
                            </Button>
                            <Button
                              onClick={() => updateMessageMutation.mutate({
                                messageId: selectedMessage.id,
                                status: selectedMessage.status === 'closed' ? 'open' : 'closed'
                              })}
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-800"
                              disabled={updateMessageMutation.isPending}
                            >
                              {selectedMessage.status === 'closed' ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reopen
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Close
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply here..."
                              className="bg-gray-800 border-gray-600 text-white"
                              rows={4}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReply(selectedMessage.id)}
                                disabled={updateMessageMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {updateMessageMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Reply className="w-4 h-4 mr-2" />
                                )}
                                Send Reply
                              </Button>
                              <Button
                                onClick={() => {
                                  setIsReplying(false);
                                  setReplyText('');
                                }}
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Select a message to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactMessagesSection;
