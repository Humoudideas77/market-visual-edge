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
  
  // Refs to manage intervals and throttling
  const orderBookIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tradesIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastOrderBookUpdateRef = useRef<number>(0);
  const lastTradesUpdateRef = useRef<number>(0);

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

  // Professional-grade order book and trades with controlled updates
  useEffect(() => {
    if (!tradingPair) return;

    const generateOrderBook = () => {
      const currentPrice = tradingPair.currentPrice;
      const spread = currentPrice * 0.0008; // 0.08% spread - tighter like real exchanges

      // Generate buy orders (below current price)
      const buyOrdersData: OrderBookEntry[] = [];
      for (let i = 0; i < 15; i++) {
        const price = currentPrice - spread - (i * currentPrice * 0.0003);
        const amount = Math.random() * 1.5 + 0.05;
        buyOrdersData.push({
          price: parseFloat(price.toFixed(8)),
          amount: parseFloat(amount.toFixed(8)),
          total: parseFloat((price * amount).toFixed(2))
        });
      }

      // Generate sell orders (above current price)
      const sellOrdersData: OrderBookEntry[] = [];
      for (let i = 0; i < 15; i++) {
        const price = currentPrice + spread + (i * currentPrice * 0.0003);
        const amount = Math.random() * 1.5 + 0.05;
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
      for (let i = 0; i < 25; i++) {
        const isBuy = Math.random() > 0.5;
        const price = tradingPair.currentPrice + (Math.random() - 0.5) * tradingPair.currentPrice * 0.001;
        const amount = Math.random() * 0.8 + 0.01;
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
    lastOrderBookUpdateRef.current = Date.now();
    lastTradesUpdateRef.current = Date.now();

    // Professional order book updates - much more stable
    orderBookIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastOrderBookUpdateRef.current;
      
      // Throttle updates to every 6 seconds minimum
      if (timeSinceLastUpdate < 6000) return;
      
      // Only update 1-2 orders at a time to prevent flickering
      setBuyOrders(prev => {
        const newOrders = [...prev];
        const updateCount = Math.random() > 0.7 ? 2 : 1; // Usually update 1, sometimes 2
        
        for (let i = 0; i < updateCount; i++) {
          const randomIndex = Math.floor(Math.random() * Math.min(newOrders.length, 8)); // Only update top 8 orders
          const order = newOrders[randomIndex];
          
          // Very small price variation - like real order books
          const priceVariation = (Math.random() - 0.5) * 0.00005;
          const amountVariation = (Math.random() - 0.5) * 0.05;
          
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
        const updateCount = Math.random() > 0.7 ? 2 : 1;
        
        for (let i = 0; i < updateCount; i++) {
          const randomIndex = Math.floor(Math.random() * Math.min(newOrders.length, 8));
          const order = newOrders[randomIndex];
          
          const priceVariation = (Math.random() - 0.5) * 0.00005;
          const amountVariation = (Math.random() - 0.5) * 0.05;
          
          newOrders[randomIndex] = {
            ...order,
            price: parseFloat((order.price * (1 + priceVariation)).toFixed(8)),
            amount: Math.max(0.01, parseFloat((order.amount + amountVariation).toFixed(8))),
            total: parseFloat(((order.price * (1 + priceVariation)) * Math.max(0.01, order.amount + amountVariation)).toFixed(2))
          };
        }
        return newOrders;
      });
      
      lastOrderBookUpdateRef.current = now;
    }, 8000); // Check every 8 seconds, but throttle to 6 seconds minimum

    // Controlled trade history updates
    tradesIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastTradesUpdateRef.current;
      
      // Throttle trade updates to every 15 seconds minimum
      if (timeSinceLastUpdate < 15000) return;
      
      // Only occasionally add new trades (30% chance)
      const shouldAddTrade = Math.random() > 0.7;
      if (shouldAddTrade) {
        setRecentTrades(prev => {
          const newTrades = [...prev];
          const isBuy = Math.random() > 0.5;
          const price = tradingPair.currentPrice + (Math.random() - 0.5) * tradingPair.currentPrice * 0.0008;
          const amount = Math.random() * 0.3 + 0.01;
          
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
          
          // Keep only the last 25 trades
          return [newTrade, ...newTrades.slice(0, 24)];
        });
        
        lastTradesUpdateRef.current = now;
      }
    }, 18000); // Check every 18 seconds

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
