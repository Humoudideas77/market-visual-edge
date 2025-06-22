
import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, Rectangle } from 'recharts';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickProps {
  symbol: string;
}

const CandlestickChart = ({ symbol }: CandlestickProps) => {
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [timeframe, setTimeframe] = useState('5m');
  const { prices } = useCryptoPrices();

  // Generate realistic candlestick data
  useEffect(() => {
    const generateCandlestickData = () => {
      const baseAsset = symbol.split('/')[0];
      const currentPrice = prices.find(p => p.symbol.toUpperCase() === baseAsset)?.current_price || 50000;
      
      const data: CandlestickData[] = [];
      let price = currentPrice * 0.98; // Start slightly below current price
      
      // Generate 100 candles
      for (let i = 0; i < 100; i++) {
        const timestamp = new Date(Date.now() - (100 - i) * 5 * 60 * 1000); // 5-minute intervals
        
        // Generate realistic OHLC data
        const volatility = 0.003; // 0.3% volatility
        const trend = (Math.random() - 0.5) * 0.001; // Small random trend
        
        const open = price;
        const changePercent = (Math.random() - 0.5) * volatility + trend;
        const close = open * (1 + changePercent);
        
        // High and low based on open/close with some random extension
        const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
        const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
        
        const volume = Math.random() * 1000000 + 100000;
        
        data.push({
          time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.round(volume),
        });
        
        price = close; // Use close as next open
      }
      
      return data;
    };

    setCandleData(generateCandlestickData());
    
    // Update data every 5 seconds to simulate real-time updates
    const interval = setInterval(() => {
      setCandleData(prev => {
        const newData = [...prev];
        const lastCandle = newData[newData.length - 1];
        
        // Update the last candle with new close price
        const volatility = 0.002;
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
    }, 5000);
    
    return () => clearInterval(interval);
  }, [symbol, prices]);

  // Custom Candlestick component
  const CustomCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#10b981' : '#ef4444';
    
    const bodyHeight = Math.abs(close - open) * height / (Math.max(...candleData.map(d => d.high)) - Math.min(...candleData.map(d => d.low)));
    const bodyY = y + (Math.max(...candleData.map(d => d.high)) - Math.max(open, close)) * height / (Math.max(...candleData.map(d => d.high)) - Math.min(...candleData.map(d => d.low)));
    
    const wickHeight = (high - low) * height / (Math.max(...candleData.map(d => d.high)) - Math.min(...candleData.map(d => d.low)));
    const wickY = y + (Math.max(...candleData.map(d => d.high)) - high) * height / (Math.max(...candleData.map(d => d.high)) - Math.min(...candleData.map(d => d.low)));
    
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

  return (
    <div className="w-full h-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
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
        <div className="text-xs text-exchange-text-secondary">
          Live • Updates every 5s
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
            {/* Custom candlesticks would go here - for now showing a line chart as fallback */}
            <ComposedChart data={candleData.slice(-50)}>
              {candleData.slice(-50).map((entry, index) => (
                <CustomCandlestick key={index} {...entry} />
              ))}
            </ComposedChart>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
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
    </div>
  );
};

export default CandlestickChart;
