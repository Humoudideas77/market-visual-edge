
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCryptoPrices, getPriceBySymbol } from './useCryptoPrices';
import { useAuth } from './useAuth';

interface RealtimeTrade {
  id: string;
  user_id: string;
  pair: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  leverage: number;
  margin: number;
  liquidation_price: number;
  created_at: string;
  user_email?: string;
  current_price?: number;
  pnl?: number;
  pnl_percentage?: number;
}

export const useRealtimeTrades = () => {
  const { user } = useAuth();
  const { prices } = useCryptoPrices();
  const [activeTrades, setActiveTrades] = useState<RealtimeTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch of all active trades
  const fetchActiveTrades = async () => {
    if (!user) return;

    try {
      // Check if user is superadmin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'superadmin') {
        setIsLoading(false);
        return;
      }

      // Fetch all active positions with user info
      const { data: positions, error } = await supabase
        .from('perpetual_positions')
        .select(`
          *,
          profiles!inner(email)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tradesWithPnL = (positions || []).map(trade => {
        const [baseAsset] = trade.pair.split('/');
        const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || trade.entry_price;
        
        const priceDiff = currentPrice - trade.entry_price;
        const pnl = trade.side === 'long' 
          ? priceDiff * trade.size
          : -priceDiff * trade.size;
        const pnlPercentage = (pnl / trade.margin) * 100;

        return {
          id: trade.id,
          user_id: trade.user_id,
          pair: trade.pair,
          side: trade.side as 'long' | 'short',
          size: trade.size,
          entry_price: trade.entry_price,
          leverage: trade.leverage,
          margin: trade.margin,
          liquidation_price: trade.liquidation_price,
          created_at: trade.created_at,
          user_email: (trade.profiles as any)?.email || `User ${trade.user_id.substring(0, 8)}...`,
          current_price: currentPrice,
          pnl: pnl,
          pnl_percentage: pnlPercentage
        };
      });

      setActiveTrades(tradesWithPnL);
    } catch (error) {
      console.error('Error fetching active trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchActiveTrades();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('perpetual-positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perpetual_positions'
        },
        (payload) => {
          console.log('Real-time trade update:', payload);
          // Refetch trades when any change occurs
          fetchActiveTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, prices]);

  // Update PnL in real-time based on price changes
  useEffect(() => {
    if (activeTrades.length > 0 && prices.length > 0) {
      setActiveTrades(prev => prev.map(trade => {
        const [baseAsset] = trade.pair.split('/');
        const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || trade.entry_price;
        
        const priceDiff = currentPrice - trade.entry_price;
        const pnl = trade.side === 'long' 
          ? priceDiff * trade.size
          : -priceDiff * trade.size;
        const pnlPercentage = (pnl / trade.margin) * 100;

        return {
          ...trade,
          current_price: currentPrice,
          pnl,
          pnl_percentage: pnlPercentage
        };
      }));
    }
  }, [prices, activeTrades.length]);

  return {
    activeTrades,
    isLoading,
    refetch: fetchActiveTrades
  };
};
