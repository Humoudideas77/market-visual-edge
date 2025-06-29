import { useState, useEffect, useRef, useCallback } from 'react';

export interface CandlestickData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdateId: number;
}

interface BinanceKlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

// Map trading pairs to Binance symbols
const PAIR_TO_BINANCE_SYMBOL: Record<string, string> = {
  'BTC/USDT': 'BTCUSDT',
  'ETH/USDT': 'ETHUSDT',
  'BNB/USDT': 'BNBUSDT',
  'ADA/USDT': 'ADAUSDT',
  'SOL/USDT': 'SOLUSDT',
  'DOT/USDT': 'DOTUSDT',
  'MATIC/USDT': 'MATICUSDT',
  'AVAX/USDT': 'AVAXUSDT',
  'LINK/USDT': 'LINKUSDT',
  'UNI/USDT': 'UNIUSDT'
};

// Map timeframes to Binance intervals
const TIMEFRAME_TO_BINANCE: Record<string, string> = {
  '1s': '1s',
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w'
};

export const useBinanceData = () => {
  const [candleData, setCandleData] = useState<Map<string, CandlestickData[]>>(new Map());
  const [orderBookData, setOrderBookData] = useState<Map<string, OrderBookData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedSymbols = useRef<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch historical candlestick data
  const fetchHistoricalData = useCallback(async (
    pair: string, 
    timeframe: string, 
    limit: number = 100
  ): Promise<CandlestickData[]> => {
    const binanceSymbol = PAIR_TO_BINANCE_SYMBOL[pair];
    const binanceInterval = TIMEFRAME_TO_BINANCE[timeframe];
    
    if (!binanceSymbol || !binanceInterval) {
      console.warn(`Unsupported pair or timeframe: ${pair} ${timeframe}`);
      return [];
    }

    try {
      const response = await fetch(
        `${BINANCE_BASE_URL}/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: BinanceKlineData[] = await response.json();
      
      return data.map((kline, index) => {
        const timestamp = kline.openTime;
        const date = new Date(timestamp);
        
        return {
          time: timeframe === '1s' || timeframe === '1m' ? 
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
            timeframe === '5m' || timeframe === '15m' || timeframe === '1h' ?
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
            date.toLocaleDateString([], { month: 'short', day: '2-digit' }),
          timestamp,
          open: parseFloat(kline.open),
          high: parseFloat(kline.high),
          low: parseFloat(kline.low),
          close: parseFloat(kline.close),
          volume: parseFloat(kline.volume)
        };
      });
    } catch (error) {
      console.error(`Error fetching historical data for ${pair}:`, error);
      setError(`Failed to fetch data for ${pair}`);
      return [];
    }
  }, []);

  // Fetch order book data
  const fetchOrderBook = useCallback(async (pair: string): Promise<OrderBookData | null> => {
    const binanceSymbol = PAIR_TO_BINANCE_SYMBOL[pair];
    
    if (!binanceSymbol) {
      console.warn(`Unsupported pair: ${pair}`);
      return null;
    }

    try {
      const response = await fetch(
        `${BINANCE_BASE_URL}/depth?symbol=${binanceSymbol}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const bids: OrderBookEntry[] = data.bids.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        total: parseFloat(price) * parseFloat(quantity)
      }));
      
      const asks: OrderBookEntry[] = data.asks.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        total: parseFloat(price) * parseFloat(quantity)
      }));
      
      return {
        bids: bids.slice(0, 10),
        asks: asks.slice(0, 10),
        lastUpdateId: data.lastUpdateId
      };
    } catch (error) {
      console.error(`Error fetching order book for ${pair}:`, error);
      setError(`Failed to fetch order book for ${pair}`);
      return null;
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(BINANCE_WS_URL);
      
      wsRef.current.onopen = () => {
        console.log('[BinanceData] WebSocket connected');
        setIsConnected(true);
        setError(null);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.e === 'kline') {
            // Handle kline updates
            const kline = data.k;
            const symbol = kline.s;
            const pair = Object.keys(PAIR_TO_BINANCE_SYMBOL).find(
              key => PAIR_TO_BINANCE_SYMBOL[key] === symbol
            );
            
            if (pair) {
              const newCandle: CandlestickData = {
                time: new Date(kline.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: kline.t,
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
                volume: parseFloat(kline.v)
              };
              
              setCandleData(prev => {
                const key = `${pair}_${data.k.i}`;
                const existing = prev.get(key) || [];
                const updated = [...existing];
                
                // Update last candle if it's the same timestamp, otherwise add new
                if (updated.length > 0 && updated[updated.length - 1].timestamp === newCandle.timestamp) {
                  updated[updated.length - 1] = newCandle;
                } else {
                  updated.push(newCandle);
                  // Keep only last 100 candles
                  if (updated.length > 100) {
                    updated.shift();
                  }
                }
                
                const newMap = new Map(prev);
                newMap.set(key, updated);
                return newMap;
              });
            }
          }
        } catch (error) {
          console.error('[BinanceData] Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('[BinanceData] WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('[BinanceData] WebSocket error:', error);
        setError('WebSocket connection failed');
      };
    } catch (error) {
      console.error('[BinanceData] Failed to create WebSocket:', error);
      setError('Failed to establish WebSocket connection');
    }
  }, []);

  // Subscribe to symbol updates
  const subscribeToSymbol = useCallback((pair: string, timeframe: string) => {
    const binanceSymbol = PAIR_TO_BINANCE_SYMBOL[pair];
    const binanceInterval = TIMEFRAME_TO_BINANCE[timeframe];
    
    if (!binanceSymbol || !binanceInterval) {
      console.warn(`Cannot subscribe to unsupported pair/timeframe: ${pair}/${timeframe}`);
      return;
    }

    const streamName = `${binanceSymbol.toLowerCase()}@kline_${binanceInterval}`;
    
    if (!subscribedSymbols.current.has(streamName)) {
      subscribedSymbols.current.add(streamName);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          method: "SUBSCRIBE",
          params: [streamName],
          id: Date.now()
        }));
        console.log(`[BinanceData] Subscribed to ${streamName}`);
      }
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Refresh order book data periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const pairs = Array.from(new Set(
        Array.from(subscribedSymbols.current).map(stream => {
          const symbol = stream.split('@')[0].toUpperCase();
          return Object.keys(PAIR_TO_BINANCE_SYMBOL).find(
            key => PAIR_TO_BINANCE_SYMBOL[key] === symbol
          );
        }).filter(Boolean)
      )) as string[];

      for (const pair of pairs) {
        const orderBook = await fetchOrderBook(pair);
        if (orderBook) {
          setOrderBookData(prev => {
            const newMap = new Map(prev);
            newMap.set(pair, orderBook);
            return newMap;
          });
        }
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [fetchOrderBook]);

  return {
    fetchHistoricalData,
    fetchOrderBook,
    subscribeToSymbol,
    candleData,
    orderBookData,
    isConnected,
    error,
    clearError: () => setError(null)
  };
};
