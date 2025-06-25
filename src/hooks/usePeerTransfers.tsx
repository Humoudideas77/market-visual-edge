
import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PeerTransfer {
  id: string;
  sender_id: string;
  recipient_id: string;
  recipient_transfer_id: string;
  currency: string;
  amount: number;
  status: string;
  created_at: string;
  notes?: string;
}

interface PeerTransferContextType {
  transfers: PeerTransfer[];
  loading: boolean;
  sendTransfer: (recipientId: string, currency: string, amount: number, notes?: string) => Promise<boolean>;
  refreshTransfers: () => Promise<void>;
}

const PeerTransferContext = createContext<PeerTransferContextType | null>(null);

export const usePeerTransfers = () => {
  const context = useContext(PeerTransferContext);
  if (!context) {
    throw new Error('usePeerTransfers must be used within a PeerTransferProvider');
  }
  return context;
};

export const PeerTransferProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<PeerTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('peer_transfers')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTransfer = async (
    recipientId: string, 
    currency: string, 
    amount: number, 
    notes?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to send transfers');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('execute_peer_transfer', {
        p_sender_id: user.id,
        p_recipient_transfer_id: recipientId,
        p_currency: currency,
        p_amount: amount,
        p_notes: notes || null
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Transfer completed successfully');
        await fetchTransfers();
        return true;
      } else {
        toast.error(data.message || 'Transfer failed');
        return false;
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Transfer failed');
      return false;
    }
  };

  const refreshTransfers = async () => {
    await fetchTransfers();
  };

  useEffect(() => {
    if (user) {
      fetchTransfers();
    } else {
      setTransfers([]);
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const transfersChannel = supabase
      .channel('peer-transfers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'peer_transfers',
          filter: `sender_id=eq.${user.id}`,
        },
        () => {
          console.log('Transfer activity detected, refreshing...');
          fetchTransfers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'peer_transfers',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          console.log('Transfer activity detected, refreshing...');
          fetchTransfers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transfersChannel);
    };
  }, [user]);

  return (
    <PeerTransferContext.Provider value={{
      transfers,
      loading,
      sendTransfer,
      refreshTransfers,
    }}>
      {children}
    </PeerTransferContext.Provider>
  );
};
