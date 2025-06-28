
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';
import { useCryptoPrices, getPriceBySymbol } from './useCryptoPrices';
import { toast } from 'sonner';

export interface OptionTrade {
  id: string;
  user_id: string;
  pair: string;
  type: 'call' | 'put';
  strike_price: number;
  premium_paid: number;
  contracts: number;
  entry_price: number;
  current_price: number;
  expiry: string;
  expiry_timestamp: Date;
  status: 'active' | 'expired' | 'exercised';
  pnl: number;
  pnl_percentage: number;
  created_at: Date;
  closed_at?: Date;
}

export const useOptionTrades = (selectedPair: string) => {
  const { user } = useAuth();
  const { getBalance, executeTransaction } = useWallet();
  const { prices } = useCryptoPrices();
  const [optionTrades, setOptionTrades] = useState<OptionTrade[]>([]);
  const [loading, setLoading] = useState(false);

  const [baseAsset] = selectedPair.split('/');
  const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || 0;

  // Load option trades from localStorage
  const loadOptionTrades = () => {
    if (!user) return;

    try {
      const savedTrades = localStorage.getItem(`option_trades_${user.id}`);
      if (savedTrades) {
        const trades = JSON.parse(savedTrades).map((trade: any) => ({
          ...trade,
          created_at: new Date(trade.created_at),
          expiry_timestamp: new Date(trade.expiry_timestamp),
          closed_at: trade.closed_at ? new Date(trade.closed_at) : undefined
        }));
        setOptionTrades(trades);
      }
    } catch (error) {
      console.error('Error loading option trades:', error);
    }
  };

  // Save option trades to localStorage
  const saveOptionTrades = (trades: OptionTrade[]) => {
    if (user) {
      localStorage.setItem(`option_trades_${user.id}`, JSON.stringify(trades));
    }
  };

  // Open a new option trade
  const openOptionTrade = async (
    type: 'call' | 'put',
    strikePrice: number,
    premium: number,
    contracts: number,
    expiry: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user || !currentPrice) {
      return { success: false, message: 'Invalid user or price data' };
    }

    const totalCost = contracts * premium;
    const usdtBalance = getBalance('USDT');

    if (!usdtBalance || usdtBalance.available < totalCost) {
      return { 
        success: false, 
        message: `Insufficient balance! You need $${totalCost.toFixed(2)} USDT but only have $${usdtBalance?.available.toFixed(2) || 0} USDT available.` 
      };
    }

    try {
      // Deduct premium from balance
      const success = await executeTransaction({
        type: 'trade_sell',
        currency: 'USDT',
        amount: totalCost
      });

      if (!success) {
        return { success: false, message: 'Failed to deduct premium from balance' };
      }

      // Create expiry timestamp
      const expiryTimestamp = new Date();
      switch (expiry) {
        case '1H':
          expiryTimestamp.setHours(expiryTimestamp.getHours() + 1);
          break;
        case '4H':
          expiryTimestamp.setHours(expiryTimestamp.getHours() + 4);
          break;
        case '1D':
          expiryTimestamp.setDate(expiryTimestamp.getDate() + 1);
          break;
        case '7D':
          expiryTimestamp.setDate(expiryTimestamp.getDate() + 7);
          break;
      }

      // Create new option trade
      const newTrade: OptionTrade = {
        id: `option_${Date.now()}`,
        user_id: user.id,
        pair: selectedPair,
        type,
        strike_price: strikePrice,
        premium_paid: premium,
        contracts,
        entry_price: currentPrice,
        current_price: currentPrice,
        expiry,
        expiry_timestamp: expiryTimestamp,
        status: 'active',
        pnl: -totalCost, // Initial PnL is negative (premium paid)
        pnl_percentage: -100,
        created_at: new Date()
      };

      const updatedTrades = [newTrade, ...optionTrades];
      setOptionTrades(updatedTrades);
      saveOptionTrades(updatedTrades);
      
      toast.success(`✅ ${type.toUpperCase()} option opened! Premium paid: $${totalCost.toFixed(2)} USDT`);
      return { success: true, message: 'Option trade opened successfully' };

    } catch (error) {
      console.error('Error opening option trade:', error);
      return { success: false, message: 'Failed to open option trade' };
    }
  };

  // Close/Exercise an option trade
  const closeOptionTrade = async (tradeId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !currentPrice) {
      return { success: false, message: 'Invalid user or price data' };
    }

    const trade = optionTrades.find(t => t.id === tradeId);
    if (!trade || trade.status !== 'active') {
      return { success: false, message: 'Trade not found or already closed' };
    }

    try {
      // Calculate option value at current price
      let optionValue = 0;
      if (trade.type === 'call' && currentPrice > trade.strike_price) {
        optionValue = (currentPrice - trade.strike_price) * trade.contracts;
      } else if (trade.type === 'put' && currentPrice < trade.strike_price) {
        optionValue = (trade.strike_price - currentPrice) * trade.contracts;
      }

      // Add option value to user's balance if positive
      if (optionValue > 0) {
        await executeTransaction({
          type: 'trade_buy',
          currency: 'USDT',
          amount: optionValue
        });
      }

      // Update trade status
      const updatedTrades = optionTrades.map(t => {
        if (t.id === tradeId) {
          const totalPnL = optionValue - (t.premium_paid * t.contracts);
          return {
            ...t,
            status: 'exercised' as const,
            current_price: currentPrice,
            pnl: totalPnL,
            pnl_percentage: ((totalPnL / (t.premium_paid * t.contracts)) * 100),
            closed_at: new Date()
          };
        }
        return t;
      });

      setOptionTrades(updatedTrades);
      saveOptionTrades(updatedTrades);
      
      const netPnL = optionValue - (trade.premium_paid * trade.contracts);
      toast.success(`✅ Option exercised! Net P&L: ${netPnL >= 0 ? '+' : ''}$${netPnL.toFixed(2)} USDT`);
      return { success: true, message: 'Option trade closed successfully' };

    } catch (error) {
      console.error('Error closing option trade:', error);
      return { success: false, message: 'Failed to close option trade' };
    }
  };

  // Update active trades with current prices and check for expiry
  useEffect(() => {
    if (optionTrades.length > 0 && currentPrice > 0) {
      const now = new Date();
      const updatedTrades = optionTrades.map(trade => {
        if (trade.status !== 'active') return trade;

        // Check if option has expired
        if (now >= trade.expiry_timestamp) {
          // Calculate final option value
          let optionValue = 0;
          if (trade.type === 'call' && currentPrice > trade.strike_price) {
            optionValue = (currentPrice - trade.strike_price) * trade.contracts;
          } else if (trade.type === 'put' && currentPrice < trade.strike_price) {
            optionValue = (trade.strike_price - currentPrice) * trade.contracts;
          }

          const totalPnL = optionValue - (trade.premium_paid * trade.contracts);
          
          // Auto-exercise if profitable, otherwise expire worthless
          if (optionValue > 0) {
            executeTransaction({
              type: 'trade_buy',
              currency: 'USDT',
              amount: optionValue
            });
          }

          return {
            ...trade,
            status: 'expired' as const,
            current_price: currentPrice,
            pnl: totalPnL,
            pnl_percentage: ((totalPnL / (trade.premium_paid * trade.contracts)) * 100),
            closed_at: now
          };
        }

        // Update current price and PnL for active trades
        let optionValue = 0;
        if (trade.type === 'call' && currentPrice > trade.strike_price) {
          optionValue = (currentPrice - trade.strike_price) * trade.contracts;
        } else if (trade.type === 'put' && currentPrice < trade.strike_price) {
          optionValue = (trade.strike_price - currentPrice) * trade.contracts;
        }

        const totalPnL = optionValue - (trade.premium_paid * trade.contracts);

        return {
          ...trade,
          current_price: currentPrice,
          pnl: totalPnL,
          pnl_percentage: ((totalPnL / (trade.premium_paid * trade.contracts)) * 100)
        };
      });

      setOptionTrades(updatedTrades);
      saveOptionTrades(updatedTrades);
    }
  }, [currentPrice, optionTrades.length]);

  // Load trades on mount
  useEffect(() => {
    if (user) {
      loadOptionTrades();
    } else {
      setOptionTrades([]);
    }
  }, [user, selectedPair]);

  return {
    optionTrades: optionTrades.filter(t => t.pair === selectedPair),
    activeTrades: optionTrades.filter(t => t.pair === selectedPair && t.status === 'active'),
    closedTrades: optionTrades.filter(t => t.pair === selectedPair && t.status !== 'active'),
    loading,
    openOptionTrade,
    closeOptionTrade,
    refreshTrades: loadOptionTrades
  };
};
