
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [hasInitialData, setHasInitialData] = useState(false);
  
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  const { 
    fetchHistoricalData, 
    subscribeToSymbol, 
    candleData: realtimeData, 
    isConnected, 
    error: binanceError,
    clearError 
  } = useBinanceData();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Load historical data with proper error handling
  const loadHistoricalData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      clearError();
      
      console.log(`[KindleCandlestickChart] Loading historical data for ${symbol} ${timeframe}`);
      
      const historicalData = await fetchHistoricalData(symbol, timeframe, 200);
      
      if (!mountedRef.current) return;
      
      if (historicalData && historicalData.length > 0) {
        setCandleData(historicalData);
        setHasInitialData(true);
        retryCountRef.current = 0;
        
        // Subscribe to real-time updates after successful data load
        subscribeToSymbol(symbol, timeframe);
        
        console.log(`[KindleCandlestickChart] Successfully loaded ${historicalData.length} candles`);
      } else {
        throw new Error('No historical data received');
      }
    } catch (error) {
      console.error('[KindleCandlestickChart] Error loading data:', error);
      
      if (!mountedRef.current) return;
      
      if (retryCountRef.current < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
        setError(`Retrying... (${retryCountRef.current + 1}/${maxRetries})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            retryCountRef.current++;
            loadHistoricalData();
          }
        }, retryDelay);
      } else {
        setError('Failed to load chart data. Please refresh the page.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [symbol, timeframe, fetchHistoricalData, subscribeToSymbol, clearError]);

  // Initial data load
  useEffect(() => {
    retryCountRef.current = 0;
    setHasInitialData(false);
    setCandleData([]);
    loadHistoricalData();
  }, [loadHistoricalData]);

  // Handle real-time data updates
  useEffect(() => {
    if (!hasInitialData) return;
    
    const key = `${symbol}_${timeframe}`;
    const realtimeCandles = realtimeData.get(key);
    
    if (realtimeCandles && realtimeCandles.length > 0) {
      setCandleData(realtimeCandles);
      console.log(`[KindleCandlestickChart] Updated with ${realtimeCandles.length} real-time candles`);
    }
  }, [realtimeData, symbol, timeframe, hasInitialData]);

  // Handle Binance API errors
  useEffect(() => {
    if (binanceError && !error) {
      setError(binanceError);
    }
  }, [binanceError, error]);

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
          opacity={0.9}
        />
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

  // Error state
  if (error && retryCountRef.current >= maxRetries) {
    return (
      <div className="h-80 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-400 mb-3 text-sm">⚠️ Chart Error</div>
          <div className="text-xs text-gray-500 mb-4">{error}</div>
          <button 
            onClick={() => {
              retryCountRef.current = 0;
              setError(null);
              loadHistoricalData();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !hasInitialData) {
    return (
      <div className="h-80 bg-gray-900/40 rounded-lg border border-gray-800 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          <div className="text-gray-400 text-sm">
            {error ? error : `Loading ${timeframe} chart...`}
          </div>
        </div>
      </div>
    );
  }

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
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3 px-4 py-2 bg-gray-900/60 rounded-t-lg border border-gray-800">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-xs font-medium text-gray-300">
              {isConnected ? 'LIVE' : 'OFFLINE'}
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

      {/* Chart Container */}
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

        {/* Grid overlay */}
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
