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

  // Get proper update interval based on timeframe (in milliseconds)
  const getUpdateInterval = (tf: string) => {
    switch (tf) {
      case '1s': return 1000;      // 1 second
      case '15m': return 900000;   // 15 minutes
      case '1h': return 3600000;   // 1 hour
      case '4h': return 14400000;  // 4 hours
      case '1d': return 86400000;  // 1 day
      case '1w': return 604800000; // 1 week
      default: return 5000;        // 5 seconds default
    }
  };

  // Get how many milliseconds each candle represents
  const getCandleDuration = (tf: string) => {
    return getUpdateInterval(tf);
  };

  // Generate realistic candlestick data based on timeframe
  useEffect(() => {
    setIsLoading(true);
    
    const generateInitialData = () => {
      const baseAsset = symbol.split('/')[0];
      const currentPriceData = prices.find(p => p.symbol.toUpperCase() === baseAsset);
      const currentPrice = currentPriceData?.current_price || 50000;
      
      const data: CandlestickData[] = [];
      let price = currentPrice * (0.98 + Math.random() * 0.04);
      
      const candleCount = 60; // Show 60 candles
      const duration = getCandleDuration(timeframe);
      
      for (let i = 0; i < candleCount; i++) {
        const timestamp = Date.now() - (candleCount - i) * duration;
        const date = new Date(timestamp);
        
        // Adjust volatility based on timeframe - longer timeframes have more volatility
        const baseVolatility = timeframe === '1s' ? 0.0003 : 
                              timeframe === '15m' ? 0.002 : 
                              timeframe === '1h' ? 0.005 :
                              timeframe === '4h' ? 0.012 :
                              timeframe === '1d' ? 0.025 : 0.05;
        
        const open = price;
        const priceChange = (Math.random() - 0.5) * baseVolatility;
        const close = Math.max(open * (1 + priceChange), 0.01);
        
        const wickRange = baseVolatility * 0.3;
        const high = Math.max(open, close) * (1 + Math.random() * wickRange);
        const low = Math.min(open, close) * (1 - Math.random() * wickRange);
        
        const volume = 50000 + Math.random() * 150000;
        
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
    setIsLoading(false);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up proper interval based on timeframe
    const updateInterval = getUpdateInterval(timeframe);
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const lastCandle = currentCandleRef.current;
      
      if (!lastCandle) return;
      
      // Check if we need to create a new candle or update the current one
      const timeSinceLastCandle = now - lastCandle.timestamp;
      const candleDuration = getCandleDuration(timeframe);
      
      if (timeSinceLastCandle >= candleDuration) {
        // Create new candle
        setCandleData(prev => {
          const newData = [...prev];
          const date = new Date(now);
          
          // Small realistic price change for new candle
          const volatility = timeframe === '1s' ? 0.0002 : 
                            timeframe === '15m' ? 0.001 : 
                            timeframe === '1h' ? 0.003 :
                            timeframe === '4h' ? 0.008 :
                            timeframe === '1d' ? 0.015 : 0.03;
          
          const priceChange = (Math.random() - 0.5) * volatility;
          const newOpen = lastCandle.close;
          const newClose = Math.max(newOpen * (1 + priceChange), 0.01);
          
          const wickRange = volatility * 0.2;
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
            volume: Math.round(30000 + Math.random() * 100000),
          };
          
          currentCandleRef.current = newCandle;
          
          // Keep only the last 60 candles
          const updatedData = [...newData.slice(-59), newCandle];
          return updatedData;
        });
      } else {
        // Update current candle (only close, high, low can change)
        setCandleData(prev => {
          const newData = [...prev];
          const lastIndex = newData.length - 1;
          const currentCandle = newData[lastIndex];
          
          // Micro price movement for current candle
          const microVolatility = timeframe === '1s' ? 0.00005 : 
                                 timeframe === '15m' ? 0.0002 : 
                                 timeframe === '1h' ? 0.0005 :
                                 timeframe === '4h' ? 0.001 :
                                 timeframe === '1d' ? 0.002 : 0.004;
          
          const microChange = (Math.random() - 0.5) * microVolatility;
          const newClose = Math.max(currentCandle.close * (1 + microChange), 0.01);
          
          newData[lastIndex] = {
            ...currentCandle,
            close: parseFloat(newClose.toFixed(2)),
            high: Math.max(currentCandle.high, newClose),
            low: Math.min(currentCandle.low, newClose),
            volume: currentCandle.volume + Math.round(Math.abs(microChange) * 10000),
          };
          
          currentCandleRef.current = newData[lastIndex];
          return newData;
        });
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
    
    // Calculate positions
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
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={wickTop}
          x2={x + width / 2}
          y2={wickBottom}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
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
          <div className="text-gray-400">Loading live {timeframe} chart for {symbol}...</div>
        </div>
      </div>
    );
  }

  const displayData = candleData.slice(-60); // Show last 60 candles
  const currentCandle = displayData[displayData.length - 1];

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
          📊 {timeframe} • Updates every {getUpdateInterval(timeframe) >= 60000 ? 
            `${getUpdateInterval(timeframe) / 60000}m` : 
            `${getUpdateInterval(timeframe) / 1000}s`}
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
