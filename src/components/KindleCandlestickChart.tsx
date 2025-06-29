import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Bar } from 'recharts';
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

  // Enhanced Candlestick Bar Component with better proportions
  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload || candleData.length === 0) return null;

    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#00d4aa' : '#ff6838';
    
    const minPrice = Math.min(...candleData.map(d => d.low));
    const maxPrice = Math.max(...candleData.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return null;
    
    // Calculate positions with better scaling
    const bodyTop = y + ((maxPrice - Math.max(open, close)) / priceRange) * height;
    const bodyBottom = y + ((maxPrice - Math.min(open, close)) / priceRange) * height;
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
    
    const wickTop = y + ((maxPrice - high) / priceRange) * height;
    const wickBottom = y + ((maxPrice - low) / priceRange) * height;
    
    // Better candle width calculation for professional appearance
    const candleWidth = Math.min(Math.max(width * 0.7, 2), 8);
    const candleX = x + (width - candleWidth) / 2;
    
    return (
      <g>
        {/* Wick line */}
        <line
          x1={x + width / 2}
          y1={wickTop}
          x2={x + width / 2}
          y2={wickBottom}
          stroke={color}
          strokeWidth={1}
          opacity={0.8}
        />
        {/* Candle body */}
        <rect
          x={candleX}
          y={bodyTop}
          width={candleWidth}
          height={bodyHeight}
          fill={isGreen ? color : 'transparent'}
          stroke={color}
          strokeWidth={1.2}
          rx={0.5}
        />
      </g>
    );
  };

  if (error) {
    return (
      <div className="h-96 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2 text-sm">⚠️ Connection Error</div>
          <div className="text-xs text-gray-500">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-96 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          <div className="text-gray-400 text-sm">Loading {timeframe} data...</div>
        </div>
      </div>
    );
  }

  const displayData = candleData.slice(-80);
  const currentCandle = displayData[displayData.length - 1];

  return (
    <div className="w-full">
      {/* Professional Header Bar */}
      <div className="flex items-center justify-between mb-4 px-4 py-2 bg-gray-900/60 rounded-t-lg border border-gray-800">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-xs font-medium text-gray-300">
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs font-mono text-gray-400">{timeframe.toUpperCase()}</span>
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

      {/* Professional Chart Container */}
      <div className="h-96 bg-gray-900/40 rounded-b-lg border-x border-b border-gray-800 relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart 
              data={displayData} 
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
                domain={['dataMin - 10', 'dataMax + 10']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={70}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                tickMargin={8}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
              />
            </LineChart>
          ) : (
            <ComposedChart 
              data={displayData} 
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
                domain={['dataMin - 10', 'dataMax + 10']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={70}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                tickMargin={8}
              />
              <Bar 
                dataKey="close" 
                shape={<CandlestickBar />}
                fill="transparent"
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>

        {/* Price Grid Lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-rows-4 opacity-10">
            <div className="border-b border-gray-600"></div>
            <div className="border-b border-gray-600"></div>
            <div className="border-b border-gray-600"></div>
            <div></div>
          </div>
        </div>
      </div>

      {/* Current Price Indicator */}
      {currentCandle && (
        <div className="mt-4 flex justify-center">
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
