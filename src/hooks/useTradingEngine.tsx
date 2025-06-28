import { useState, useEffect, useRef } from 'react';
import { useCryptoPrices, getPriceBySymbol } from './useCryptoPrices';
import { useWallet } from './useWallet';
import { useAuth } from './useAuth';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

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

export const useTradingEngine = (selectedPair: string = 'BTC/USDT') => {
  const { user } = useAuth();
  const { prices } = useCryptoPrices();
  const { getBalance, executeTransaction } = useWallet();
  const [buyOrders, setBuyOrders] = useState<OrderBookEntry[]>([]);
  const [sellOrders, setSellOrders] = useState<OrderBookEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [tradingPair, setTradingPair] = useState<TradingPair | null>(null);
  
  // Refs to manage intervals
  const orderBookIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tradesIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Generate realistic order book with controlled updates
  useEffect(() => {
    if (!tradingPair) return;

    const generateOrderBook = () => {
      const currentPrice = tradingPair.currentPrice;
      const spread = currentPrice * 0.001; // 0.1% spread

      // Generate buy orders (below current price)
      const buyOrdersData: OrderBookEntry[] = [];
      for (let i = 0; i < 10; i++) {
        const price = currentPrice - spread - (i * currentPrice * 0.0005);
        const amount = Math.random() * 2 + 0.1;
        buyOrdersData.push({
          price: parseFloat(price.toFixed(8)),
          amount: parseFloat(amount.toFixed(8)),
          total: parseFloat((price * amount).toFixed(2))
        });
      }

      // Generate sell orders (above current price)
      const sellOrdersData: OrderBookEntry[] = [];
      for (let i = 0; i < 10; i++) {
        const price = currentPrice + spread + (i * currentPrice * 0.0005);
        const amount = Math.random() * 2 + 0.1;
        sellOrdersData.push({
          price: parseFloat(price.toFixed(8)),
          amount: parseFloat(amount.toFixed(8)),
          total: parseFloat((price * amount).toFixed(2))
        });
      }

      setBuyOrders(buyOrdersData);
      setSellOrders(sellOrdersData);
    };

    const generateRecentTrades = () => {
      const trades: Trade[] = [];
      for (let i = 0; i < 20; i++) {
        const isBuy = Math.random() > 0.5;
        const price = tradingPair.currentPrice + (Math.random() - 0.5) * tradingPair.currentPrice * 0.002;
        const amount = Math.random() * 1 + 0.01;
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

    // Clear existing intervals
    if (orderBookIntervalRef.current) {
      clearInterval(orderBookIntervalRef.current);
    }
    if (tradesIntervalRef.current) {
      clearInterval(tradesIntervalRef.current);
    }

    // Initial generation
    generateOrderBook();
    generateRecentTrades();

    // Professional-grade update intervals (similar to Binance)
    // Order book updates every 3-5 seconds for stability
    orderBookIntervalRef.current = setInterval(() => {
      // Only update a few orders at a time to prevent flickering
      setBuyOrders(prev => {
        const newOrders = [...prev];
        // Update 2-3 random orders
        const indicesToUpdate = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < indicesToUpdate; i++) {
          const randomIndex = Math.floor(Math.random() * newOrders.length);
          const order = newOrders[randomIndex];
          const priceVariation = (Math.random() - 0.5) * 0.0001;
          const amountVariation = (Math.random() - 0.5) * 0.1;
          
          newOrders[randomIndex] = {
            ...order,
            price: parseFloat((order.price * (1 + priceVariation)).toFixed(8)),
            amount: Math.max(0.01, parseFloat((order.amount + amountVariation).toFixed(8))),
            total: parseFloat(((order.price * (1 + priceVariation)) * Math.max(0.01, order.amount + amountVariation)).toFixed(2))
          };
        }
        return newOrders;
      });

      setSellOrders(prev => {
        const newOrders = [...prev];
        // Update 2-3 random orders
        const indicesToUpdate = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < indicesToUpdate; i++) {
          const randomIndex = Math.floor(Math.random() * newOrders.length);
          const order = newOrders[randomIndex];
          const priceVariation = (Math.random() - 0.5) * 0.0001;
          const amountVariation = (Math.random() - 0.5) * 0.1;
          
          newOrders[randomIndex] = {
            ...order,
            price: parseFloat((order.price * (1 + priceVariation)).toFixed(8)),
            amount: Math.max(0.01, parseFloat((order.amount + amountVariation).toFixed(8))),
            total: parseFloat(((order.price * (1 + priceVariation)) * Math.max(0.01, order.amount + amountVariation)).toFixed(2))
          };
        }
        return newOrders;
      });
    }, 4000); // Update every 4 seconds

    // Trade history updates every 8-15 seconds for realism
    tradesIntervalRef.current = setInterval(() => {
      // Add 1-2 new trades occasionally
      const shouldAddTrade = Math.random() > 0.6;
      if (shouldAddTrade) {
        setRecentTrades(prev => {
          const newTrades = [...prev];
          const isBuy = Math.random() > 0.5;
          const price = tradingPair.currentPrice + (Math.random() - 0.5) * tradingPair.currentPrice * 0.001;
          const amount = Math.random() * 0.5 + 0.01;
          
          const newTrade: Trade = {
            id: `trade_${Date.now()}_${Math.random()}`,
            pair: selectedPair,
            side: isBuy ? 'buy' : 'sell',
            type: 'market',
            price: parseFloat(price.toFixed(8)),
            amount: parseFloat(amount.toFixed(8)),
            total: parseFloat((price * amount).toFixed(2)),
            status: 'completed',
            timestamp: new Date()
          };
          
          // Keep only the last 20 trades
          return [newTrade, ...newTrades.slice(0, 19)];
        });
      }
    }, 12000); // Update every 12 seconds

    return () => {
      if (orderBookIntervalRef.current) {
        clearInterval(orderBookIntervalRef.current);
      }
      if (tradesIntervalRef.current) {
        clearInterval(tradesIntervalRef.current);
      }
    };

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

      return { 
        success: true, 
        message: `${side.toUpperCase()} order executed successfully`, 
        trade: completedTrade 
      };
    } catch (error) {
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
