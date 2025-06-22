
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const CustomerMessageModal = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageData, setMessageData] = useState({
    subject: '',
    message: ''
  });

  const sendMessage = async () => {
    if (!user || !messageData.subject.trim() || !messageData.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customer_messages')
        .insert({
          user_id: user.id,
          subject: messageData.subject.trim(),
          message: messageData.message.trim(),
          status: 'open'
        });

      if (error) throw error;

      toast.success('Message sent successfully! We will respond within 24 hours.');
      setMessageData({ subject: '', message: '' });
      setOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-exchange-text-secondary hover:text-exchange-text-primary hover:bg-exchange-accent"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Support
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-exchange-card-bg border-exchange-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-exchange-text-primary">Contact Support</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-exchange-text-primary">Subject</Label>
            <Input
              value={messageData.subject}
              onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="What can we help you with?"
              className="bg-exchange-bg border-exchange-border"
            />
          </div>
          
          <div>
            <Label className="text-exchange-text-primary">Message</Label>
            <Textarea
              value={messageData.message}
              onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Please describe your issue or question in detail..."
              className="bg-exchange-bg border-exchange-border resize-none"
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-exchange-border"
            >
              Cancel
            </Button>
            <Button
              onClick={sendMessage}
              disabled={loading || !messageData.subject.trim() || !messageData.message.trim()}
              className="bg-exchange-blue hover:bg-exchange-blue/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerMessageModal;
