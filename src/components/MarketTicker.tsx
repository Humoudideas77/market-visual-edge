
import React, { useState, useEffect } from 'react';

interface MarketData {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
}

const MarketTicker = () => {
  const [markets, setMarkets] = useState<MarketData[]>([
    { symbol: 'BTC/USDT', price: '43,250.00', change: '+1,250.00', changePercent: '+2.98%', volume: '1.2B' },
    { symbol: 'ETH/USDT', price: '2,650.50', change: '+85.20', changePercent: '+3.32%', volume: '890M' },
    { symbol: 'BNB/USDT', price: '315.80', change: '-5.40', changePercent: '-1.68%', volume: '340M' },
    { symbol: 'ADA/USDT', price: '0.4820', change: '+0.0180', changePercent: '+3.88%', volume: '180M' },
    { symbol: 'SOL/USDT', price: '98.45', change: '+4.25', changePercent: '+4.51%', volume: '425M' },
    { symbol: 'XRP/USDT', price: '0.6150', change: '-0.0085', changePercent: '-1.36%', volume: '290M' },
  ]);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets(prev => prev.map(market => ({
        ...market,
        price: (parseFloat(market.price.replace(',', '')) + (Math.random() - 0.5) * 0.01).toLocaleString('en-US', { minimumFractionDigits: 2 })
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-exchange-panel border-b border-exchange-border">
      <div className="flex overflow-x-auto py-3 px-6 space-x-8">
        {markets.map((market, index) => (
          <div key={index} className="flex-shrink-0 flex items-center space-x-4 min-w-[200px]">
            <div>
              <div className="text-exchange-text-primary font-medium text-sm">{market.symbol}</div>
              <div className="text-exchange-text-secondary text-xs">Vol: {market.volume}</div>
            </div>
            <div className="text-right">
              <div className="text-exchange-text-primary font-mono text-sm">${market.price}</div>
              <div className={`text-xs font-mono ${market.change.startsWith('+') ? 'text-exchange-green' : 'text-exchange-red'}`}>
                {market.change} ({market.changePercent})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;
