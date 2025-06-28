
import React, { useState, useEffect } from 'react';
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

  // Get update interval based on timeframe
  const getUpdateInterval = (tf: string) => {
    switch (tf) {
      case '1s': return 1000;
      case '15m': return 15000; // 15 seconds for demo
      case '1h': return 30000; // 30 seconds for demo
      case '4h': return 60000; // 1 minute for demo
      case '1d': return 120000; // 2 minutes for demo
      case '1w': return 300000; // 5 minutes for demo
      default: return 5000;
    }
  };

  // Generate realistic candlestick data based on timeframe
  useEffect(() => {
    setIsLoading(true);
    
    const generateRealtimeData = () => {
      const baseAsset = symbol.split('/')[0];
      const currentPriceData = prices.find(p => p.symbol.toUpperCase() === baseAsset);
      const currentPrice = currentPriceData?.current_price || 50000;
      
      const data: CandlestickData[] = [];
      let price = currentPrice * (0.98 + Math.random() * 0.04);
      
      // Generate different number of candles based on timeframe
      const candleCount = timeframe === '1s' ? 60 : timeframe === '15m' ? 100 : 80;
      
      for (let i = 0; i < candleCount; i++) {
        const timestamp = Date.now() - (candleCount - i) * getUpdateInterval(timeframe);
        const date = new Date(timestamp);
        
        // Adjust volatility based on timeframe
        const volatility = timeframe === '1s' ? 0.0005 : timeframe === '15m' ? 0.002 : 0.003;
        const open = price;
        const priceChange = (Math.random() - 0.5) * volatility;
        const close = Math.max(open * (1 + priceChange), 0.01);
        
        const wickRange = volatility * 0.5;
        const high = Math.max(open, close) * (1 + Math.random() * wickRange);
        const low = Math.min(open, close) * (1 - Math.random() * wickRange);
        
        const volume = 100000 + Math.random() * 200000;
        
        data.push({
          time: timeframe === '1s' ? 
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

    const newData = generateRealtimeData();
    setCandleData(newData);
    setIsLoading(false);
    
    // Real-time updates based on timeframe
    const updateInterval = getUpdateInterval(timeframe);
    const interval = setInterval(() => {
      setCandleData(prev => {
        const newData = [...prev];
        const lastCandle = newData[newData.length - 1];
        
        // Adjust volatility based on timeframe
        const volatility = timeframe === '1s' ? 0.0002 : timeframe === '15m' ? 0.001 : 0.0008;
        const realTimeChange = (Math.random() - 0.5) * volatility;
        const newClose = Math.max(lastCandle.close * (1 + realTimeChange), 0.01);
        
        newData[newData.length - 1] = {
          ...lastCandle,
          close: parseFloat(newClose.toFixed(2)),
          high: Math.max(lastCandle.high, newClose),
          low: Math.min(lastCandle.low, newClose),
          volume: lastCandle.volume + Math.round(Math.abs(realTimeChange) * 30000),
        };
        
        return newData;
      });
    }, updateInterval);
    
    return () => clearInterval(interval);
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
          📊 {timeframe} • Updates every {getUpdateInterval(timeframe) / 1000}s
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
