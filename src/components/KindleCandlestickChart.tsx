
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
  const lastCandleStartRef = useRef<number>(0);

  // Get proper timeframe intervals (in milliseconds) - much more controlled
  const getTimeframeConfig = (tf: string) => {
    switch (tf) {
      case '1s': return { 
        candleDuration: 1000,
        displayUpdateInterval: 1000  // Update display every 1 second
      };
      case '15m': return { 
        candleDuration: 900000,      // 15 minutes
        displayUpdateInterval: 5000  // Update display every 5 seconds
      };
      case '1h': return { 
        candleDuration: 3600000,     // 1 hour
        displayUpdateInterval: 10000 // Update display every 10 seconds
      };
      case '4h': return { 
        candleDuration: 14400000,    // 4 hours
        displayUpdateInterval: 30000 // Update display every 30 seconds
      };
      case '1d': return { 
        candleDuration: 86400000,    // 1 day
        displayUpdateInterval: 60000 // Update display every minute
      };
      case '1w': return { 
        candleDuration: 604800000,   // 1 week
        displayUpdateInterval: 300000 // Update display every 5 minutes
      };
      default: return { 
        candleDuration: 5000,
        displayUpdateInterval: 2000
      };
    }
  };

  // Generate realistic initial candlestick data
  useEffect(() => {
    console.log(`[CandlestickChart] Initializing chart for ${symbol} with timeframe ${timeframe}`);
    setIsLoading(true);
    
    const generateInitialData = () => {
      const baseAsset = symbol.split('/')[0];
      const currentPriceData = prices.find(p => p.symbol.toUpperCase() === baseAsset);
      const currentPrice = currentPriceData?.current_price || 50000;
      
      const data: CandlestickData[] = [];
      let price = currentPrice * (0.98 + Math.random() * 0.04);
      
      const candleCount = 100;
      const { candleDuration } = getTimeframeConfig(timeframe);
      const now = Date.now();
      
      // Align candle start times to proper intervals
      const alignedStartTime = Math.floor(now / candleDuration) * candleDuration;
      
      for (let i = 0; i < candleCount; i++) {
        const candleStartTime = alignedStartTime - (candleCount - i) * candleDuration;
        const date = new Date(candleStartTime);
        
        // More controlled volatility based on timeframe
        const baseVolatility = timeframe === '1s' ? 0.00005 : 
                              timeframe === '15m' ? 0.0008 : 
                              timeframe === '1h' ? 0.002 :
                              timeframe === '4h' ? 0.005 :
                              timeframe === '1d' ? 0.012 : 0.02;
        
        const open = price;
        const priceChange = (Math.random() - 0.5) * baseVolatility;
        const close = Math.max(open * (1 + priceChange), 0.01);
        
        const wickRange = baseVolatility * 0.3;
        const high = Math.max(open, close) * (1 + Math.random() * wickRange);
        const low = Math.min(open, close) * (1 - Math.random() * wickRange);
        
        const volume = 20000 + Math.random() * 40000;
        
        data.push({
          time: timeframe === '1s' ? 
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
            timeframe === '15m' || timeframe === '1h' ?
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
            date.toLocaleDateString([], { month: 'short', day: '2-digit' }),
          timestamp: candleStartTime,
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
    
    if (initialData.length > 0) {
      currentCandleRef.current = initialData[initialData.length - 1];
      lastCandleStartRef.current = initialData[initialData.length - 1].timestamp;
    }
    
    setIsLoading(false);
    console.log(`[CandlestickChart] Generated ${initialData.length} initial candles`);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const { candleDuration, displayUpdateInterval } = getTimeframeConfig(timeframe);
    
    // Controlled update cycle
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const currentCandleStartTime = Math.floor(now / candleDuration) * candleDuration;
      
      setCandleData(prevData => {
        if (prevData.length === 0) return prevData;
        
        const newData = [...prevData];
        const lastCandle = newData[newData.length - 1];
        
        // Check if we need a new candle
        if (currentCandleStartTime > lastCandleStartRef.current) {
          console.log(`[CandlestickChart] Creating new ${timeframe} candle`);
          
          // Create new candle
          const date = new Date(currentCandleStartTime);
          const baseVolatility = timeframe === '1s' ? 0.00005 : 
                                timeframe === '15m' ? 0.0008 : 
                                timeframe === '1h' ? 0.002 :
                                timeframe === '4h' ? 0.005 :
                                timeframe === '1d' ? 0.012 : 0.02;
          
          const priceChange = (Math.random() - 0.5) * baseVolatility;
          const newOpen = lastCandle.close;
          const newClose = Math.max(newOpen * (1 + priceChange), 0.01);
          
          const wickRange = baseVolatility * 0.3;
          const newHigh = Math.max(newOpen, newClose) * (1 + Math.random() * wickRange);
          const newLow = Math.min(newOpen, newClose) * (1 - Math.random() * wickRange);
          
          const newCandle: CandlestickData = {
            time: timeframe === '1s' ? 
              date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
              timeframe === '15m' || timeframe === '1h' ?
              date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
              date.toLocaleDateString([], { month: 'short', day: '2-digit' }),
            timestamp: currentCandleStartTime,
            open: parseFloat(newOpen.toFixed(2)),
            high: parseFloat(newHigh.toFixed(2)),
            low: parseFloat(newLow.toFixed(2)),
            close: parseFloat(newClose.toFixed(2)),
            volume: Math.round(15000 + Math.random() * 30000),
          };
          
          currentCandleRef.current = newCandle;
          lastCandleStartRef.current = currentCandleStartTime;
          
          return [...newData.slice(-99), newCandle];
        } else {
          // Update current candle with very small movements
          const microVolatility = timeframe === '1s' ? 0.00001 : 
                                 timeframe === '15m' ? 0.0001 : 
                                 timeframe === '1h' ? 0.0003 :
                                 timeframe === '4h' ? 0.0005 :
                                 timeframe === '1d' ? 0.001 : 0.002;
          
          const microChange = (Math.random() - 0.5) * microVolatility;
          const newClose = Math.max(lastCandle.close * (1 + microChange), 0.01);
          
          newData[newData.length - 1] = {
            ...lastCandle,
            close: parseFloat(newClose.toFixed(2)),
            high: Math.max(lastCandle.high, newClose),
            low: Math.min(lastCandle.low, newClose),
            volume: lastCandle.volume + Math.round(Math.abs(microChange) * 2000),
          };
          
          currentCandleRef.current = newData[newData.length - 1];
          return newData;
        }
      });
    }, displayUpdateInterval);
    
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
  const { displayUpdateInterval } = getTimeframeConfig(timeframe);

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
          📊 {timeframe} • Updates every {displayUpdateInterval >= 60000 ? 
            `${displayUpdateInterval / 60000}m` : 
            `${displayUpdateInterval / 1000}s`}
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
