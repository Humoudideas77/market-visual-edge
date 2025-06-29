import { useState, useEffect, useRef } from 'react';
import { useCryptoPrices, getPriceBySymbol } from './useCryptoPrices';
import { useBinanceData } from './useBinanceData';
import { useWallet } from './useWallet';
import { useAuth } from './useAuth';

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

// Updated OrderBookEntry interface to match usage
interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export const useTradingEngine = (selectedPair: string = 'BTC/USDT') => {
  const { user } = useAuth();
  const { prices } = useCryptoPrices();
  const { getBalance, executeTransaction } = useWallet();
  const { fetchOrderBook, orderBookData } = useBinanceData();
  
  const [buyOrders, setBuyOrders] = useState<OrderBookEntry[]>([]);
  const [sellOrders, setSellOrders] = useState<OrderBookEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [tradingPair, setTradingPair] = useState<TradingPair | null>(null);
  
  const orderBookUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    console.log(`[TradingEngine] Fetching real order book for ${selectedPair}`);

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
          console.log(`[TradingEngine] Updated order book: ${orderBook.bids.length} bids, ${orderBook.asks.length} asks`);
        }
      } catch (error) {
        console.error('[TradingEngine] Error fetching order book:', error);
      }
    };

    // Initial fetch
    updateOrderBook();

    // Clear existing interval
    if (orderBookUpdateIntervalRef.current) {
      clearInterval(orderBookUpdateIntervalRef.current);
    }

    // Update every 5 seconds with real data
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

  // Generate some realistic recent trades for demo purposes
  useEffect(() => {
    if (!tradingPair) return;

    const generateRecentTrades = () => {
      const trades: Trade[] = [];
      for (let i = 0; i < 20; i++) {
        const isBuy = Math.random() > 0.5;
        const price = tradingPair.currentPrice + (Math.random() - 0.5) * tradingPair.currentPrice * 0.002;
        const amount = Math.random() * 1.5 + 0.01;
        trades.push({
          id: `trade_${Date.now()}_${i}`,
          pair: selectedPair,
          side: isBuy ? 'buy' : 'sell',
          type: 'market',
          price: parseFloat(price.toFixed(8)),
          amount: parseFloat(amount.toFixed(8)),
          total: parseFloat((price * amount).toFixed(2)),
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

    const tradePrice = type === 'market' ? tradingPair.currentPrice : (price || tradingPair.currentPrice);
    const total = amount * tradePrice;

    // Check balances
    if (side === 'buy') {
      const usdtBalance = getBalance('USDT');
      if (!usdtBalance || usdtBalance.available < total) {
        return { success: false, message: 'Insufficient USDT balance' };
      }
    } else {
      const baseBalance = getBalance(tradingPair.baseAsset);
      if (!baseBalance || baseBalance.available < amount) {
        return { success: false, message: `Insufficient ${tradingPair.baseAsset} balance` };
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
      status: 'pending',
      timestamp: new Date()
    };

    try {
      // Execute wallet transactions
      if (side === 'buy') {
        // Deduct USDT and add base asset
        await executeTransaction({
          type: 'trade_sell',
          currency: 'USDT',
          amount: total
        });
        await executeTransaction({
          type: 'trade_buy',
          currency: tradingPair.baseAsset,
          amount: amount
        });
      } else {
        // Deduct base asset and add USDT
        await executeTransaction({
          type: 'trade_sell',
          currency: tradingPair.baseAsset,
          amount: amount
        });
        await executeTransaction({
          type: 'trade_buy',
          currency: 'USDT',
          amount: total
        });
      }

      const completedTrade = { ...trade, status: 'completed' as const };
      setUserTrades(prev => [completedTrade, ...prev]);

      // Save user trades to localStorage
      if (user) {
        const savedTrades = [...userTrades, completedTrade];
        localStorage.setItem(`user_trades_${user.id}`, JSON.stringify(savedTrades));
      }

      console.log(`[TradingEngine] User trade executed: ${side.toUpperCase()} ${amount} ${tradingPair.baseAsset} @ $${tradePrice}`);

      return { 
        success: true, 
        message: `${side.toUpperCase()} order executed successfully`, 
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
        console.log(`[TradingEngine] Loaded ${trades.length} user trades from localStorage`);
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
