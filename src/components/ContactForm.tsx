
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, MessageSquare, User, Send } from 'lucide-react';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

const ContactForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.message.trim()) {
      toast.error('Message is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('customer_messages')
        .insert({
          user_id: user?.id || null,
          subject: `Contact Form Inquiry from ${formData.firstName} ${formData.lastName}`,
          message: `Name: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
          status: 'open'
        });

      if (error) {
        console.error('Error submitting contact form:', error);
        toast.error('Failed to send message. Please try again.');
        return;
      }

      setIsSubmitted(true);
      toast.success('Thank you for contacting MecCrypto. We\'ll get back to you shortly.');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        message: ''
      });

    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-exchange-panel rounded-xl border border-exchange-border p-8 text-center">
        <div className="w-16 h-16 bg-exchange-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-exchange-green" />
        </div>
        <h3 className="text-2xl font-bold text-exchange-text-primary mb-2">
          Message Sent Successfully!
        </h3>
        <p className="text-exchange-text-secondary mb-6">
          Thank you for contacting MecCrypto. We'll get back to you shortly.
        </p>
        <Button
          onClick={() => setIsSubmitted(false)}
          variant="outline"
          className="border-exchange-border hover:bg-exchange-accent"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-exchange-panel rounded-xl border border-exchange-border p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-exchange-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-exchange-blue" />
        </div>
        <h3 className="text-2xl font-bold text-exchange-text-primary mb-2">
          Get in Touch
        </h3>
        <p className="text-exchange-text-secondary">
          Have questions or need support? We're here to help!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-exchange-text-primary mb-2">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-exchange-text-secondary" />
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-exchange-accent border border-exchange-border rounded-lg text-exchange-text-primary placeholder-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue focus:border-transparent transition-all"
                placeholder="Enter your first name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-exchange-text-primary mb-2">
              Last Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-exchange-text-secondary" />
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-exchange-accent border border-exchange-border rounded-lg text-exchange-text-primary placeholder-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue focus:border-transparent transition-all"
                placeholder="Enter your last name"
              />
            </div>
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-exchange-text-primary mb-2">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-exchange-text-secondary" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 bg-exchange-accent border border-exchange-border rounded-lg text-exchange-text-primary placeholder-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue focus:border-transparent transition-all"
              placeholder="Enter your email address"
            />
          </div>
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-exchange-text-primary mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            required
            rows={5}
            className="w-full px-4 py-3 bg-exchange-accent border border-exchange-border rounded-lg text-exchange-text-primary placeholder-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue focus:border-transparent transition-all resize-vertical"
            placeholder="How can we help you? Please describe your inquiry or question..."
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-exchange-blue hover:bg-exchange-blue/90 text-white py-3 flex items-center justify-center space-x-2 transition-all"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
