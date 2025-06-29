
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
  const [connectionRetries, setConnectionRetries] = useState(0);
  
  const { fetchHistoricalData, subscribeToSymbol, candleData: realtimeData, isConnected, error, clearError } = useBinanceData();

  // Load historical data with retry mechanism
  useEffect(() => {
    const loadHistoricalData = async () => {
      setIsLoading(true);
      clearError();
      console.log(`[KindleCandlestickChart] Loading historical data for ${symbol} ${timeframe}`);
      
      try {
        // Fetch more historical data for better chart display
        const historicalData = await fetchHistoricalData(symbol, timeframe, 200);
        
        if (historicalData && historicalData.length > 0) {
          setCandleData(historicalData);
          setConnectionRetries(0);
          
          // Subscribe to real-time updates only after successful data fetch
          subscribeToSymbol(symbol, timeframe);
          
          console.log(`[KindleCandlestickChart] Successfully loaded ${historicalData.length} candles`);
        } else {
          throw new Error('No historical data received');
        }
      } catch (error) {
        console.error('[KindleCandlestickChart] Error loading data:', error);
        
        // Retry mechanism with exponential backoff
        if (connectionRetries < 3) {
          const retryDelay = Math.pow(2, connectionRetries) * 2000; // 2s, 4s, 8s
          console.log(`[KindleCandlestickChart] Retrying in ${retryDelay}ms (attempt ${connectionRetries + 1}/3)`);
          
          setTimeout(() => {
            setConnectionRetries(prev => prev + 1);
          }, retryDelay);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoricalData();
  }, [symbol, timeframe, connectionRetries, fetchHistoricalData, subscribeToSymbol, clearError]);

  // Update with real-time data
  useEffect(() => {
    const key = `${symbol}_${timeframe}`;
    const realtimeCandles = realtimeData.get(key);
    
    if (realtimeCandles && realtimeCandles.length > 0) {
      setCandleData(realtimeCandles);
      console.log(`[KindleCandlestickChart] Updated with ${realtimeCandles.length} real-time candles`);
    }
  }, [realtimeData, symbol, timeframe]);

  // Enhanced Candlestick Bar Component
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
    
    // Calculate positions with proper scaling
    const bodyTop = y + ((maxPrice - Math.max(open, close)) / priceRange) * height;
    const bodyBottom = y + ((maxPrice - Math.min(open, close)) / priceRange) * height;
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
    
    const wickTop = y + ((maxPrice - high) / priceRange) * height;
    const wickBottom = y + ((maxPrice - low) / priceRange) * height;
    
    // Proper candle width calculation
    const candleWidth = Math.min(Math.max(width * 0.6, 1), 6);
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
          opacity={0.9}
        />
        {/* Candle body */}
        <rect
          x={candleX}
          y={bodyTop}
          width={candleWidth}
          height={bodyHeight}
          fill={isGreen ? color : 'transparent'}
          stroke={color}
          strokeWidth={isGreen ? 0 : 1}
          rx={0.5}
        />
      </g>
    );
  };

  if (error && connectionRetries >= 3) {
    return (
      <div className="h-80 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-400 mb-3 text-sm">⚠️ Connection Failed</div>
          <div className="text-xs text-gray-500 mb-4">{error}</div>
          <button 
            onClick={() => {
              setConnectionRetries(0);
              clearError();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-80 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          <div className="text-gray-400 text-sm">
            {connectionRetries > 0 ? `Retrying... (${connectionRetries}/3)` : `Loading ${timeframe} data...`}
          </div>
        </div>
      </div>
    );
  }

  // Show more historical data (last 100 candles instead of 80)
  const displayData = candleData.slice(-100);
  const currentCandle = displayData[displayData.length - 1];

  if (!displayData.length) {
    return (
      <div className="h-80 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-400 mb-2 text-sm">📊 No Chart Data</div>
          <div className="text-xs text-gray-500">Waiting for market data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Professional Header Bar */}
      <div className="flex items-center justify-between mb-3 px-4 py-2 bg-gray-900/60 rounded-t-lg border border-gray-800">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-xs font-medium text-gray-300">
              {isConnected ? 'LIVE' : connectionRetries > 0 ? 'RECONNECTING' : 'OFFLINE'}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs font-mono text-gray-400">{timeframe.toUpperCase()}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">{displayData.length} candles</span>
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
      <div className="h-80 bg-gray-900/40 rounded-b-lg border-x border-b border-gray-800 relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart 
              data={displayData} 
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
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#3b82f6" 
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
              />
            </LineChart>
          ) : (
            <ComposedChart 
              data={displayData} 
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
          )}
        </ResponsiveContainer>

        {/* Subtle grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-rows-5 opacity-5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="border-b border-gray-600"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Price Indicator */}
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
