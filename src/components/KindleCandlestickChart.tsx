
import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, Line, LineChart, Rectangle } from 'recharts';
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

  // Generate realistic candlestick data based on timeframe
  useEffect(() => {
    setIsLoading(true);
    
    const generateKindleData = () => {
      const baseAsset = symbol.split('/')[0];
      const currentPrice = prices.find(p => p.symbol.toUpperCase() === baseAsset)?.current_price || 50000;
      
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
      let price = currentPrice * (0.95 + Math.random() * 0.1); // Start with some variation
      
      // Generate 200 candles for better chart visualization
      for (let i = 0; i < 200; i++) {
        const timestamp = Date.now() - (200 - i) * intervalMinutes * 60 * 1000;
        const date = new Date(timestamp);
        
        // Enhanced volatility based on timeframe
        const baseVolatility = {
          '1m': 0.002,
          '2m': 0.003,
          '5m': 0.005,
          '15m': 0.008,
          '30m': 0.012,
          '1h': 0.020
        }[timeframe] || 0.005;

        // Add some trend and noise
        const trend = (Math.random() - 0.5) * 0.001;
        const noise = (Math.random() - 0.5) * baseVolatility;
        
        const open = price;
        const priceChange = trend + noise;
        const close = open * (1 + priceChange);
        
        // Generate realistic high/low with some wicks
        const wickFactor = Math.random() * baseVolatility * 0.5;
        const high = Math.max(open, close) * (1 + wickFactor);
        const low = Math.min(open, close) * (1 - wickFactor);
        
        // Volume varies based on volatility and timeframe
        const baseVolume = intervalMinutes * 100000;
        const volumeVariation = Math.random() * 0.8 + 0.2; // 20% to 100% of base
        const volume = baseVolume * volumeVariation;
        
        data.push({
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.round(volume),
        });
        
        price = close; // Next candle starts with current close
      }
      
      return data;
    };

    const newData = generateKindleData();
    setCandleData(newData);
    setIsLoading(false);
    
    // Real-time updates based on timeframe
    const updateInterval = {
      '1m': 5000,   // Update every 5 seconds for 1m
      '2m': 10000,  // Update every 10 seconds for 2m
      '5m': 15000,  // Update every 15 seconds for 5m
      '15m': 30000, // Update every 30 seconds for 15m
      '30m': 60000, // Update every minute for 30m
      '1h': 120000  // Update every 2 minutes for 1h
    }[timeframe] || 15000;

    const interval = setInterval(() => {
      setCandleData(prev => {
        const newData = [...prev];
        const lastCandle = newData[newData.length - 1];
        
        // Update the last candle with realistic price movement
        const volatility = {
          '1m': 0.001,
          '2m': 0.0015,
          '5m': 0.002,
          '15m': 0.003,
          '30m': 0.005,
          '1h': 0.008
        }[timeframe] || 0.002;

        const priceChange = (Math.random() - 0.5) * volatility;
        const newClose = lastCandle.close * (1 + priceChange);
        
        newData[newData.length - 1] = {
          ...lastCandle,
          close: parseFloat(newClose.toFixed(2)),
          high: Math.max(lastCandle.high, newClose),
          low: Math.min(lastCandle.low, newClose),
        };
        
        return newData;
      });
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [symbol, timeframe, prices]);

  // Custom Candlestick component for professional rendering
  const ProfessionalCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload || !candleData.length) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#10b981' : '#ef4444';
    
    const minPrice = Math.min(...candleData.map(d => d.low));
    const maxPrice = Math.max(...candleData.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    
    const bodyHeight = Math.abs((close - open) / priceRange) * height;
    const bodyY = y + ((maxPrice - Math.max(open, close)) / priceRange) * height;
    
    const wickTop = y + ((maxPrice - high) / priceRange) * height;
    const wickBottom = y + ((maxPrice - low) / priceRange) * height;
    
    return (
      <g>
        {/* Upper wick */}
        <line
          x1={x + width / 2}
          y1={wickTop}
          x2={x + width / 2}
          y2={bodyY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Lower wick */}
        <line
          x1={x + width / 2}
          y1={bodyY + bodyHeight}
          x2={x + width / 2}
          y2={wickBottom}
          stroke={color}
          strokeWidth={1}
        />
        {/* Candle body */}
        <Rectangle
          x={x + width * 0.1}
          y={bodyY}
          width={width * 0.8}
          height={Math.max(bodyHeight, 1)}
          fill={isGreen ? color : 'transparent'}
          stroke={color}
          strokeWidth={1.5}
        />
      </g>
    );
  };

  if (isLoading) {
    return (
      <div className="h-96 bg-exchange-accent/10 rounded-lg flex items-center justify-center">
        <div className="text-exchange-text-secondary">Loading {timeframe} chart for {symbol}...</div>
      </div>
    );
  }

  const displayData = candleData.slice(-100); // Show last 100 candles

  return (
    <div className="w-full">
      {/* Chart Info Bar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-exchange-accent/20 rounded-lg">
        <div className="flex items-center space-x-6">
          <div className="text-sm">
            <span className="text-exchange-text-secondary">O: </span>
            <span className="text-exchange-text-primary font-mono">
              ${displayData[displayData.length - 1]?.open.toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-exchange-text-secondary">H: </span>
            <span className="text-exchange-green font-mono">
              ${displayData[displayData.length - 1]?.high.toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-exchange-text-secondary">L: </span>
            <span className="text-exchange-red font-mono">
              ${displayData[displayData.length - 1]?.low.toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-exchange-text-secondary">C: </span>
            <span className={`font-mono ${
              displayData[displayData.length - 1]?.close >= displayData[displayData.length - 1]?.open 
                ? 'text-exchange-green' 
                : 'text-exchange-red'
            }`}>
              ${displayData[displayData.length - 1]?.close.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="text-xs text-exchange-text-secondary">
          Live • {timeframe} • Updates automatically
        </div>
      </div>

      {/* Professional Chart */}
      <div className="h-96 bg-exchange-accent/5 rounded-lg p-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'candlestick' ? (
            <ComposedChart data={displayData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={70}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              {displayData.map((entry, index) => (
                <ProfessionalCandlestick key={index} {...entry} />
              ))}
            </ComposedChart>
          ) : (
            <LineChart data={displayData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
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
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default KindleCandlestickChart;
