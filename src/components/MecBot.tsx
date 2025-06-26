
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isAdminReply?: boolean;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

interface DatabaseMessage {
  id: string;
  admin_reply: string | null;
  status: string;
  updated_at: string;
  created_at: string;
  user_id: string;
  subject: string;
  message: string;
}

const MecBot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInConversation, setIsInConversation] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm MexcCrypto Bot. How can I assist you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [contactForm, setContactForm] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing admin replies when component mounts or user changes
  useEffect(() => {
    const loadExistingReplies = async () => {
      if (!user) return;

      try {
        console.log('Loading existing admin replies for user:', user.id);
        
        const { data: existingMessages, error } = await supabase
          .from('customer_messages')
          .select('*')
          .eq('user_id', user.id)
          .not('admin_reply', 'is', null)
          .eq('status', 'replied')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading existing admin replies:', error);
          return;
        }

        console.log('Found existing messages:', existingMessages);

        if (existingMessages && existingMessages.length > 0) {
          const adminMessages: Message[] = existingMessages.map((msg: DatabaseMessage) => ({
            id: `admin-reply-${msg.id}`,
            text: msg.admin_reply || '',
            isBot: true,
            isAdminReply: true,
            timestamp: new Date(msg.updated_at)
          }));

          console.log('Setting admin messages:', adminMessages);

          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = adminMessages.filter(m => !existingIds.has(m.id));
            if (newMessages.length > 0) {
              console.log('Adding new admin messages:', newMessages);
              return [...prev, ...newMessages];
            }
            return prev;
          });

          // Set conversation state
          if (existingMessages.length > 0) {
            setIsInConversation(true);
            setCurrentMessageId(existingMessages[existingMessages.length - 1].id);
          }
        }
      } catch (error) {
        console.error('Error loading existing admin replies:', error);
      }
    };

    loadExistingReplies();
  }, [user]);

  // Set up real-time subscription for new admin replies
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for user:', user.id);

    const channel = supabase
      .channel(`mecbot-admin-replies-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          console.log('Payload eventType:', payload.eventType);
          console.log('Payload new:', payload.new);
          console.log('Payload old:', payload.old);
          
          // Handle both INSERT and UPDATE events
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedMessage = payload.new as DatabaseMessage;
            
            console.log('Processing message update:', updatedMessage);
            
            // Check if this is a new admin reply
            if (updatedMessage && 
                updatedMessage.admin_reply && 
                updatedMessage.status === 'replied') {
              
              console.log('Processing new admin reply:', updatedMessage.admin_reply);
              
              const adminReplyMessage: Message = {
                id: `admin-reply-${updatedMessage.id}`,
                text: updatedMessage.admin_reply,
                isBot: true,
                isAdminReply: true,
                timestamp: new Date(updatedMessage.updated_at || updatedMessage.created_at)
              };

              setMessages(prev => {
                // Check if this message already exists
                const existingMessageIndex = prev.findIndex(m => m.id === adminReplyMessage.id);
                if (existingMessageIndex !== -1) {
                  // Update existing message
                  const updated = [...prev];
                  updated[existingMessageIndex] = adminReplyMessage;
                  console.log('Updated existing message:', adminReplyMessage);
                  return updated;
                } else {
                  // Add new message
                  console.log('Adding new admin reply message:', adminReplyMessage);
                  return [...prev, adminReplyMessage];
                }
              });

              setIsInConversation(true);
              setCurrentMessageId(updatedMessage.id);

              // Show toast notification when bot is closed
              if (!isOpen) {
                toast.success('📧 New admin reply received! Check MexcCrypto Bot.');
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error in real-time subscription');
        }
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, isOpen]);

  const quickReplies = [
    { id: 'deposit', text: 'How to deposit?', action: 'deposit' },
    { id: 'goldmine', text: 'How does Goldmine work?', action: 'goldmine' },
    { id: 'kyc', text: 'How do I submit KYC?', action: 'kyc' },
    { id: 'support', text: 'Contact Support', action: 'support' }
  ];

  const handleQuickReply = (action: string, text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date()
    };

    let botResponse: Message;

    switch (action) {
      case 'deposit':
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: "To make a deposit: 1) Go to your Dashboard 2) Click 'Deposit' 3) Choose your currency and network 4) Send funds to the provided address 5) Upload transaction screenshot for verification. Need more help?",
          isBot: true,
          timestamp: new Date()
        };
        break;
      case 'goldmine':
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: "Gold Mining is our investment program offering daily returns. Visit the Gold Mining section in your dashboard to explore different plans with various return rates and durations. Want to learn more?",
          isBot: true,
          timestamp: new Date()
        };
        break;
      case 'kyc':
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: "To submit KYC: 1) Go to your Dashboard 2) Find the KYC section 3) Upload required documents (ID, address proof, selfie) 4) Wait for admin approval. Need assistance with documents?",
          isBot: true,
          timestamp: new Date()
        };
        break;
      case 'support':
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: "I'll connect you with our support team. Please fill out the form below and we'll get back to you shortly!",
          isBot: true,
          timestamp: new Date()
        };
        setShowContactForm(true);
        break;
      default:
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: "I'm not sure how to help with that. Would you like to submit your query to our support team?",
          isBot: true,
          timestamp: new Date()
        };
    }

    setMessages(prev => [...prev, userMessage, botResponse]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      console.log('Sending message to support team...');

      // Send message through the edge function
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          firstName: user.user_metadata?.first_name || 'User',
          lastName: user.user_metadata?.last_name || '',
          email: user.email,
          message: `MexcCrypto Bot Message:\n\n${newMessage}`,
          userId: user.id
        }
      });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message. Please try again.');
        return;
      }

      if (data?.success) {
        console.log('Message sent successfully, message ID:', data.messageId);
        toast.success('Message sent to support team!');
        setIsInConversation(true);
        
        // Set the current message ID if returned
        if (data.messageId) {
          setCurrentMessageId(data.messageId);
        }
        
        const confirmationMessage: Message = {
          id: Date.now().toString(),
          text: "Your message has been sent to our support team! They'll reply shortly and you'll see it here in real-time.",
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmationMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.firstName.trim() || !contactForm.lastName.trim() || 
        !contactForm.email.trim() || !contactForm.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting contact form:', contactForm);

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          firstName: contactForm.firstName,
          lastName: contactForm.lastName,
          email: contactForm.email,
          message: `MexcCrypto Bot Support Request:\n\n${contactForm.message}`,
          userId: user?.id
        }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        toast.error('Failed to send message. Please try again.');
        return;
      }

      if (data?.success) {
        console.log('Contact form submitted successfully, message ID:', data.messageId);
        toast.success('Your message has been sent to our support team!');
        setShowContactForm(false);
        setContactForm({
          firstName: '',
          lastName: '',
          email: user?.email || '',
          message: ''
        });
        setIsInConversation(true);

        // Set the current message ID if returned
        if (data.messageId) {
          setCurrentMessageId(data.messageId);
        }

        const confirmationMessage: Message = {
          id: Date.now().toString(),
          text: "Your message has been sent to our support team! We'll get back to you via email and you'll see the reply here in real-time.",
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmationMessage]);
      } else {
        toast.error(data?.error || 'Failed to send message. Please try again.');
      }

    } catch (error) {
      console.error('Error submitting support request:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-exchange-blue hover:bg-exchange-blue/90 shadow-lg flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 w-80 h-96 bg-exchange-panel border border-exchange-border rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-exchange-blue text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold">MexcCrypto Bot</h3>
              <p className="text-xs opacity-90">
                {isInConversation ? 'Live Support' : 'Online'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  message.isBot
                    ? message.isAdminReply 
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 relative'
                      : 'bg-exchange-accent text-exchange-text-primary'
                    : 'bg-exchange-blue text-white'
                }`}
              >
                {message.isAdminReply && (
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-400">
                    <User className="w-3 h-3" />
                    Admin Reply
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.text}</div>
                {message.isAdminReply && (
                  <div className="text-xs mt-2 opacity-75 text-blue-400">
                    Live response • {message.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Quick Reply Buttons - only show initially */}
          {messages.length === 1 && !isInConversation && (
            <div className="space-y-2">
              {quickReplies.map((reply) => (
                <Button
                  key={reply.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReply(reply.action, reply.text)}
                  className="w-full justify-start text-left border-exchange-border hover:bg-exchange-accent"
                >
                  {reply.text}
                </Button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - Show when in conversation or after initial interaction */}
        {(isInConversation || messages.length > 1) && (
          <div className="p-4 border-t border-exchange-border">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 bg-exchange-accent border border-exchange-border rounded text-exchange-text-primary placeholder-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="bg-exchange-blue hover:bg-exchange-blue/90 px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Contact Support Button - show when not in conversation */}
        {!isInConversation && messages.length > 2 && (
          <div className="p-4 border-t border-exchange-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContactForm(true)}
              className="w-full border-exchange-border hover:bg-exchange-accent"
            >
              Contact Support Team
            </Button>
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="sm:max-w-md bg-exchange-panel border-exchange-border">
          <DialogHeader>
            <DialogTitle className="text-exchange-text-primary">Contact Support</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleContactFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-exchange-text-primary mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={contactForm.firstName}
                  onChange={handleContactFormChange}
                  required
                  className="w-full px-3 py-2 bg-exchange-accent border border-exchange-border rounded text-exchange-text-primary placeholder-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue"
                  placeholder="First name"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-exchange-text-primary mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={contactForm.lastName}
                  onChange={handleContactFormChange}
                  required
                  className="w-full px-3 py-2 bg-exchange-accent border border-exchange-border rounded text-exchange-text-primary placeholder-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-exchange-text-primary mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={contactForm.email}
                onChange={handleContactFormChange}
                required
                className="w-full px-3 py-2 bg-exchange-accent border border-exchange-border rounded text-exchange-text-primary placeholder-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-exchange-text-primary mb-1">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={contactForm.message}
                onChange={handleContactFormChange}
                required
                rows={4}
                className="w-full px-3 py-2 bg-exchange-accent border border-exchange-border rounded text-exchange-text-primary placeholder-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue resize-vertical"
                placeholder="Describe your issue or question..."
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowContactForm(false)}
                className="flex-1 border-exchange-border hover:bg-exchange-accent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-exchange-blue hover:bg-exchange-blue/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MecBot;
