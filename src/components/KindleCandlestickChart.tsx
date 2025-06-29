import React, { useState, useEffect, useRef } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Bar, BarChart } from 'recharts';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

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

const KindleCandlestickChart = ({ symbol, timeframe, chartType }: KindleCandlestickChartProps) => {
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { prices } = useCryptoPrices();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentCandleRef = useRef<CandlestickData | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Get proper timeframe intervals (in milliseconds) - more realistic for demo
  const getTimeframeConfig = (tf: string) => {
    switch (tf) {
      case '1s': return { 
        candleDuration: 1000,      // 1 second candles
        updateInterval: 1000,      // Update every 1 second
        microUpdateInterval: 200   // Micro updates every 200ms
      };
      case '15m': return { 
        candleDuration: 900000,    // 15 minute candles
        updateInterval: 15000,     // Update every 15 seconds for demo
        microUpdateInterval: 5000  // Micro updates every 5 seconds
      };
      case '1h': return { 
        candleDuration: 3600000,   // 1 hour candles
        updateInterval: 30000,     // Update every 30 seconds for demo
        microUpdateInterval: 10000 // Micro updates every 10 seconds
      };
      case '4h': return { 
        candleDuration: 14400000,  // 4 hour candles
        updateInterval: 60000,     // Update every minute for demo
        microUpdateInterval: 20000 // Micro updates every 20 seconds
      };
      case '1d': return { 
        candleDuration: 86400000,  // 1 day candles
        updateInterval: 120000,    // Update every 2 minutes for demo
        microUpdateInterval: 30000 // Micro updates every 30 seconds
      };
      case '1w': return { 
        candleDuration: 604800000, // 1 week candles
        updateInterval: 300000,    // Update every 5 minutes for demo
        microUpdateInterval: 60000 // Micro updates every minute
      };
      default: return { 
        candleDuration: 5000,      // 5 second default
        updateInterval: 5000,      // Update every 5 seconds
        microUpdateInterval: 1000  // Micro updates every second
      };
    }
  };

  // Generate realistic initial candlestick data
  useEffect(() => {
    setIsLoading(true);
    
    const generateInitialData = () => {
      const baseAsset = symbol.split('/')[0];
      const currentPriceData = prices.find(p => p.symbol.toUpperCase() === baseAsset);
      const currentPrice = currentPriceData?.current_price || 50000;
      
      const data: CandlestickData[] = [];
      let price = currentPrice * (0.98 + Math.random() * 0.04);
      
      const candleCount = 100;
      const { candleDuration } = getTimeframeConfig(timeframe);
      
      for (let i = 0; i < candleCount; i++) {
        const timestamp = Date.now() - (candleCount - i) * candleDuration;
        const date = new Date(timestamp);
        
        // Realistic volatility based on timeframe
        const baseVolatility = timeframe === '1s' ? 0.0001 : 
                              timeframe === '15m' ? 0.001 : 
                              timeframe === '1h' ? 0.003 :
                              timeframe === '4h' ? 0.008 :
                              timeframe === '1d' ? 0.015 : 0.025;
        
        const open = price;
        const priceChange = (Math.random() - 0.5) * baseVolatility;
        const close = Math.max(open * (1 + priceChange), 0.01);
        
        const wickRange = baseVolatility * 0.2;
        const high = Math.max(open, close) * (1 + Math.random() * wickRange);
        const low = Math.min(open, close) * (1 - Math.random() * wickRange);
        
        const volume = 30000 + Math.random() * 70000;
        
        data.push({
          time: timeframe === '1s' ? 
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
            timeframe === '15m' || timeframe === '1h' ?
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
            date.toLocaleDateString([], { month: 'short', day: '2-digit' }),
          timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.round(volume),
        });
        
        price = close;
      }
      
      return data;
    };

    const initialData = generateInitialData();
    setCandleData(initialData);
    currentCandleRef.current = initialData[initialData.length - 1];
    lastUpdateRef.current = Date.now();
    setIsLoading(false);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const { candleDuration, updateInterval, microUpdateInterval } = getTimeframeConfig(timeframe);
    
    // Main update cycle - creates new candles or updates current candle
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const lastCandle = currentCandleRef.current;
      
      if (!lastCandle) return;
      
      const timeSinceLastCandle = now - lastCandle.timestamp;
      
      // Check if we need a new candle based on timeframe
      if (timeSinceLastCandle >= candleDuration) {
        // Create new candle
        setCandleData(prev => {
          const newData = [...prev];
          const date = new Date(now);
          
          // Controlled price movement for new candle
          const volatility = timeframe === '1s' ? 0.00008 : 
                            timeframe === '15m' ? 0.0004 : 
                            timeframe === '1h' ? 0.001 :
                            timeframe === '4h' ? 0.003 :
                            timeframe === '1d' ? 0.008 : 0.015;
          
          const priceChange = (Math.random() - 0.5) * volatility;
          const newOpen = lastCandle.close;
          const newClose = Math.max(newOpen * (1 + priceChange), 0.01);
          
          const wickRange = volatility * 0.15;
          const newHigh = Math.max(newOpen, newClose) * (1 + Math.random() * wickRange);
          const newLow = Math.min(newOpen, newClose) * (1 - Math.random() * wickRange);
          
          const newCandle: CandlestickData = {
            time: timeframe === '1s' ? 
              date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
              timeframe === '15m' || timeframe === '1h' ?
              date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
              date.toLocaleDateString([], { month: 'short', day: '2-digit' }),
            timestamp: now,
            open: parseFloat(newOpen.toFixed(2)),
            high: parseFloat(newHigh.toFixed(2)),
            low: parseFloat(newLow.toFixed(2)),
            close: parseFloat(newClose.toFixed(2)),
            volume: Math.round(20000 + Math.random() * 50000),
          };
          
          currentCandleRef.current = newCandle;
          lastUpdateRef.current = now;
          
          // Keep only the last 100 candles
          return [...newData.slice(-99), newCandle];
        });
      } else {
        // Update current candle with controlled micro-movements
        const timeSinceLastUpdate = now - lastUpdateRef.current;
        
        // Only update if enough time has passed (throttling)
        if (timeSinceLastUpdate >= microUpdateInterval) {
          setCandleData(prev => {
            const newData = [...prev];
            const lastIndex = newData.length - 1;
            const currentCandle = newData[lastIndex];
            
            // Very small price movements for current candle updates
            const microVolatility = timeframe === '1s' ? 0.00002 : 
                                   timeframe === '15m' ? 0.00008 : 
                                   timeframe === '1h' ? 0.0002 :
                                   timeframe === '4h' ? 0.0004 :
                                   timeframe === '1d' ? 0.001 : 0.002;
            
            const microChange = (Math.random() - 0.5) * microVolatility;
            const newClose = Math.max(currentCandle.close * (1 + microChange), 0.01);
            
            newData[lastIndex] = {
              ...currentCandle,
              close: parseFloat(newClose.toFixed(2)),
              high: Math.max(currentCandle.high, newClose),
              low: Math.min(currentCandle.low, newClose),
              volume: currentCandle.volume + Math.round(Math.abs(microChange) * 5000),
            };
            
            currentCandleRef.current = newData[lastIndex];
            lastUpdateRef.current = now;
            return newData;
          });
        }
      }
    }, updateInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol, timeframe, prices]);

  // Custom Candlestick Bar Component
  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#10b981' : '#ef4444';
    
    const minPrice = Math.min(...candleData.map(d => d.low));
    const maxPrice = Math.max(...candleData.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return null;
    
    const bodyTop = y + ((maxPrice - Math.max(open, close)) / priceRange) * height;
    const bodyBottom = y + ((maxPrice - Math.min(open, close)) / priceRange) * height;
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
    
    const wickTop = y + ((maxPrice - high) / priceRange) * height;
    const wickBottom = y + ((maxPrice - low) / priceRange) * height;
    
    const candleWidth = Math.max(width * 0.6, 3);
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
          strokeWidth={1.5}
        />
      </g>
    );
  };

  if (isLoading) {
    return (
      <div className="h-96 bg-gray-900/50 rounded-lg flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <div className="text-gray-400">Loading {timeframe} chart for {symbol}...</div>
        </div>
      </div>
    );
  }

  const displayData = candleData.slice(-60);
  const currentCandle = displayData[displayData.length - 1];
  const { updateInterval } = getTimeframeConfig(timeframe);

  return (
    <div className="w-full p-4">
      {/* Chart Info Bar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">LIVE • {timeframe.toUpperCase()}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">O: </span>
            <span className="text-white font-mono">${currentCandle?.open.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">H: </span>
            <span className="text-green-500 font-mono">${currentCandle?.high.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">L: </span>
            <span className="text-red-500 font-mono">${currentCandle?.low.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">C: </span>
            <span className={`font-mono ${
              currentCandle?.close >= currentCandle?.open ? 'text-green-500' : 'text-red-500'
            }`}>
              ${currentCandle?.close.toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Vol: </span>
            <span className="text-white font-mono">{currentCandle?.volume.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          📊 {timeframe} • Updates every {updateInterval >= 60000 ? 
            `${updateInterval / 60000}m` : 
            `${updateInterval / 1000}s`}
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-96 bg-gray-900/30 rounded-lg border border-gray-700">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={displayData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                width={80}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
            </LineChart>
          ) : (
            <ComposedChart data={displayData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                width={80}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Bar 
                dataKey="close" 
                shape={<CandlestickBar />}
                fill="transparent"
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Current Price Display */}
      <div className="mt-4 flex items-center justify-center">
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
          currentCandle?.close >= currentCandle?.open 
            ? 'bg-green-500/10 text-green-500' 
            : 'bg-red-500/10 text-red-500'
        }`}>
          <div className="text-lg font-mono font-bold">
            ${currentCandle?.close.toFixed(2)}
          </div>
          <div className="text-sm">
            {currentCandle?.close >= currentCandle?.open ? '🔺' : '🔻'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KindleCandlestickChart;
