
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

const TradingChatLive = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('Cleaning up chat subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      if (data) {
        setMessages(data as ChatMessage[]);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // Remove existing channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    console.log('Setting up chat subscription');
    
    try {
      const channel = supabase
        .channel('trading-chat')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages'
          },
          (payload) => {
            console.log('New message received:', payload);
            const newMessage = payload.new as ChatMessage;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          setOnlineUsers(Object.keys(state).length);
        })
        .subscribe((status) => {
          console.log('Chat subscription status:', status);
        });

      channelRef.current = channel;

      // Track user presence if logged in
      if (user) {
        channel.track({
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Anonymous'
        });
      }
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  const sendMessage = async () => {
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    if (!newMessage.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Anonymous',
          message: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-exchange-panel border border-exchange-border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-exchange-blue" />
          <h3 className="font-semibold text-exchange-text-primary">Live Trading Chat</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-exchange-text-secondary">
          <Users className="w-4 h-4" />
          <span>{onlineUsers} online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto mb-4 space-y-2 bg-exchange-accent/10 rounded-lg p-3">
        {messages.length === 0 ? (
          <div className="text-center text-exchange-text-secondary text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="text-sm">
              <div className="flex items-start space-x-2">
                <span className="font-medium text-exchange-blue min-w-0 flex-shrink-0">
                  {message.username}:
                </span>
                <span className="text-exchange-text-primary break-words">
                  {message.message}
                </span>
              </div>
              <div className="text-xs text-exchange-text-secondary mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex space-x-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={user ? "Type your message..." : "Please log in to chat"}
          disabled={!user || isLoading}
          className="flex-1 exchange-input"
          maxLength={500}
        />
        <Button
          onClick={sendMessage}
          disabled={!user || !newMessage.trim() || isLoading}
          size="sm"
          className="bg-exchange-blue hover:bg-exchange-blue/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {!user && (
        <p className="text-xs text-exchange-text-secondary mt-2 text-center">
          Log in to participate in the chat
        </p>
      )}
    </div>
  );
};

export default TradingChatLive;
