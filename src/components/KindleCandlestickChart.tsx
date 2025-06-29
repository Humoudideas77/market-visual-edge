
import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Bar, BarChart } from 'recharts';
import { useBinanceData, CandlestickData } from '@/hooks/useBinanceData';

interface KindleCandlestickChartProps {
  symbol: string;
  timeframe: string;
  chartType: 'candlestick' | 'line';
}

const KindleCandlestickChart = ({ symbol, timeframe, chartType }: KindleCandlestickChartProps) => {
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchHistoricalData, subscribeToSymbol, candleData: realtimeData, isConnected, error } = useBinanceData();

  // Load historical data when symbol or timeframe changes
  useEffect(() => {
    const loadHistoricalData = async () => {
      setIsLoading(true);
      console.log(`[KindleCandlestickChart] Loading data for ${symbol} ${timeframe}`);
      
      try {
        const historicalData = await fetchHistoricalData(symbol, timeframe, 100);
        setCandleData(historicalData);
        
        // Subscribe to real-time updates
        subscribeToSymbol(symbol, timeframe);
        
        console.log(`[KindleCandlestickChart] Loaded ${historicalData.length} candles`);
      } catch (error) {
        console.error('[KindleCandlestickChart] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoricalData();
  }, [symbol, timeframe, fetchHistoricalData, subscribeToSymbol]);

  // Update with real-time data
  useEffect(() => {
    const key = `${symbol}_${timeframe}`;
    const realtimeCandles = realtimeData.get(key);
    
    if (realtimeCandles && realtimeCandles.length > 0) {
      setCandleData(realtimeCandles);
    }
  }, [realtimeData, symbol, timeframe]);

  // Custom Candlestick Bar Component
  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload || candleData.length === 0) return null;

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

  if (error) {
    return (
      <div className="h-64 bg-gray-900/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ Market Data Error</div>
          <div className="text-sm text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-64 bg-gray-900/50 rounded-lg flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <div className="text-gray-400 text-sm">Loading {timeframe} chart...</div>
        </div>
      </div>
    );
  }

  const displayData = candleData.slice(-60);
  const currentCandle = displayData[displayData.length - 1];

  return (
    <div className="w-full">
      {/* Compact Chart Info Bar */}
      <div className="flex items-center justify-between mb-3 p-2 bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-gray-400">
              {isConnected ? 'LIVE' : 'OFFLINE'} • {timeframe.toUpperCase()}
            </span>
          </div>
          {currentCandle && (
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-gray-400">O: <span className="text-white font-mono">${currentCandle.open.toFixed(2)}</span></span>
              <span className="text-gray-400">H: <span className="text-green-500 font-mono">${currentCandle.high.toFixed(2)}</span></span>
              <span className="text-gray-400">L: <span className="text-red-500 font-mono">${currentCandle.low.toFixed(2)}</span></span>
              <span className="text-gray-400">C: <span className={`font-mono ${
                currentCandle.close >= currentCandle.open ? 'text-green-500' : 'text-red-500'
              }`}>${currentCandle.close.toFixed(2)}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Compact Chart */}
      <div className="h-64 bg-gray-900/30 rounded-lg border border-gray-700">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={displayData} margin={{ top: 10, right: 15, bottom: 10, left: 15 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                width={60}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#3b82f6" 
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#3b82f6' }}
              />
            </LineChart>
          ) : (
            <ComposedChart data={displayData} margin={{ top: 10, right: 15, bottom: 10, left: 15 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                width={60}
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

      {/* Compact Current Price Display */}
      {currentCandle && (
        <div className="mt-3 flex items-center justify-center">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
            currentCandle.close >= currentCandle.open 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-red-500/10 text-red-500'
          }`}>
            <div className="font-mono font-bold">
              ${currentCandle.close.toFixed(2)}
            </div>
            <div className="text-xs">
              {currentCandle.close >= currentCandle.open ? '↗' : '↘'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KindleCandlestickChart;
