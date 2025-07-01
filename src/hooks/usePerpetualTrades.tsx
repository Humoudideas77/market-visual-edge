
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCryptoPrices, getPriceBySymbol } from './useCryptoPrices';

export interface PerpetualPosition {
  id: string;
  pair: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  current_price: number;
  leverage: number;
  margin: number;
  liquidation_price: number;
  pnl: number;
  pnl_percentage: number;
  created_at: string;
  status: string;
  fixed_pnl?: number | null;
}

export const usePerpetualTrades = () => {
  const { user } = useAuth();
  const { refreshBalances } = useWallet();
  const { prices } = useCryptoPrices();
  const [positions, setPositions] = useState<PerpetualPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = async () => {
    if (!user) {
      setPositions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('perpetual_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const positionsWithPnL = data.map(position => {
          const [baseAsset] = position.pair.split('/');
          const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || position.entry_price;
          
          const priceDiff = currentPrice - position.entry_price;
          const pnl = position.side === 'long' 
            ? priceDiff * position.size
            : -priceDiff * position.size;
          const pnlPercentage = (pnl / position.margin) * 100;

          return {
            id: position.id,
            pair: position.pair,
            side: position.side,
            size: position.size,
            entry_price: position.entry_price,
            current_price: currentPrice,
            leverage: position.leverage,
            margin: position.margin,
            liquidation_price: position.liquidation_price,
            pnl,
            pnl_percentage: pnlPercentage,
            created_at: position.created_at,
            status: position.status,
            fixed_pnl: position.fixed_pnl
          };
        });

        setPositions(positionsWithPnL);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const closePosition = async (positionId: string) => {
    if (!user) return;

    try {
      // Get the position details first
      const position = positions.find(p => p.id === positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      console.log('Closing position:', position);

      // Use fixed P&L if it exists, otherwise use calculated P&L
      const finalPnL = position.fixed_pnl !== null && position.fixed_pnl !== undefined 
        ? position.fixed_pnl 
        : position.pnl;

      console.log('Final P&L to apply:', finalPnL, 'Fixed P&L:', position.fixed_pnl, 'Calculated P&L:', position.pnl);

      // Update position status to closed
      const { error: updateError } = await supabase
        .from('perpetual_positions')
        .update({
          status: 'closed',
          exit_price: position.current_price,
          closed_at: new Date().toISOString()
        })
        .eq('id', positionId);

      if (updateError) throw updateError;

      // Record the P&L with the final amount (fixed or calculated)
      const { error: pnlError } = await supabase.rpc('record_trade_pnl', {
        p_user_id: user.id,
        p_trade_pair: position.pair,
        p_trade_side: position.side,
        p_entry_price: position.entry_price,
        p_exit_price: position.current_price,
        p_trade_size: position.size,
        p_currency: 'USDT'
      });

      if (pnlError) {
        console.error('Error recording PnL:', pnlError);
      }

      // Return margin + final P&L to user balance
      const totalReturn = position.margin + finalPnL;
      
      console.log('Returning to user balance:', totalReturn, '(margin:', position.margin, '+ final P&L:', finalPnL, ')');

      if (totalReturn > 0) {
        const { error: balanceError } = await supabase.rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_currency: 'USDT',
          p_amount: totalReturn,
          p_operation: 'add'
        });

        if (balanceError) {
          console.error('Error updating balance:', balanceError);
          throw balanceError;
        }
      }

      // Show appropriate success message
      const pnlText = finalPnL >= 0 ? `+$${finalPnL.toFixed(2)}` : `-$${Math.abs(finalPnL).toFixed(2)}`;
      const fixedNote = position.fixed_pnl !== null && position.fixed_pnl !== undefined ? ' (Admin Fixed P&L Applied)' : '';
      
      toast.success(`Position closed successfully! P&L: ${pnlText} USDT${fixedNote}`);

      // Refresh data
      await Promise.all([
        fetchPositions(),
        refreshBalances()
      ]);

      return true;
    } catch (error) {
      console.error('Error closing position:', error);
      toast.error('Failed to close position: ' + (error as Error).message);
      return false;
    }
  };

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('perpetual-positions-user')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perpetual_positions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('User perpetual position updated, refreshing...');
          fetchPositions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Initial fetch and price updates
  useEffect(() => {
    fetchPositions();
  }, [user?.id]);

  // Update positions when prices change
  useEffect(() => {
    if (positions.length > 0 && prices.length > 0) {
      setPositions(prev => prev.map(position => {
        const [baseAsset] = position.pair.split('/');
        const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || position.entry_price;
        
        const priceDiff = currentPrice - position.entry_price;
        const pnl = position.side === 'long' 
          ? priceDiff * position.size
          : -priceDiff * position.size;
        const pnlPercentage = (pnl / position.margin) * 100;

        return {
          ...position,
          current_price: currentPrice,
          pnl,
          pnl_percentage: pnlPercentage
        };
      }));
    }
  }, [prices]);

  return {
    positions,
    loading,
    closePosition,
    refetch: fetchPositions
  };
};
