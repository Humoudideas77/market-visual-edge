
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MarketTicker from '../components/MarketTicker';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, Star } from 'lucide-react';

interface MarketData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
  marketCap: string;
  isPositive: boolean;
}

const ExchangePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'gainers' | 'losers'>('all');

  const markets: MarketData[] = [
    { symbol: 'BTC/USDT', name: 'Bitcoin', price: '43,250.00', change: '+1,250.00', changePercent: '+2.98%', volume: '1.2B', marketCap: '847B', isPositive: true },
    { symbol: 'ETH/USDT', name: 'Ethereum', price: '2,650.50', change: '+85.20', changePercent: '+3.32%', volume: '890M', marketCap: '318B', isPositive: true },
    { symbol: 'BNB/USDT', name: 'BNB', price: '315.80', change: '-5.40', changePercent: '-1.68%', volume: '340M', marketCap: '47B', isPositive: false },
    { symbol: 'ADA/USDT', name: 'Cardano', price: '0.4820', change: '+0.0180', changePercent: '+3.88%', volume: '180M', marketCap: '17B', isPositive: true },
    { symbol: 'SOL/USDT', name: 'Solana', price: '98.45', change: '+4.25', changePercent: '+4.51%', volume: '425M', marketCap: '43B', isPositive: true },
    { symbol: 'XRP/USDT', name: 'Ripple', price: '0.6150', change: '-0.0085', changePercent: '-1.36%', volume: '290M', marketCap: '33B', isPositive: false },
    { symbol: 'DOT/USDT', name: 'Polkadot', price: '7.24', change: '+0.15', changePercent: '+2.12%', volume: '145M', marketCap: '9B', isPositive: true },
    { symbol: 'LINK/USDT', name: 'Chainlink', price: '14.85', change: '-0.32', changePercent: '-2.11%', volume: '167M', marketCap: '8.2B', isPositive: false },
  ];

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         market.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'gainers':
        return matchesSearch && market.isPositive;
      case 'losers':
        return matchesSearch && !market.isPositive;
      default:
        return matchesSearch;
    }
  });

  const handleTradeClick = (symbol: string) => {
    navigate(`/trading/${symbol.replace('/', '-')}`);
  };

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      <MarketTicker />
      
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-exchange-text-primary mb-2">
            Cryptocurrency Markets
          </h1>
          <p className="text-exchange-text-secondary">
            Real-time cryptocurrency prices and market data
          </p>
        </div>

        {/* Controls */}
        <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-exchange-text-secondary" />
              <input
                type="text"
                placeholder="Search cryptocurrency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-exchange-accent border border-exchange-border rounded-lg text-exchange-text-primary placeholder:text-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-exchange-blue"
              />
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Markets' },
                { key: 'favorites', label: 'Favorites' },
                { key: 'gainers', label: 'Top Gainers' },
                { key: 'losers', label: 'Top Losers' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-exchange-blue text-white'
                      : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Markets Table */}
        <div className="bg-exchange-panel rounded-xl border border-exchange-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-exchange-accent border-b border-exchange-border">
                <tr>
                  <th className="text-left p-4 text-exchange-text-secondary font-medium">Market</th>
                  <th className="text-right p-4 text-exchange-text-secondary font-medium">Price</th>
                  <th className="text-right p-4 text-exchange-text-secondary font-medium">24h Change</th>
                  <th className="text-right p-4 text-exchange-text-secondary font-medium">24h Volume</th>
                  <th className="text-right p-4 text-exchange-text-secondary font-medium">Market Cap</th>
                  <th className="text-center p-4 text-exchange-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkets.map((market, index) => (
                  <tr key={index} className="border-b border-exchange-border/30 hover:bg-exchange-accent/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <button className="text-exchange-text-secondary hover:text-yellow-500 transition-colors">
                          <Star className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="font-semibold text-exchange-text-primary">{market.symbol}</div>
                          <div className="text-sm text-exchange-text-secondary">{market.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono text-exchange-text-primary font-semibold">
                        ${market.price}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`font-mono ${market.isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                        <div className="flex items-center justify-end space-x-1">
                          {market.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{market.changePercent}</span>
                        </div>
                        <div className="text-sm">{market.change}</div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono text-exchange-text-primary">${market.volume}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono text-exchange-text-primary">${market.marketCap}</div>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        onClick={() => handleTradeClick(market.symbol)}
                        className="bg-exchange-blue hover:bg-exchange-blue/90 text-white px-4 py-2"
                      >
                        Trade
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMarkets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-exchange-text-secondary">
                No markets found matching your search criteria.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExchangePage;
