
import { useState, useEffect, useRef } from 'react';
import { useCryptoPrices, getPriceBySymbol } from './useCryptoPrices';
import { useBinanceData } from './useBinanceData';
import { useWallet } from './useWallet';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Trade {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price: number;
  amount: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: Date;
  fees?: number;
  net_amount?: number;
}

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  currentPrice: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export const useTradingEngine = (selectedPair: string = 'BTC/USDT') => {
  const { user } = useAuth();
  const { prices } = useCryptoPrices();
  const { getBalance, executeTransaction, refreshBalances } = useWallet();
  const { fetchOrderBook, orderBookData } = useBinanceData();
  
  const [buyOrders, setBuyOrders] = useState<OrderBookEntry[]>([]);
  const [sellOrders, setSellOrders] = useState<OrderBookEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [tradingPair, setTradingPair] = useState<TradingPair | null>(null);
  
  const orderBookUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trading fee rate (0.1%)
  const TRADING_FEE_RATE = 0.001;

  // Calculate trading fees
  const calculateFees = (total: number): number => {
    return Number((total * TRADING_FEE_RATE).toFixed(8));
  };

  // Update trading pair data from crypto prices
  useEffect(() => {
    const [baseAsset] = selectedPair.split('/');
    const cryptoData = getPriceBySymbol(prices, baseAsset);
    
    if (cryptoData) {
      setTradingPair({
        symbol: selectedPair,
        baseAsset: baseAsset,
        quoteAsset: 'USDT',
        currentPrice: cryptoData.current_price,
        change24h: cryptoData.price_change_24h,
        volume24h: cryptoData.total_volume,
        high24h: cryptoData.high_24h,
        low24h: cryptoData.low_24h,
      });
    }
  }, [selectedPair, prices]);

  // Fetch real order book data
  useEffect(() => {
    if (!tradingPair) return;

    const updateOrderBook = async () => {
      try {
        const orderBook = await fetchOrderBook(selectedPair);
        if (orderBook) {
          setBuyOrders(orderBook.bids.map(bid => ({
            price: bid.price,
            amount: bid.quantity,
            total: bid.total
          })));
          setSellOrders(orderBook.asks.map(ask => ({
            price: ask.price,
            amount: ask.quantity,
            total: ask.total
          })));
        }
      } catch (error) {
        console.error('[TradingEngine] Error fetching order book:', error);
      }
    };

    updateOrderBook();

    if (orderBookUpdateIntervalRef.current) {
      clearInterval(orderBookUpdateIntervalRef.current);
    }

    orderBookUpdateIntervalRef.current = setInterval(updateOrderBook, 5000);

    return () => {
      if (orderBookUpdateIntervalRef.current) {
        clearInterval(orderBookUpdateIntervalRef.current);
      }
    };
  }, [selectedPair, tradingPair, fetchOrderBook]);

  // Use real-time order book data when available
  useEffect(() => {
    const currentOrderBook = orderBookData.get(selectedPair);
    if (currentOrderBook) {
      setBuyOrders(currentOrderBook.bids.map(bid => ({
        price: bid.price,
        amount: bid.quantity,
        total: bid.total
      })));
      setSellOrders(currentOrderBook.asks.map(ask => ({
        price: ask.price,
        amount: ask.quantity,
        total: ask.total
      })));
    }
  }, [orderBookData, selectedPair]);

  // Generate realistic recent trades for demo purposes
  useEffect(() => {
    if (!tradingPair) return;

    const generateRecentTrades = () => {
      const trades: Trade[] = [];
      for (let i = 0; i < 20; i++) {
        const isBuy = Math.random() > 0.5;
        const price = tradingPair.currentPrice + (Math.random() - 0.5) * tradingPair.currentPrice * 0.002;
        const amount = Math.random() * 1.5 + 0.01;
        const total = price * amount;
        const fees = calculateFees(total);
        
        trades.push({
          id: `trade_${Date.now()}_${i}`,
          pair: selectedPair,
          side: isBuy ? 'buy' : 'sell',
          type: 'market',
          price: Number(price.toFixed(8)),
          amount: Number(amount.toFixed(8)),
          total: Number(total.toFixed(2)),
          fees: Number(fees.toFixed(8)),
          net_amount: Number((isBuy ? amount - (fees / price) : amount).toFixed(8)),
          status: 'completed',
          timestamp: new Date(Date.now() - Math.random() * 3600000)
        });
      }
      setRecentTrades(trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    };

    generateRecentTrades();
  }, [tradingPair, selectedPair]);

  const executeTrade = async (
    side: 'buy' | 'sell',
    type: 'market' | 'limit',
    amount: number,
    price?: number
  ): Promise<{ success: boolean; message: string; trade?: Trade }> => {
    if (!user || !tradingPair) {
      return { success: false, message: 'Please log in to trade' };
    }

    if (amount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }

    // Refresh balances before validation
    await refreshBalances();

    const tradePrice = type === 'market' ? tradingPair.currentPrice : (price || tradingPair.currentPrice);
    const total = Number((amount * tradePrice).toFixed(8));
    const fees = calculateFees(total);
    
    // Strict balance validation with precise calculations
    if (side === 'buy') {
      const totalCostWithFees = Number((total + fees).toFixed(8));
      const usdtBalance = getBalance('USDT');
      
      if (!usdtBalance || usdtBalance.available < totalCostWithFees) {
        const shortfall = totalCostWithFees - (usdtBalance?.available || 0);
        return { 
          success: false, 
          message: `Insufficient USDT balance! You need $${totalCostWithFees.toFixed(2)} USDT (including $${fees.toFixed(2)} fees) but only have $${(usdtBalance?.available || 0).toFixed(2)} USDT available. Shortfall: $${shortfall.toFixed(2)} USDT.` 
        };
      }
    } else {
      const baseBalance = getBalance(tradingPair.baseAsset);
      if (!baseBalance || baseBalance.available < amount) {
        const shortfall = amount - (baseBalance?.available || 0);
        return { 
          success: false, 
          message: `Insufficient ${tradingPair.baseAsset} balance! You need ${amount.toFixed(8)} ${tradingPair.baseAsset} but only have ${(baseBalance?.available || 0).toFixed(8)} ${tradingPair.baseAsset} available. Shortfall: ${shortfall.toFixed(8)} ${tradingPair.baseAsset}.` 
        };
      }
    }

    const trade: Trade = {
      id: `trade_${Date.now()}`,
      pair: selectedPair,
      side,
      type,
      price: tradePrice,
      amount,
      total,
      fees,
      net_amount: side === 'buy' ? Number((amount - (fees / tradePrice)).toFixed(8)) : amount,
      status: 'pending',
      timestamp: new Date()
    };

    try {
      // Execute wallet transactions with precise amounts
      if (side === 'buy') {
        // Deduct USDT (including fees) and add base asset (net amount)
        const totalCostWithFees = Number((total + fees).toFixed(8));
        const netBaseAmount = Number((amount - (fees / tradePrice)).toFixed(8));
        
        const usdtDeducted = await executeTransaction({
          type: 'trade_sell',
          currency: 'USDT',
          amount: totalCostWithFees
        });
        
        if (!usdtDeducted) {
          return { success: false, message: 'Failed to deduct USDT from balance' };
        }
        
        await executeTransaction({
          type: 'trade_buy',
          currency: tradingPair.baseAsset,
          amount: netBaseAmount
        });
      } else {
        // Deduct base asset and add USDT (minus fees)
        const netUsdtAmount = Number((total - fees).toFixed(8));
        
        const baseDeducted = await executeTransaction({
          type: 'trade_sell',
          currency: tradingPair.baseAsset,
          amount: amount
        });
        
        if (!baseDeducted) {
          return { success: false, message: `Failed to deduct ${tradingPair.baseAsset} from balance` };
        }
        
        await executeTransaction({
          type: 'trade_buy',
          currency: 'USDT',
          amount: netUsdtAmount
        });
      }

      const completedTrade = { ...trade, status: 'completed' as const };
      setUserTrades(prev => [completedTrade, ...prev]);

      // Log trading activity with precise details
      await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'spot_trade_executed',
        p_details: {
          pair: selectedPair,
          side,
          type,
          amount: amount,
          price: tradePrice,
          total: total,
          fees: fees,
          net_amount: trade.net_amount
        }
      });

      // Save to localStorage
      if (user) {
        const savedTrades = [...userTrades, completedTrade];
        localStorage.setItem(`user_trades_${user.id}`, JSON.stringify(savedTrades));
      }

      // Refresh balances to show updated amounts
      await refreshBalances();

      console.log(`[TradingEngine] Trade executed: ${side.toUpperCase()} ${amount} ${tradingPair.baseAsset} @ $${tradePrice.toFixed(2)}, Fees: $${fees.toFixed(2)}`);

      return { 
        success: true, 
        message: `${side.toUpperCase()} order executed successfully! Net amount: ${trade.net_amount?.toFixed(8)} ${side === 'buy' ? tradingPair.baseAsset : 'USDT'}`, 
        trade: completedTrade 
      };
    } catch (error) {
      console.error('[TradingEngine] Trade execution failed:', error);
      return { success: false, message: 'Trade execution failed' };
    }
  };

  // Load user trades on component mount
  useEffect(() => {
    if (user) {
      const savedTrades = localStorage.getItem(`user_trades_${user.id}`);
      if (savedTrades) {
        const trades = JSON.parse(savedTrades).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
        setUserTrades(trades);
      }
    }
  }, [user]);

  return {
    tradingPair,
    buyOrders,
    sellOrders,
    recentTrades,
    userTrades,
    executeTrade,
  };
};
