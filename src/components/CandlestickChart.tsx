
import React, { useState, useEffect, useRef } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, Rectangle } from 'recharts';
import { useBinanceData, CandlestickData } from '@/hooks/useBinanceData';

interface CandlestickProps {
  symbol: string;
}

const CandlestickChart = ({ symbol }: CandlestickProps) => {
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [timeframe, setTimeframe] = useState('5m');
  const [isLoading, setIsLoading] = useState(true);
  const { fetchHistoricalData, subscribeToSymbol, candleData: realtimeData, isConnected, error } = useBinanceData();

  // Load historical data when symbol or timeframe changes
  useEffect(() => {
    const loadHistoricalData = async () => {
      setIsLoading(true);
      console.log(`[CandlestickChart] Loading historical data for ${symbol} ${timeframe}`);
      
      try {
        const historicalData = await fetchHistoricalData(symbol, timeframe, 100);
        setCandleData(historicalData);
        
        // Subscribe to real-time updates
        subscribeToSymbol(symbol, timeframe);
        
        console.log(`[CandlestickChart] Loaded ${historicalData.length} historical candles`);
      } catch (error) {
        console.error('[CandlestickChart] Error loading historical data:', error);
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

  // Custom Candlestick component
  const CustomCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#10b981' : '#ef4444';
    
    if (candleData.length === 0) return null;
    
    const minPrice = Math.min(...candleData.map(d => d.low));
    const maxPrice = Math.max(...candleData.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return null;
    
    const bodyHeight = Math.abs(close - open) * height / priceRange;
    const bodyY = y + (maxPrice - Math.max(open, close)) * height / priceRange;
    
    const wickHeight = (high - low) * height / priceRange;
    const wickY = y + (maxPrice - high) * height / priceRange;
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={wickY}
          x2={x + width / 2}
          y2={wickY + wickHeight}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <Rectangle
          x={x + width * 0.2}
          y={bodyY}
          width={width * 0.6}
          height={Math.max(bodyHeight, 1)}
          fill={isGreen ? color : 'transparent'}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ Data Error</div>
          <div className="text-sm text-exchange-text-secondary">{error}</div>
          <div className="text-xs text-exchange-text-secondary mt-2">
            Check your internet connection or try again later
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-exchange-blue mx-auto mb-2"></div>
          <div className="text-sm text-exchange-text-secondary">Loading real market data...</div>
          <div className="text-xs text-exchange-text-secondary mt-1">{symbol} • {timeframe}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                timeframe === tf
                  ? 'bg-exchange-blue text-white'
                  : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-exchange-text-secondary">
            {isConnected ? 'LIVE • Binance API' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Candlestick Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={candleData.slice(-50)} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['dataMin - 1', 'dataMax + 1']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              width={60}
            />
            {candleData.slice(-50).map((entry, index) => (
              <CustomCandlestick 
                key={index} 
                payload={entry}
                x={index * (100 / 50)}
                y={0}
                width={100 / 50}
                height={100}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      {candleData.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mt-4 text-xs">
          <div className="bg-exchange-accent/30 p-2 rounded">
            <div className="text-exchange-text-secondary">Open</div>
            <div className="text-exchange-text-primary font-mono">
              ${candleData[candleData.length - 1]?.open.toFixed(2)}
            </div>
          </div>
          <div className="bg-exchange-accent/30 p-2 rounded">
            <div className="text-exchange-text-secondary">High</div>
            <div className="text-exchange-green font-mono">
              ${candleData[candleData.length - 1]?.high.toFixed(2)}
            </div>
          </div>
          <div className="bg-exchange-accent/30 p-2 rounded">
            <div className="text-exchange-text-secondary">Low</div>
            <div className="text-exchange-red font-mono">
              ${candleData[candleData.length - 1]?.low.toFixed(2)}
            </div>
          </div>
          <div className="bg-exchange-accent/30 p-2 rounded">
            <div className="text-exchange-text-secondary">Close</div>
            <div className={`font-mono ${
              candleData[candleData.length - 1]?.close >= candleData[candleData.length - 1]?.open 
                ? 'text-exchange-green' 
                : 'text-exchange-red'
            }`}>
              ${candleData[candleData.length - 1]?.close.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandlestickChart;
