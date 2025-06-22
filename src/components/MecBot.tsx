
import React, { useState } from 'react';
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
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

const MecBot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm MecBot. How can I assist you today?",
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
      const { error } = await supabase
        .from('customer_messages')
        .insert({
          user_id: user?.id || null,
          subject: `MecBot Support Request from ${contactForm.firstName} ${contactForm.lastName}`,
          message: `Contact via MecBot:\n\nName: ${contactForm.firstName} ${contactForm.lastName}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`,
          status: 'open'
        });

      if (error) {
        console.error('Error submitting support request:', error);
        toast.error('Failed to send message. Please try again.');
        return;
      }

      toast.success('Your message has been sent to our support team!');
      setShowContactForm(false);
      setContactForm({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        message: ''
      });

      // Add confirmation message to chat
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        text: "Your message has been sent to our support team! We'll get back to you soon.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmationMessage]);

    } catch (error) {
      console.error('Error submitting support request:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNeedMoreHelp = () => {
    const botMessage: Message = {
      id: Date.now().toString(),
      text: "Would you like to submit your query to our support team?",
      isBot: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
    setShowContactForm(true);
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
              <h3 className="font-semibold">MecBot</h3>
              <p className="text-xs opacity-90">Online</p>
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
                    ? 'bg-exchange-accent text-exchange-text-primary'
                    : 'bg-exchange-blue text-white'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}

          {/* Quick Reply Buttons */}
          {messages.length === 1 && (
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

          {/* Need More Help Button */}
          {messages.length > 2 && !showContactForm && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNeedMoreHelp}
                className="border-exchange-border hover:bg-exchange-accent"
              >
                Need more help?
              </Button>
            </div>
          )}
        </div>
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
