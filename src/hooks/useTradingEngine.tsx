
import { useState, useEffect } from 'react';
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

  // Generate mock order book data with controlled updates
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

    // Initial generation
    generateOrderBook();
    generateRecentTrades();

    // Controlled updates every 8 seconds instead of constant updates
    const orderBookInterval = setInterval(() => {
      generateOrderBook();
    }, 8000);

    const tradesInterval = setInterval(() => {
      generateRecentTrades();
    }, 12000);

    return () => {
      clearInterval(orderBookInterval);
      clearInterval(tradesInterval);
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
