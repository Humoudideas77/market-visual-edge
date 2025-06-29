
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
  exit_price?: number;
}

export const usePerpetualTrades = (selectedPair: string) => {
  const { user } = useAuth();
  const { getBalance, executeTransaction, refreshBalances } = useWallet();
  const { prices } = useCryptoPrices();
  const [positions, setPositions] = useState<PerpetualPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const [baseAsset] = selectedPair.split('/');
  const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || 0;

  // Calculate accurate PnL for a position
  const calculatePnL = (position: PerpetualPosition, price: number) => {
    const priceDiff = price - position.entry_price;
    let pnl = 0;
    
    if (position.side === 'long') {
      pnl = priceDiff * position.size;
    } else {
      pnl = -priceDiff * position.size;
    }
    
    const pnlPercentage = position.margin > 0 ? (pnl / position.margin) * 100 : 0;
    
    return { pnl: Number(pnl.toFixed(8)), pnlPercentage: Number(pnlPercentage.toFixed(4)) };
  };

  // Load positions from database
  const loadPositions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('perpetual_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('pair', selectedPair)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPositions: PerpetualPosition[] = (data || []).map(pos => {
        const basePosition = {
          id: pos.id,
          user_id: pos.user_id,
          pair: pos.pair,
          side: pos.side as 'long' | 'short',
          size: Number(pos.size),
          entry_price: Number(pos.entry_price),
          leverage: Number(pos.leverage),
          margin: Number(pos.margin),
          liquidation_price: Number(pos.liquidation_price),
          status: pos.status as 'active' | 'closed',
          created_at: new Date(pos.created_at),
          closed_at: pos.closed_at ? new Date(pos.closed_at) : undefined,
          exit_price: pos.exit_price ? Number(pos.exit_price) : undefined,
          current_price: 0,
          pnl: 0,
          pnl_percentage: 0
        };

        if (pos.status === 'active') {
          const priceToUse = currentPrice > 0 ? currentPrice : basePosition.entry_price;
          const { pnl, pnlPercentage } = calculatePnL(basePosition, priceToUse);
          basePosition.current_price = priceToUse;
          basePosition.pnl = pnl;
          basePosition.pnl_percentage = pnlPercentage;
        } else {
          const exitPrice = basePosition.exit_price || basePosition.entry_price;
          const { pnl, pnlPercentage } = calculatePnL(basePosition, exitPrice);
          basePosition.current_price = exitPrice;
          basePosition.pnl = pnl;
          basePosition.pnl_percentage = pnlPercentage;
        }

        return basePosition;
      });

      setPositions(formattedPositions);
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  // Calculate liquidation price with proper precision
  const calculateLiquidationPrice = (entryPrice: number, side: 'long' | 'short', leverage: number): number => {
    const maintenanceMargin = 0.05; // 5% maintenance margin
    const leverageRatio = 1 / leverage;
    
    if (side === 'long') {
      return Number((entryPrice * (1 - leverageRatio + maintenanceMargin)).toFixed(8));
    } else {
      return Number((entryPrice * (1 + leverageRatio - maintenanceMargin)).toFixed(8));
    }
  };

  // Open a new position with strict balance validation
  const openPosition = async (
    side: 'long' | 'short',
    size: number,
    leverage: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!user || !currentPrice) {
      return { success: false, message: 'Invalid user or price data' };
    }

    // Precise calculations
    const notionalValue = Number((size * currentPrice).toFixed(8));
    const margin = Number((notionalValue / leverage).toFixed(8));
    const liquidationPrice = calculateLiquidationPrice(currentPrice, side, leverage);
    
    // Strict balance validation
    await refreshBalances();
    const usdtBalance = getBalance('USDT');
    
    if (!usdtBalance || usdtBalance.available < margin) {
      const shortfall = margin - (usdtBalance?.available || 0);
      return { 
        success: false, 
        message: `Insufficient USDT balance! You need $${margin.toFixed(2)} USDT margin but only have $${(usdtBalance?.available || 0).toFixed(2)} USDT available. Shortfall: $${shortfall.toFixed(2)} USDT.` 
      };
    }

    try {
      // Execute transaction with precise amounts
      const marginDeducted = await executeTransaction({
        type: 'trade_sell',
        currency: 'USDT',
        amount: margin
      });

      if (!marginDeducted) {
        return { success: false, message: 'Failed to deduct margin from balance' };
      }

      // Create position in database with precise values
      const { data, error } = await supabase
        .from('perpetual_positions')
        .insert({
          user_id: user.id,
          pair: selectedPair,
          side,
          size: size,
          entry_price: currentPrice,
          leverage: leverage,
          margin: margin,
          liquidation_price: liquidationPrice,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity with precise details
      await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'perpetual_position_opened',
        p_details: {
          pair: selectedPair,
          side,
          size,
          entry_price: currentPrice,
          leverage,
          margin: margin,
          liquidation_price: liquidationPrice
        }
      });

      await loadPositions();
      
      toast.success(`✅ ${side.toUpperCase()} position opened! Size: ${size} ${baseAsset}, Leverage: ${leverage}x, Margin: $${margin.toFixed(2)} USDT`);
      return { success: true, message: 'Position opened successfully' };

    } catch (error) {
      console.error('Error opening position:', error);
      return { success: false, message: 'Failed to open position' };
    }
  };

  // Close a position with accurate PnL calculation and balance update
  const closePosition = async (positionId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !currentPrice) {
      return { success: false, message: 'Invalid user or price data' };
    }

    const position = positions.find(p => p.id === positionId);
    if (!position) {
      return { success: false, message: 'Position not found' };
    }

    try {
      // Calculate precise PnL
      const { pnl } = calculatePnL(position, currentPrice);
      const totalReturn = Number((position.margin + pnl).toFixed(8));

      // Update position in database with precise exit data
      const { error: updateError } = await supabase
        .from('perpetual_positions')
        .update({
          status: 'closed',
          exit_price: currentPrice,
          closed_at: new Date().toISOString()
        })
        .eq('id', positionId);

      if (updateError) throw updateError;

      // Record precise PnL in database
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

      // Return margin + PnL to user's balance (even if negative)
      if (totalReturn > 0) {
        await executeTransaction({
          type: 'trade_buy',
          currency: 'USDT',
          amount: totalReturn
        });
      }

      // Log closing activity
      await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'perpetual_position_closed',
        p_details: {
          pair: position.pair,
          side: position.side,
          size: position.size,
          entry_price: position.entry_price,
          exit_price: currentPrice,
          pnl: pnl,
          margin_returned: totalReturn
        }
      });

      await loadPositions();
      await refreshBalances();
      
      const pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
      toast.success(`✅ Position closed! PnL: ${pnlText} USDT`);
      return { success: true, message: 'Position closed successfully' };

    } catch (error) {
      console.error('Error closing position:', error);
      return { success: false, message: 'Failed to close position' };
    }
  };

  // Update positions with current prices and calculate real-time PnL
  useEffect(() => {
    if (positions.length > 0 && currentPrice > 0) {
      setPositions(prev => prev.map(position => {
        if (position.status === 'closed') return position;

        const { pnl, pnlPercentage } = calculatePnL(position, currentPrice);
        
        return {
          ...position,
          current_price: currentPrice,
          pnl,
          pnl_percentage: pnlPercentage
        };
      }));
    }
  }, [currentPrice]);

  // Load positions on mount and when user/pair changes
  useEffect(() => {
    if (user) {
      loadPositions();
    } else {
      setPositions([]);
      setLoading(false);
    }
  }, [user, selectedPair]);

  // Set up real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (positions.length > 0 && currentPrice > 0) {
        loadPositions(); // Refresh positions to get latest data
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [positions.length, currentPrice]);

  return {
    positions: positions.filter(p => p.status === 'active'),
    allPositions: positions,
    loading,
    openPosition,
    closePosition,
    refreshPositions: loadPositions
  };
};
