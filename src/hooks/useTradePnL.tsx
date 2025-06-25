
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TradePnL {
  id: string;
  trade_pair: string;
  trade_side: string;
  entry_price: number;
  exit_price: number;
  trade_size: number;
  pnl_amount: number;
  pnl_percentage: number;
  currency: string;
  created_at: string;
  trade_reference?: string;
}

interface TradePnLResponse {
  success: boolean;
  message: string;
  pnl_amount?: number;
  pnl_percentage?: number;
}

export const useTradePnL = () => {
  const { user } = useAuth();
  const [tradePnLHistory, setTradePnLHistory] = useState<TradePnL[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTradePnL = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trade_pnl')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTradePnLHistory(data || []);
    } catch (error) {
      console.error('Error fetching trade PnL:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordTradePnL = async (
    tradePair: string,
    tradeSide: 'buy' | 'sell' | 'long' | 'short',
    entryPrice: number,
    exitPrice: number,
    tradeSize: number,
    currency: string = 'USDT'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('record_trade_pnl', {
        p_user_id: user.id,
        p_trade_pair: tradePair,
        p_trade_side: tradeSide,
        p_entry_price: entryPrice,
        p_exit_price: exitPrice,
        p_trade_size: tradeSize,
        p_currency: currency
      });

      if (error) throw error;

      // Type guard to safely access properties
      const response = data as unknown as TradePnLResponse;
      
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success) {
          console.log('Trade PnL recorded:', response);
          await fetchTradePnL(); // Refresh the history
          return true;
        } else {
          console.error('Failed to record trade PnL:', response.message);
          return false;
        }
      } else {
        console.error('Unexpected response format');
        return false;
      }
    } catch (error) {
      console.error('Error recording trade PnL:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchTradePnL();
    } else {
      setTradePnLHistory([]);
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const pnlChannel = supabase
      .channel('trade-pnl-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_pnl',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('Trade PnL updated, refreshing...');
          fetchTradePnL();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pnlChannel);
    };
  }, [user]);

  return {
    tradePnLHistory,
    loading,
    recordTradePnL,
    refreshTradePnL: fetchTradePnL,
  };
};
