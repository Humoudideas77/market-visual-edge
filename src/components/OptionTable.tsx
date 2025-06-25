
import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface OptionData {
  strike: number;
  expiry: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

interface OptionTableProps {
  selectedPair: string;
}

const OptionTable = ({ selectedPair }: OptionTableProps) => {
  const [selectedExpiry, setSelectedExpiry] = useState('1D');
  const [filterType, setFilterType] = useState<'all' | 'call' | 'put'>('all');

  // Generate mock option data
  const generateOptionData = (): OptionData[] => {
    const basePrice = 43250; // BTC price
    const strikes = [];
    
    // Generate strikes around current price
    for (let i = -10; i <= 10; i++) {
      const strike = basePrice + (i * 500);
      
      // Generate call option
      strikes.push({
        strike,
        expiry: selectedExpiry,
        type: 'call' as const,
        bid: Math.max(0, (basePrice - strike) + Math.random() * 100),
        ask: Math.max(0, (basePrice - strike) + Math.random() * 100 + 10),
        volume: Math.floor(Math.random() * 1000),
        openInterest: Math.floor(Math.random() * 5000),
        iv: 0.2 + Math.random() * 0.5,
        delta: Math.max(0, Math.min(1, 0.5 + (basePrice - strike) / 10000)),
        gamma: Math.random() * 0.01,
        theta: -Math.random() * 10,
        vega: Math.random() * 20
      });
      
      // Generate put option
      strikes.push({
        strike,
        expiry: selectedExpiry,
        type: 'put' as const,
        bid: Math.max(0, (strike - basePrice) + Math.random() * 100),
        ask: Math.max(0, (strike - basePrice) + Math.random() * 100 + 10),
        volume: Math.floor(Math.random() * 1000),
        openInterest: Math.floor(Math.random() * 5000),
        iv: 0.2 + Math.random() * 0.5,
        delta: Math.max(-1, Math.min(0, -0.5 + (basePrice - strike) / 10000)),
        gamma: Math.random() * 0.01,
        theta: -Math.random() * 10,
        vega: Math.random() * 20
      });
    }
    
    return strikes.filter(option => 
      filterType === 'all' || option.type === filterType
    ).sort((a, b) => b.strike - a.strike);
  };

  const optionData = generateOptionData();
  const expiryOptions = ['1H', '4H', '1D', '3D', '1W', '1M'];

  return (
    <div className="exchange-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-exchange-text-primary">Option Chain - {selectedPair}</h3>
        
        <div className="flex items-center space-x-4">
          {/* Expiry Selector */}
          <div className="flex space-x-1">
            {expiryOptions.map((expiry) => (
              <button
                key={expiry}
                onClick={() => setSelectedExpiry(expiry)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedExpiry === expiry
                    ? 'bg-exchange-blue text-white'
                    : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
                }`}
              >
                {expiry}
              </button>
            ))}
          </div>
          
          {/* Type Filter */}
          <div className="flex space-x-1">
            {['all', 'call', 'put'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as 'all' | 'call' | 'put')}
                className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                  filterType === type
                    ? 'bg-exchange-blue text-white'
                    : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Option Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-exchange-border">
              <th className="text-left py-2 text-exchange-text-secondary">Strike</th>
              <th className="text-left py-2 text-exchange-text-secondary">Type</th>
              <th className="text-right py-2 text-exchange-text-secondary">Bid</th>
              <th className="text-right py-2 text-exchange-text-secondary">Ask</th>
              <th className="text-right py-2 text-exchange-text-secondary">Volume</th>
              <th className="text-right py-2 text-exchange-text-secondary">OI</th>
              <th className="text-right py-2 text-exchange-text-secondary">IV</th>
              <th className="text-right py-2 text-exchange-text-secondary">Delta</th>
              <th className="text-right py-2 text-exchange-text-secondary">Gamma</th>
              <th className="text-right py-2 text-exchange-text-secondary">Theta</th>
              <th className="text-right py-2 text-exchange-text-secondary">Vega</th>
            </tr>
          </thead>
          <tbody>
            {optionData.slice(0, 20).map((option, index) => (
              <tr key={index} className="hover:bg-exchange-accent/20 cursor-pointer">
                <td className="py-1 font-mono text-exchange-text-primary">
                  ${option.strike.toLocaleString()}
                </td>
                <td className="py-1">
                  <span className={`inline-flex items-center space-x-1 ${
                    option.type === 'call' ? 'text-exchange-green' : 'text-exchange-red'
                  }`}>
                    {option.type === 'call' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="uppercase font-medium">{option.type}</span>
                  </span>
                </td>
                <td className="py-1 text-right font-mono text-exchange-text-primary">
                  ${option.bid.toFixed(2)}
                </td>
                <td className="py-1 text-right font-mono text-exchange-text-primary">
                  ${option.ask.toFixed(2)}
                </td>
                <td className="py-1 text-right font-mono text-exchange-text-secondary">
                  {option.volume.toLocaleString()}
                </td>
                <td className="py-1 text-right font-mono text-exchange-text-secondary">
                  {option.openInterest.toLocaleString()}
                </td>
                <td className="py-1 text-right font-mono text-exchange-text-primary">
                  {(option.iv * 100).toFixed(1)}%
                </td>
                <td className="py-1 text-right font-mono text-exchange-text-primary">
                  {option.delta.toFixed(3)}
                </td>
                <td className="py-1 text-right font-mono text-exchange-text-secondary">
                  {option.gamma.toFixed(4)}
                </td>
                <td className="py-1 text-right font-mono text-exchange-text-secondary">
                  {option.theta.toFixed(2)}
                </td>
                <td className="py-1 text-right font-mono text-exchange-text-secondary">
                  {option.vega.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionTable;
