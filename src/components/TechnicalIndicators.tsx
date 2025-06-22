
import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface TechnicalIndicatorsProps {
  symbol: string;
}

interface IndicatorData {
  time: string;
  rsi: number;
  volume: number;
  sma20: number;
  sma50: number;
  macd: number;
  signal: number;
}

const TechnicalIndicators = ({ symbol }: TechnicalIndicatorsProps) => {
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([]);
  const [activeIndicator, setActiveIndicator] = useState<'RSI' | 'MACD' | 'Volume'>('RSI');

  // Generate technical indicator data
  useEffect(() => {
    const generateIndicators = () => {
      const data: IndicatorData[] = [];
      
      for (let i = 0; i < 50; i++) {
        const timestamp = new Date(Date.now() - (50 - i) * 5 * 60 * 1000);
        
        // RSI (14-period) - oscillates between 0-100
        const rsi = 30 + Math.random() * 40 + Math.sin(i / 5) * 15;
        
        // Volume - varies significantly
        const volume = 50000 + Math.random() * 200000;
        
        // Moving averages
        const sma20 = 45000 + Math.sin(i / 10) * 5000 + Math.random() * 1000;
        const sma50 = 45000 + Math.sin(i / 20) * 3000 + Math.random() * 1000;
        
        // MACD
        const macd = Math.sin(i / 8) * 100 + Math.random() * 50 - 25;
        const signal = Math.sin(i / 8 - 0.5) * 80 + Math.random() * 30 - 15;
        
        data.push({
          time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rsi: parseFloat(rsi.toFixed(2)),
          volume: Math.round(volume),
          sma20: parseFloat(sma20.toFixed(2)),
          sma50: parseFloat(sma50.toFixed(2)),
          macd: parseFloat(macd.toFixed(2)),
          signal: parseFloat(signal.toFixed(2)),
        });
      }
      
      return data;
    };

    setIndicatorData(generateIndicators());

    // Update indicators every 10 seconds
    const interval = setInterval(() => {
      setIndicatorData(prev => {
        const newData = [...prev];
        const lastItem = newData[newData.length - 1];
        
        // Update with small variations
        newData[newData.length - 1] = {
          ...lastItem,
          rsi: Math.max(0, Math.min(100, lastItem.rsi + (Math.random() - 0.5) * 5)),
          volume: Math.max(10000, lastItem.volume + (Math.random() - 0.5) * 20000),
          macd: lastItem.macd + (Math.random() - 0.5) * 10,
          signal: lastItem.signal + (Math.random() - 0.5) * 8,
        };
        
        return newData;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [symbol]);

  const indicators = [
    { 
      key: 'RSI' as const, 
      label: 'RSI (14)', 
      icon: TrendingUp,
      color: '#f59e0b',
      description: 'Relative Strength Index'
    },
    { 
      key: 'MACD' as const, 
      label: 'MACD', 
      icon: TrendingDown,
      color: '#8b5cf6',
      description: 'Moving Average Convergence Divergence'
    },
    { 
      key: 'Volume' as const, 
      label: 'Volume', 
      icon: BarChart3,
      color: '#06b6d4',
      description: 'Trading Volume'
    }
  ];

  const renderIndicatorChart = () => {
    switch (activeIndicator) {
      case 'RSI':
        return (
          <div className="h-32">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-exchange-text-secondary">RSI (14)</span>
              <span className="text-sm font-mono text-exchange-text-primary">
                {indicatorData[indicatorData.length - 1]?.rsi.toFixed(2)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indicatorData}>
                <YAxis domain={[0, 100]} hide />
                <Line 
                  type="monotone" 
                  dataKey="rsi"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                {/* RSI levels */}
                <Line 
                  type="monotone" 
                  dataKey={() => 70}
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey={() => 30}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'MACD':
        return (
          <div className="h-32">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-exchange-text-secondary">MACD</span>
              <span className="text-sm font-mono text-exchange-text-primary">
                {indicatorData[indicatorData.length - 1]?.macd.toFixed(2)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indicatorData}>
                <YAxis hide />
                <Line 
                  type="monotone" 
                  dataKey="macd"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="signal"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'Volume':
        return (
          <div className="h-32">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-exchange-text-secondary">Volume</span>
              <span className="text-sm font-mono text-exchange-text-primary">
                {(indicatorData[indicatorData.length - 1]?.volume / 1000).toFixed(0)}K
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={indicatorData.slice(-20)}>
                <YAxis hide />
                <Bar dataKey="volume" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
    }
  };

  return (
    <div className="bg-exchange-accent/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-exchange-text-primary">Technical Indicators</h3>
        <div className="flex space-x-1 bg-exchange-accent/30 rounded-lg p-1">
          {indicators.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveIndicator(key)}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activeIndicator === key
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {renderIndicatorChart()}

      {/* Indicator interpretation */}
      <div className="mt-4 p-3 bg-exchange-accent/20 rounded-lg">
        <div className="text-xs text-exchange-text-secondary">
          {activeIndicator === 'RSI' && (
            <div>
              <strong>RSI Interpretation:</strong> Values above 70 suggest overbought conditions (red line), 
              while values below 30 indicate oversold conditions (green line).
            </div>
          )}
          {activeIndicator === 'MACD' && (
            <div>
              <strong>MACD Interpretation:</strong> When MACD line (purple) crosses above signal line (orange), 
              it may indicate a bullish trend. Crossover below suggests bearish momentum.
            </div>
          )}
          {activeIndicator === 'Volume' && (
            <div>
              <strong>Volume Interpretation:</strong> Higher volume often confirms price movements. 
              Increasing volume during price changes suggests stronger market conviction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicalIndicators;
