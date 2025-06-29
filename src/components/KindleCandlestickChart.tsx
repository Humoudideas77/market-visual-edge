import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, Bar } from 'recharts';

interface CandlestickData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface KindleCandlestickChartProps {
  symbol: string;
  timeframe: string;
  chartType: 'candlestick' | 'line';
}

// Map trading pairs to Binance symbols
const PAIR_TO_BINANCE: Record<string, string> = {
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

const KindleCandlestickChart = ({ symbol, timeframe, chartType }: KindleCandlestickChartProps) => {
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Fetch historical data from Binance API
  const fetchHistoricalData = useCallback(async () => {
    const binanceSymbol = PAIR_TO_BINANCE[symbol];
    const binanceInterval = TIMEFRAME_TO_BINANCE[timeframe];
    
    if (!binanceSymbol || !binanceInterval) {
      setError(`Unsupported pair: ${symbol}`);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[KindleChart] Fetching data for ${binanceSymbol} ${binanceInterval}`);
      
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=100`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch data`);
      }
      
      const rawData = await response.json();
      
      if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('No data received from API');
      }

      const formattedData: CandlestickData[] = rawData.map((kline: any[]) => {
        const timestamp = kline[0];
        const date = new Date(timestamp);
        
        return {
          time: timeframe === '1s' || timeframe === '1m' ? 
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
            timeframe === '5m' || timeframe === '15m' || timeframe === '1h' ?
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
            date.toLocaleDateString([], { month: 'short', day: '2-digit' }),
          timestamp,
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5])
        };
      });

      if (mountedRef.current) {
        setCandleData(formattedData);
        console.log(`[KindleChart] Loaded ${formattedData.length} candles`);
        
        // Start WebSocket connection after successful data load
        connectWebSocket();
      }
    } catch (error) {
      console.error('[KindleChart] Error fetching data:', error);
      if (mountedRef.current) {
        setError('Failed to load chart data');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [symbol, timeframe]);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    const binanceSymbol = PAIR_TO_BINANCE[symbol];
    const binanceInterval = TIMEFRAME_TO_BINANCE[timeframe];
    
    if (!binanceSymbol || !binanceInterval || !mountedRef.current) {
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const streamName = `${binanceSymbol.toLowerCase()}@kline_${binanceInterval}`;
      wsRef.current = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);
      
      wsRef.current.onopen = () => {
        console.log('[KindleChart] WebSocket connected');
        setIsConnected(true);
        setError(null);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.k && mountedRef.current) {
            const kline = data.k;
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
              const updated = [...prev];
              
              // Update last candle if same timestamp, otherwise add new
              if (updated.length > 0 && updated[updated.length - 1].timestamp === newCandle.timestamp) {
                updated[updated.length - 1] = newCandle;
              } else {
                updated.push(newCandle);
                // Keep only last 100 candles
                if (updated.length > 100) {
                  updated.shift();
                }
              }
              
              return updated;
            });
          }
        } catch (error) {
          console.error('[KindleChart] WebSocket message error:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('[KindleChart] WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt reconnection after 3 seconds
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectWebSocket();
            }
          }, 3000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('[KindleChart] WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('[KindleChart] Failed to create WebSocket:', error);
      setIsConnected(false);
    }
  }, [symbol, timeframe]);

  // Initialize data loading
  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  // Custom Candlestick Bar Component
  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#00d4aa' : '#ff6838';
    
    const minPrice = Math.min(...candleData.map(d => d.low));
    const maxPrice = Math.max(...candleData.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return null;
    
    const bodyTop = y + ((maxPrice - Math.max(open, close)) / priceRange) * height;
    const bodyBottom = y + ((maxPrice - Math.min(open, close)) / priceRange) * height;
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
    
    const wickTop = y + ((maxPrice - high) / priceRange) * height;
    const wickBottom = y + ((maxPrice - low) / priceRange) * height;
    
    const candleWidth = Math.min(Math.max(width * 0.6, 1), 6);
    const candleX = x + (width - candleWidth) / 2;
    
    return (
      <g>
        <line
          x1={x + width / 2}
          y1={wickTop}
          x2={x + width / 2}
          y2={wickBottom}
          stroke={color}
          strokeWidth={1}
        />
        <rect
          x={candleX}
          y={bodyTop}
          width={candleWidth}
          height={bodyHeight}
          fill={isGreen ? color : 'transparent'}
          stroke={color}
          strokeWidth={isGreen ? 0 : 1}
        />
      </g>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-80 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          <div className="text-gray-400 text-sm">Loading {timeframe} chart...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-80 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-400 mb-3 text-sm">⚠️ Chart Error</div>
          <div className="text-xs text-gray-500 mb-4">{error}</div>
          <button 
            onClick={fetchHistoricalData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!candleData.length) {
    return (
      <div className="h-80 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-400 mb-2 text-sm">📊 No Chart Data</div>
          <div className="text-xs text-gray-500">Waiting for market data...</div>
        </div>
      </div>
    );
  }

  const currentCandle = candleData[candleData.length - 1];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4 py-2 bg-gray-900/60 rounded-t-lg border border-gray-800">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-xs font-medium text-gray-300">
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs font-mono text-gray-400">{timeframe.toUpperCase()}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">{candleData.length} candles</span>
          </div>
          
          {currentCandle && (
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">O</span>
                <span className="font-mono text-gray-300">${currentCandle.open.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">H</span>
                <span className="font-mono text-green-400">${currentCandle.high.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">L</span>
                <span className="font-mono text-red-400">${currentCandle.low.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">C</span>
                <span className={`font-mono font-medium ${
                  currentCandle.close >= currentCandle.open ? 'text-green-400' : 'text-red-400'
                }`}>${currentCandle.close.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 bg-gray-900/40 rounded-b-lg border-x border-b border-gray-800">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={candleData} 
            margin={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              interval="preserveStartEnd"
              tickMargin={8}
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              width={60}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              tickMargin={8}
            />
            <Bar 
              dataKey="close" 
              shape={<CandlestickBar />}
              fill="transparent"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Current Price */}
      {currentCandle && (
        <div className="mt-3 flex justify-center">
          <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${
            currentCandle.close >= currentCandle.open 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <div className="font-mono text-lg font-bold">
              ${currentCandle.close.toFixed(2)}
            </div>
            <div className="text-sm font-medium">
              {currentCandle.close >= currentCandle.open ? '▲' : '▼'}
              {Math.abs(((currentCandle.close - currentCandle.open) / currentCandle.open) * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KindleCandlestickChart;
