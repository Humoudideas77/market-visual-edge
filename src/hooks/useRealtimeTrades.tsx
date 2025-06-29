
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
  const [error, setError] = useState<string | null>(null);

  // Initial fetch of all active trades
  const fetchActiveTrades = async () => {
    if (!user) {
      setActiveTrades([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching active trades for user:', user.email);

      // Check if user is superadmin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw profileError;
      }

      console.log('User profile:', profile);

      if (profile?.role !== 'superadmin') {
        console.log('User is not superadmin, no trades to display');
        setActiveTrades([]);
        setIsLoading(false);
        return;
      }

      console.log('SuperAdmin confirmed, fetching all active positions...');

      // Fetch all active positions with user info using a more explicit join
      const { data: positions, error: positionsError } = await supabase
        .from('perpetual_positions')
        .select(`
          id,
          user_id,
          pair,
          side,
          size,
          entry_price,
          leverage,
          margin,
          liquidation_price,
          created_at,
          status
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (positionsError) {
        console.error('Error fetching positions:', positionsError);
        throw positionsError;
      }

      console.log('Raw positions fetched:', positions?.length || 0);

      if (!positions || positions.length === 0) {
        console.log('No active positions found');
        setActiveTrades([]);
        setIsLoading(false);
        return;
      }

      // Get user emails for all positions
      const userIds = [...new Set(positions.map(p => p.user_id))];
      const { data: userProfiles, error: usersError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
      }

      // Create a map of user IDs to emails
      const userEmailMap = new Map();
      userProfiles?.forEach(profile => {
        userEmailMap.set(profile.id, profile.email);
      });

      // Process trades with PnL calculations
      const tradesWithPnL = positions.map(trade => {
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
          user_email: userEmailMap.get(trade.user_id) || `User ${trade.user_id.substring(0, 8)}...`,
          current_price: currentPrice,
          pnl: pnl,
          pnl_percentage: pnlPercentage
        };
      });

      console.log('Processed trades with PnL:', tradesWithPnL.length);
      setActiveTrades(tradesWithPnL);
    } catch (error) {
      console.error('Error fetching active trades:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch trades');
      setActiveTrades([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for user:', user.email);
    fetchActiveTrades();

    // Subscribe to real-time changes on perpetual_positions
    const channel = supabase
      .channel('perpetual-positions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perpetual_positions'
        },
        (payload) => {
          console.log('Real-time perpetual positions update:', payload);
          // Refetch trades when any change occurs
          fetchActiveTrades();
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
  }, [prices]);

  return {
    activeTrades,
    isLoading,
    error,
    refetch: fetchActiveTrades
  };
};
