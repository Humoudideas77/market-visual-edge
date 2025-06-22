
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Users } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatChannel = useRef<any>(null);

  // Demo messages for immediate functionality
  const demoMessages: ChatMessage[] = [
    {
      id: '1',
      user_id: 'demo1',
      username: 'CryptoTrader88',
      message: 'BTC looking bullish today! 🚀',
      created_at: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: '2',
      user_id: 'demo2',
      username: 'DiamondHands',
      message: 'ETH breaking resistance levels',
      created_at: new Date(Date.now() - 240000).toISOString(),
    },
    {
      id: '3',
      user_id: 'demo3',
      username: 'TechnicalAnalyst',
      message: 'Watch for the golden cross pattern on the 4H chart',
      created_at: new Date(Date.now() - 180000).toISOString(),
    },
    {
      id: '4',
      user_id: 'demo4',
      username: 'MoonBoy',
      message: 'HODL strong! 💎🙌',
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
  ];

  useEffect(() => {
    // Initialize with demo messages
    setMessages(demoMessages);
    setOnlineUsers(Math.floor(Math.random() * 500) + 100);

    // Set up real-time chat if user is authenticated
    if (user) {
      setupRealTimeChat();
      loadChatHistory();
    }

    // Simulate live user count updates
    const userCountInterval = setInterval(() => {
      setOnlineUsers(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
        return Math.max(50, prev + change);
      });
    }, 30000); // Update every 30 seconds

    // Add demo messages periodically for demonstration
    const demoInterval = setInterval(() => {
      const demoUserMessages = [
        'Just bought the dip! 📈',
        'Volume is picking up nicely',
        'Support holding strong at this level',
        'Nice breakout happening right now',
        'Time to take some profits? 🤔',
        'This market is insane! 🎢',
        'RSI showing oversold conditions',
        'Perfect entry point imo',
      ];
      
      const demoUsernames = [
        'TradingPro', 'CryptoMaster', 'BlockchainBull', 'AltcoinAlpha',
        'FuturesKing', 'ScalpingGuru', 'HODLStrong', 'DefiDegen'
      ];

      const randomMessage = demoUserMessages[Math.floor(Math.random() * demoUserMessages.length)];
      const randomUsername = demoUsernames[Math.floor(Math.random() * demoUsernames.length)];

      const newDemoMessage: ChatMessage = {
        id: `demo_${Date.now()}`,
        user_id: `demo_${Math.random()}`,
        username: randomUsername,
        message: randomMessage,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev.slice(-19), newDemoMessage]); // Keep last 20 messages
    }, 15000); // Add new message every 15 seconds

    return () => {
      clearInterval(userCountInterval);
      clearInterval(demoInterval);
      if (chatChannel.current) {
        supabase.removeChannel(chatChannel.current);
      }
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupRealTimeChat = () => {
    chatChannel.current = supabase
      .channel('trading-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trading_chat_messages'
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev.slice(-19), newMessage]);
        }
      )
      .subscribe();
  };

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(prev => [...data.reverse(), ...prev.slice(-10)]); // Merge with demo messages
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) {
      if (!user) {
        toast.error('Please sign in to participate in chat');
        return;
      }
      return;
    }

    try {
      const username = user.email?.split('@')[0] || 'Anonymous';
      
      const { error } = await supabase
        .from('trading_chat_messages')
        .insert({
          user_id: user.id,
          username: username,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`bg-exchange-panel border border-exchange-border rounded-lg transition-all duration-300 ${
      isExpanded ? 'h-96' : 'h-16'
    }`}>
      {/* Chat Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-exchange-border cursor-pointer hover:bg-exchange-accent/20"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-exchange-blue" />
          <span className="text-sm font-medium text-exchange-text-primary">Live Trading Chat</span>
          <div className="flex items-center space-x-1 text-xs text-exchange-text-secondary">
            <Users className="w-3 h-3" />
            <span>{onlineUsers.toLocaleString()} online</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-exchange-text-secondary">
            {isExpanded ? 'Click to minimize' : 'Click to expand'}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      {isExpanded && (
        <>
          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {messages.map((message) => (
              <div key={message.id} className="text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-exchange-text-secondary min-w-[3rem]">
                    {formatTime(message.created_at)}
                  </span>
                  <span className="text-exchange-blue font-medium text-xs min-w-fit">
                    {message.username}:
                  </span>
                  <span className="text-exchange-text-primary text-xs break-words">
                    {message.message}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-exchange-border">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={user ? "Type a message..." : "Sign in to chat"}
                disabled={!user}
                className="flex-1 px-3 py-2 bg-exchange-bg border border-exchange-border rounded text-exchange-text-primary placeholder:text-exchange-text-secondary text-sm focus:outline-none focus:ring-1 focus:ring-exchange-blue disabled:opacity-50"
                maxLength={200}
              />
              <button
                onClick={sendMessage}
                disabled={!user || !newMessage.trim()}
                className="px-3 py-2 bg-exchange-blue hover:bg-exchange-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {!user && (
              <p className="text-xs text-exchange-text-secondary mt-2">
                Please sign in to participate in the trading chat
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TradingChatLive;
