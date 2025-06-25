
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';
import { supabase } from '@/integrations/supabase/client';
import { useCryptoPrices, getPriceBySymbol } from './useCryptoPrices';
import { toast } from 'sonner';

export interface PerpetualPosition {
  id: string;
  user_id: string;
  pair: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_percentage: number;
  leverage: number;
  margin: number;
  liquidation_price: number;
  status: 'active' | 'closed';
  created_at: Date;
  closed_at?: Date;
}

interface DatabasePosition {
  id: string;
  user_id: string;
  pair: string;
  side: string;
  size: string;
  entry_price: string;
  exit_price: string | null;
  leverage: string;
  margin: string;
  liquidation_price: string;
  status: string;
  created_at: string;
  closed_at: string | null;
}

export const usePerpetualTrades = (selectedPair: string) => {
  const { user } = useAuth();
  const { getBalance, executeTransaction } = useWallet();
  const { prices } = useCryptoPrices();
  const [positions, setPositions] = useState<PerpetualPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const [baseAsset] = selectedPair.split('/');
  const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || 0;

  // Load positions from database
  const loadPositions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('perpetual_positions' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('pair', selectedPair)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPositions: PerpetualPosition[] = (data as DatabasePosition[] || []).map(pos => ({
        id: pos.id,
        user_id: pos.user_id,
        pair: pos.pair,
        side: pos.side as 'long' | 'short',
        size: Number(pos.size),
        entry_price: Number(pos.entry_price),
        current_price: pos.status === 'active' ? currentPrice : Number(pos.exit_price || pos.entry_price),
        pnl: 0, // Will be calculated below
        pnl_percentage: 0, // Will be calculated below
        leverage: Number(pos.leverage),
        margin: Number(pos.margin),
        liquidation_price: Number(pos.liquidation_price),
        status: pos.status as 'active' | 'closed',
        created_at: new Date(pos.created_at),
        closed_at: pos.closed_at ? new Date(pos.closed_at) : undefined
      }));

      setPositions(formattedPositions);
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  // Calculate liquidation price
  const calculateLiquidationPrice = (entryPrice: number, side: 'long' | 'short', leverage: number): number => {
    const liquidationMargin = 0.05; // 5% liquidation margin
    if (side === 'long') {
      return entryPrice * (1 - (1 / leverage) + liquidationMargin);
    } else {
      return entryPrice * (1 + (1 / leverage) - liquidationMargin);
    }
  };

  // Open a new position
  const openPosition = async (
    side: 'long' | 'short',
    size: number,
    leverage: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!user || !currentPrice) {
      return { success: false, message: 'Invalid user or price data' };
    }

    const margin = (size * currentPrice) / leverage;
    const usdtBalance = getBalance('USDT');

    if (!usdtBalance || usdtBalance.available < margin) {
      return { 
        success: false, 
        message: `Insufficient balance! You need $${margin.toFixed(2)} USDT margin but only have $${usdtBalance?.available.toFixed(2) || 0} USDT available.` 
      };
    }

    try {
      // Deduct margin from balance
      const success = await executeTransaction({
        type: 'trade_sell',
        currency: 'USDT',
        amount: margin
      });

      if (!success) {
        return { success: false, message: 'Failed to deduct margin from balance' };
      }

      // Create position in database
      const { data, error } = await supabase
        .from('perpetual_positions' as any)
        .insert({
          user_id: user.id,
          pair: selectedPair,
          side,
          size,
          entry_price: currentPrice,
          leverage,
          margin,
          liquidation_price: calculateLiquidationPrice(currentPrice, side, leverage),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Reload positions
      await loadPositions();
      
      toast.success(`✅ ${side.toUpperCase()} position opened! Size: ${size} ${baseAsset}, Leverage: ${leverage}x`);
      return { success: true, message: 'Position opened successfully' };

    } catch (error) {
      console.error('Error opening position:', error);
      return { success: false, message: 'Failed to open position' };
    }
  };

  // Close a position
  const closePosition = async (positionId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !currentPrice) {
      return { success: false, message: 'Invalid user or price data' };
    }

    const position = positions.find(p => p.id === positionId);
    if (!position) {
      return { success: false, message: 'Position not found' };
    }

    try {
      // Calculate PnL
      const priceDiff = currentPrice - position.entry_price;
      const pnl = position.side === 'long' 
        ? priceDiff * position.size
        : -priceDiff * position.size;

      // Update position in database
      const { error: updateError } = await supabase
        .from('perpetual_positions' as any)
        .update({
          status: 'closed',
          exit_price: currentPrice,
          closed_at: new Date().toISOString()
        })
        .eq('id', positionId);

      if (updateError) throw updateError;

      // Record PnL in database
      const pnlResult = await supabase.rpc('record_trade_pnl', {
        p_user_id: user.id,
        p_trade_pair: position.pair,
        p_trade_side: position.side,
        p_entry_price: position.entry_price,
        p_exit_price: currentPrice,
        p_trade_size: position.size,
        p_currency: 'USDT'
      });

      if (pnlResult.error) {
        console.error('Error recording PnL:', pnlResult.error);
      }

      // Return margin + PnL to user's balance
      const totalReturn = position.margin + pnl;
      
      if (totalReturn > 0) {
        await executeTransaction({
          type: 'trade_buy',
          currency: 'USDT',
          amount: totalReturn
        });
      }

      // Reload positions
      await loadPositions();
      
      toast.success(`✅ Position closed! PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} USDT`);
      return { success: true, message: 'Position closed successfully' };

    } catch (error) {
      console.error('Error closing position:', error);
      return { success: false, message: 'Failed to close position' };
    }
  };

  // Update positions with current prices and calculate PnL
  useEffect(() => {
    if (positions.length > 0 && currentPrice > 0) {
      setPositions(prev => prev.map(position => {
        if (position.status === 'closed') return position;

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
  }, [currentPrice, positions.length]);

  // Load positions on mount and when user/pair changes
  useEffect(() => {
    if (user) {
      loadPositions();
    } else {
      setPositions([]);
      setLoading(false);
    }
  }, [user, selectedPair]);

  return {
    positions: positions.filter(p => p.status === 'active'),
    allPositions: positions,
    loading,
    openPosition,
    closePosition,
    refreshPositions: loadPositions
  };
};
