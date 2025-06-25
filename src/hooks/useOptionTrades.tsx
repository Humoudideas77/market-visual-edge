
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';
import { useCryptoPrices, getPriceBySymbol } from './useCryptoPrices';
import { toast } from 'sonner';

export interface OptionTrade {
  id: string;
  userId: string;
  contractId: string;
  type: 'call' | 'put';
  strikePrice: number;
  premium: number;
  contracts: number;
  totalCost: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  status: 'active' | 'expired' | 'closed';
  openTime: Date;
  expiryTime: Date;
  baseAsset: string;
  isInMoney: boolean;
}

interface UseOptionTradesReturn {
  activeTrades: OptionTrade[];
  closedTrades: OptionTrade[];
  openTrade: (contractData: {
    type: 'call' | 'put';
    strikePrice: number;
    premium: number;
    contracts: number;
    expiryMinutes: number;
    baseAsset: string;
  }) => Promise<{ success: boolean; message: string; trade?: OptionTrade }>;
  closeTrade: (tradeId: string) => Promise<{ success: boolean; message: string; pnl: number }>;
  updateTradePrices: () => void;
  getTotalPnL: () => number;
}

export const useOptionTrades = (): UseOptionTradesReturn => {
  const { user } = useAuth();
  const { prices } = useCryptoPrices();
  const { getBalance, executeTransaction } = useWallet();
  const [activeTrades, setActiveTrades] = useState<OptionTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<OptionTrade[]>([]);

  // Load trades from localStorage on component mount
  useEffect(() => {
    if (user) {
      const savedActiveTrades = localStorage.getItem(`option_trades_active_${user.id}`);
      const savedClosedTrades = localStorage.getItem(`option_trades_closed_${user.id}`);
      
      if (savedActiveTrades) {
        const trades = JSON.parse(savedActiveTrades).map((t: any) => ({
          ...t,
          openTime: new Date(t.openTime),
          expiryTime: new Date(t.expiryTime)
        }));
        setActiveTrades(trades);
      }
      
      if (savedClosedTrades) {
        const trades = JSON.parse(savedClosedTrades).map((t: any) => ({
          ...t,
          openTime: new Date(t.openTime),
          expiryTime: new Date(t.expiryTime)
        }));
        setClosedTrades(trades);
      }
    }
  }, [user]);

  // Save trades to localStorage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`option_trades_active_${user.id}`, JSON.stringify(activeTrades));
    }
  }, [activeTrades, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`option_trades_closed_${user.id}`, JSON.stringify(closedTrades));
    }
  }, [closedTrades, user]);

  // Update trade prices and check for expired trades
  const updateTradePrices = () => {
    if (!prices.length) return;

    setActiveTrades(prevTrades => {
      const updatedTrades = prevTrades.map(trade => {
        const cryptoData = getPriceBySymbol(prices, trade.baseAsset);
        if (!cryptoData) return trade;

        const currentPrice = cryptoData.current_price;
        const now = new Date();
        
        // Check if trade has expired
        if (now >= trade.expiryTime) {
          // Calculate final PnL
          const finalPnL = calculateOptionPnL(trade, currentPrice);
          const expiredTrade = {
            ...trade,
            currentPrice,
            pnl: finalPnL,
            status: 'expired' as const
          };
          
          // Move to closed trades
          setClosedTrades(prev => [expiredTrade, ...prev]);
          
          // Execute payout if in the money
          if (finalPnL > 0) {
            executeTransaction({
              type: 'trade_buy',
              currency: 'USDT',
              amount: finalPnL
            }).then(() => {
              toast.success(`Option expired in the money! Payout: $${finalPnL.toFixed(2)} USDT`);
            }).catch(() => {
              toast.error('Failed to process option payout');
            });
          } else {
            toast.info(`Option expired out of the money. Loss: $${Math.abs(finalPnL).toFixed(2)} USDT`);
          }
          
          return null; // Remove from active trades
        }

        // Update current price and PnL
        const pnl = calculateOptionPnL(trade, currentPrice);
        const isInMoney = trade.type === 'call' 
          ? currentPrice > trade.strikePrice 
          : currentPrice < trade.strikePrice;

        return {
          ...trade,
          currentPrice,
          pnl,
          isInMoney
        };
      }).filter(Boolean) as OptionTrade[];

      return updatedTrades;
    });
  };

  // Calculate option P&L
  const calculateOptionPnL = (trade: OptionTrade, currentPrice: number): number => {
    const intrinsicValue = trade.type === 'call'
      ? Math.max(0, currentPrice - trade.strikePrice)
      : Math.max(0, trade.strikePrice - currentPrice);
    
    const totalValue = intrinsicValue * trade.contracts;
    return totalValue - trade.totalCost;
  };

  // Open a new option trade
  const openTrade = async (contractData: {
    type: 'call' | 'put';
    strikePrice: number;
    premium: number;
    contracts: number;
    expiryMinutes: number;
    baseAsset: string;
  }): Promise<{ success: boolean; message: string; trade?: OptionTrade }> => {
    if (!user) {
      return { success: false, message: 'Please log in to trade options' };
    }

    const totalCost = contractData.premium * contractData.contracts;
    const usdtBalance = getBalance('USDT');

    if (!usdtBalance || usdtBalance.available < totalCost) {
      return { 
        success: false, 
        message: `Insufficient balance! Need $${totalCost.toFixed(2)} USDT` 
      };
    }

    const cryptoData = getPriceBySymbol(prices, contractData.baseAsset);
    if (!cryptoData) {
      return { success: false, message: 'Unable to get current price' };
    }

    try {
      // Deduct premium from balance
      await executeTransaction({
        type: 'trade_sell',
        currency: 'USDT',
        amount: totalCost
      });

      const now = new Date();
      const expiryTime = new Date(now.getTime() + contractData.expiryMinutes * 60 * 1000);

      const newTrade: OptionTrade = {
        id: `option_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: user.id,
        contractId: `${contractData.type}_${contractData.strikePrice}_${contractData.expiryMinutes}`,
        type: contractData.type,
        strikePrice: contractData.strikePrice,
        premium: contractData.premium,
        contracts: contractData.contracts,
        totalCost,
        openPrice: cryptoData.current_price,
        currentPrice: cryptoData.current_price,
        pnl: -totalCost, // Initial PnL is negative (premium paid)
        status: 'active',
        openTime: now,
        expiryTime,
        baseAsset: contractData.baseAsset,
        isInMoney: false
      };

      setActiveTrades(prev => [newTrade, ...prev]);

      return {
        success: true,
        message: `${contractData.type.toUpperCase()} option opened successfully!`,
        trade: newTrade
      };
    } catch (error) {
      console.error('Option trade error:', error);
      return { success: false, message: 'Failed to open option trade' };
    }
  };

  // Close an active trade
  const closeTrade = async (tradeId: string): Promise<{ success: boolean; message: string; pnl: number }> => {
    const trade = activeTrades.find(t => t.id === tradeId);
    if (!trade) {
      return { success: false, message: 'Trade not found', pnl: 0 };
    }

    const finalPnL = trade.pnl;
    const closedTrade = { ...trade, status: 'closed' as const };

    try {
      // If trade is profitable, add winnings to balance
      if (finalPnL > 0) {
        await executeTransaction({
          type: 'trade_buy',
          currency: 'USDT',
          amount: finalPnL + trade.totalCost // Return premium + profit
        });
      }

      // Move to closed trades
      setClosedTrades(prev => [closedTrade, ...prev]);
      
      // Remove from active trades
      setActiveTrades(prev => prev.filter(t => t.id !== tradeId));

      const message = finalPnL > 0 
        ? `Trade closed with profit: $${finalPnL.toFixed(2)} USDT`
        : `Trade closed with loss: $${Math.abs(finalPnL).toFixed(2)} USDT`;

      return { success: true, message, pnl: finalPnL };
    } catch (error) {
      console.error('Close trade error:', error);
      return { success: false, message: 'Failed to close trade', pnl: 0 };
    }
  };

  // Get total PnL across all active trades
  const getTotalPnL = (): number => {
    return activeTrades.reduce((total, trade) => total + trade.pnl, 0);
  };

  // Update prices periodically
  useEffect(() => {
    const interval = setInterval(updateTradePrices, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [prices]);

  // Initial price update
  useEffect(() => {
    updateTradePrices();
  }, [prices]);

  return {
    activeTrades,
    closedTrades,
    openTrade,
    closeTrade,
    updateTradePrices,
    getTotalPnL
  };
};
