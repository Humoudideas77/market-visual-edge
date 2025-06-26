
import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
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

  // Generate realistic candlestick data based on timeframe with real-time updates
  useEffect(() => {
    setIsLoading(true);
    
    const generateRealtimeData = () => {
      const baseAsset = symbol.split('/')[0];
      const currentPriceData = prices.find(p => p.symbol.toUpperCase() === baseAsset);
      const currentPrice = currentPriceData?.current_price || 50000;
      
      // Use real market data when available
      const marketHigh = currentPriceData?.high_24h || currentPrice * 1.05;
      const marketLow = currentPriceData?.low_24h || currentPrice * 0.95;
      const priceChange24h = currentPriceData?.price_change_percentage_24h || 0;
      
      // Timeframe intervals in minutes
      const intervalMinutes = {
        '1m': 1,
        '2m': 2,
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '1h': 60
      }[timeframe] || 5;

      const data: CandlestickData[] = [];
      let price = currentPrice * (0.98 + Math.random() * 0.04); // Start with variation around current price
      
      // Generate 150 candles for better visualization
      for (let i = 0; i < 150; i++) {
        const timestamp = Date.now() - (150 - i) * intervalMinutes * 60 * 1000;
        const date = new Date(timestamp);
        
        // Enhanced volatility based on real market conditions
        const baseVolatility = {
          '1m': 0.001,
          '2m': 0.0015,
          '5m': 0.002,
          '15m': 0.004,
          '30m': 0.008,
          '1h': 0.015
        }[timeframe] || 0.002;

        // Add market trend influence
        const trendInfluence = (priceChange24h / 100) * 0.1;
        const marketNoise = (Math.random() - 0.5) * baseVolatility;
        
        const open = price;
        const priceChange = trendInfluence + marketNoise;
        const close = Math.max(open * (1 + priceChange), 0.01);
        
        // Realistic high/low with market bounds consideration
        const wickRange = baseVolatility * 0.6;
        const high = Math.min(Math.max(open, close) * (1 + Math.random() * wickRange), marketHigh);
        const low = Math.max(Math.min(open, close) * (1 - Math.random() * wickRange), marketLow * 0.95);
        
        // Volume based on market activity
        const baseVolume = intervalMinutes * 150000;
        const volumeMultiplier = Math.abs(priceChange) * 50 + 1; // Higher volume on price moves
        const volume = baseVolume * volumeMultiplier * (0.3 + Math.random() * 0.7);
        
        data.push({
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    
    // Enhanced real-time updates with more frequent intervals
    const updateInterval = {
      '1m': 2000,   // Update every 2 seconds for 1m
      '2m': 3000,   // Update every 3 seconds for 2m
      '5m': 5000,   // Update every 5 seconds for 5m
      '15m': 10000, // Update every 10 seconds for 15m
      '30m': 15000, // Update every 15 seconds for 30m
      '1h': 30000   // Update every 30 seconds for 1h
    }[timeframe] || 5000;

    const interval = setInterval(() => {
      setCandleData(prev => {
        const newData = [...prev];
        const lastCandle = newData[newData.length - 1];
        const baseAsset = symbol.split('/')[0];
        const currentPriceData = prices.find(p => p.symbol.toUpperCase() === baseAsset);
        
        // Use real price influence for updates
        const currentPrice = currentPriceData?.current_price || lastCandle.close;
        const priceInfluence = (currentPrice - lastCandle.close) / lastCandle.close;
        
        const volatility = {
          '1m': 0.0008,
          '2m': 0.001,
          '5m': 0.0015,
          '15m': 0.002,
          '30m': 0.003,
          '1h': 0.005
        }[timeframe] || 0.0015;

        // Blend real price movement with random volatility
        const realTimeChange = priceInfluence * 0.3 + (Math.random() - 0.5) * volatility;
        const newClose = Math.max(lastCandle.close * (1 + realTimeChange), 0.01);
        
        newData[newData.length - 1] = {
          ...lastCandle,
          close: parseFloat(newClose.toFixed(2)),
          high: Math.max(lastCandle.high, newClose),
          low: Math.min(lastCandle.low, newClose),
          volume: lastCandle.volume + Math.round(Math.abs(realTimeChange) * 50000),
        };
        
        return newData;
      });
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [symbol, timeframe, prices]);

  // Enhanced Candlestick component with better rendering
  const EnhancedCandlestick = ({ data, x, y, width, height }: any) => {
    if (!data || !candleData.length) return null;
    
    const minPrice = Math.min(...candleData.map(d => d.low));
    const maxPrice = Math.max(...candleData.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    
    return (
      <g>
        {data.map((candle: CandlestickData, index: number) => {
          const { open, high, low, close } = candle;
          const isGreen = close >= open;
          const color = isGreen ? '#10b981' : '#ef4444';
          
          const candleX = x + (index * width) / data.length;
          const candleWidth = Math.max((width / data.length) * 0.8, 2);
          
          const bodyHeight = Math.abs((close - open) / priceRange) * height;
          const bodyY = y + ((maxPrice - Math.max(open, close)) / priceRange) * height;
          
          const wickTop = y + ((maxPrice - high) / priceRange) * height;
          const wickBottom = y + ((maxPrice - low) / priceRange) * height;
          
          return (
            <g key={index}>
              {/* Upper and lower wicks */}
              <line
                x1={candleX + candleWidth / 2}
                y1={wickTop}
                x2={candleX + candleWidth / 2}
                y2={wickBottom}
                stroke={color}
                strokeWidth={1}
              />
              {/* Candle body */}
              <rect
                x={candleX}
                y={bodyY}
                width={candleWidth}
                height={Math.max(bodyHeight, 1)}
                fill={isGreen ? color : 'transparent'}
                stroke={color}
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </g>
    );
  };

  if (isLoading) {
    return (
      <div className="h-96 bg-exchange-accent/10 rounded-lg flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-exchange-blue"></div>
          <div className="text-exchange-text-secondary">Loading real-time {timeframe} chart for {symbol}...</div>
        </div>
      </div>
    );
  }

  const displayData = candleData.slice(-80); // Show last 80 candles for better performance
  const currentCandle = displayData[displayData.length - 1];

  return (
    <div className="w-full">
      {/* Enhanced Chart Info Bar with Real-time Indicator */}
      <div className="flex items-center justify-between mb-4 p-3 bg-exchange-accent/20 rounded-lg">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-exchange-text-secondary">LIVE</span>
          </div>
          <div className="text-sm">
            <span className="text-exchange-text-secondary">O: </span>
            <span className="text-exchange-text-primary font-mono">
              ${currentCandle?.open.toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-exchange-text-secondary">H: </span>
            <span className="text-exchange-green font-mono">
              ${currentCandle?.high.toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-exchange-text-secondary">L: </span>
            <span className="text-exchange-red font-mono">
              ${currentCandle?.low.toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-exchange-text-secondary">C: </span>
            <span className={`font-mono ${
              currentCandle?.close >= currentCandle?.open 
                ? 'text-exchange-green' 
                : 'text-exchange-red'
            }`}>
              ${currentCandle?.close.toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-exchange-text-secondary">Vol: </span>
            <span className="text-exchange-text-primary font-mono">
              {currentCandle?.volume.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="text-xs text-exchange-text-secondary">
          📊 {timeframe} • Real-time updates
        </div>
      </div>

      {/* Enhanced Professional Chart */}
      <div className="h-96 bg-exchange-accent/5 rounded-lg p-2 border border-exchange-border">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={displayData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={70}
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
            <ComposedChart data={displayData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={70}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <EnhancedCandlestick data={displayData} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Real-time Price Movement Indicator */}
      <div className="mt-4 flex items-center justify-center">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
          currentCandle?.close >= currentCandle?.open 
            ? 'bg-green-500/10 text-green-500' 
            : 'bg-red-500/10 text-red-500'
        }`}>
          <div className="text-sm font-mono">
            ${currentCandle?.close.toFixed(2)}
          </div>
          <div className="text-xs">
            {currentCandle?.close >= currentCandle?.open ? '↗' : '↘'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KindleCandlestickChart;
