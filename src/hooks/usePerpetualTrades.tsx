
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
  const { refreshBalances, getBalance } = useWallet();
  const { prices } = useCryptoPrices();
  const [positions, setPositions] = useState<PerpetualPosition[]>([]);
  const [allPositions, setAllPositions] = useState<PerpetualPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = async () => {
    if (!user) {
      setPositions([]);
      setAllPositions([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch active positions
      const { data: activeData, error: activeError } = await supabase
        .from('perpetual_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // Fetch all positions for history
      const { data: allData, error: allError } = await supabase
        .from('perpetual_positions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      if (activeData) {
        const positionsWithPnL = activeData.map(position => {
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
            side: position.side as 'long' | 'short',
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

      if (allData) {
        const allPositionsWithPnL = allData.map(position => {
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
            side: position.side as 'long' | 'short',
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

        setAllPositions(allPositionsWithPnL);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const openPosition = async (side: 'long' | 'short', size: number, leverage: number, selectedPair: string) => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const [baseAsset] = selectedPair.split('/');
      const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price;
      
      if (!currentPrice) {
        return { success: false, message: 'Unable to get current price' };
      }

      const notionalValue = size * currentPrice;
      const margin = notionalValue / leverage;
      
      // Check if user has sufficient balance
      const usdtBalance = getBalance('USDT');
      if (!usdtBalance || usdtBalance.available < margin) {
        return { success: false, message: 'Insufficient balance' };
      }

      // Calculate liquidation price
      const marginRatio = 1 / leverage;
      const liquidationPrice = side === 'long'
        ? currentPrice * (1 - marginRatio)
        : currentPrice * (1 + marginRatio);

      // Deduct margin from balance
      const { error: balanceError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_currency: 'USDT',
        p_amount: margin,
        p_operation: 'subtract'
      });

      if (balanceError) {
        return { success: false, message: 'Failed to update balance: ' + balanceError.message };
      }

      // Create position
      const { error: positionError } = await supabase
        .from('perpetual_positions')
        .insert({
          user_id: user.id,
          pair: selectedPair,
          side,
          size,
          entry_price: currentPrice,
          leverage,
          margin,
          liquidation_price,
          status: 'active'
        });

      if (positionError) {
        // Refund margin if position creation fails
        await supabase.rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_currency: 'USDT',
          p_amount: margin,
          p_operation: 'add'
        });
        return { success: false, message: 'Failed to create position: ' + positionError.message };
      }

      toast.success(`${side.toUpperCase()} position opened successfully!`);
      await Promise.all([fetchPositions(), refreshBalances()]);
      
      return { success: true, message: 'Position opened successfully' };
    } catch (error) {
      console.error('Error opening position:', error);
      return { success: false, message: 'Failed to open position: ' + (error as Error).message };
    }
  };

  const closePosition = async (positionId: string) => {
    if (!user) return { success: false, message: 'User not authenticated' };

    try {
      // Get the position details first
      const position = positions.find(p => p.id === positionId);
      if (!position) {
        return { success: false, message: 'Position not found' };
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

      if (updateError) return { success: false, message: updateError.message };

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
          return { success: false, message: balanceError.message };
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

      return { success: true, message: 'Position closed successfully' };
    } catch (error) {
      console.error('Error closing position:', error);
      return { success: false, message: 'Failed to close position: ' + (error as Error).message };
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

      setAllPositions(prev => prev.map(position => {
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
    allPositions,
    loading,
    openPosition,
    closePosition,
    refetch: fetchPositions
  };
};
