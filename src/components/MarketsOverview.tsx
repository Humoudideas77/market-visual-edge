
import React, { useState } from 'react';
import { Search, Star } from 'lucide-react';

interface Market {
  pair: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
  high24h: string;
  low24h: string;
  isFavorite: boolean;
}

const MarketsOverview = () => {
  const [activeTab, setActiveTab] = useState('favorites');
  const [searchTerm, setSearchTerm] = useState('');

  const [markets] = useState<Market[]>([
    { pair: 'BTC/USDT', price: '43,249.80', change: '+1,250.00', changePercent: '+2.98%', volume: '1.2B', high24h: '44,100.00', low24h: '41,800.00', isFavorite: true },
    { pair: 'ETH/USDT', price: '2,650.50', change: '+85.20', changePercent: '+3.32%', volume: '890M', high24h: '2,720.00', low24h: '2,520.00', isFavorite: true },
    { pair: 'BNB/USDT', price: '315.80', change: '-5.40', changePercent: '-1.68%', volume: '340M', high24h: '325.60', low24h: '310.20', isFavorite: false },
    { pair: 'ADA/USDT', price: '0.4820', change: '+0.0180', changePercent: '+3.88%', volume: '180M', high24h: '0.4950', low24h: '0.4600', isFavorite: true },
    { pair: 'SOL/USDT', price: '98.45', change: '+4.25', changePercent: '+4.51%', volume: '425M', high24h: '102.30', low24h: '93.80', isFavorite: false },
    { pair: 'XRP/USDT', price: '0.6150', change: '-0.0085', changePercent: '-1.36%', volume: '290M', high24h: '0.6280', low24h: '0.6050', isFavorite: true },
    { pair: 'DOGE/USDT', price: '0.0876', change: '+0.0045', changePercent: '+5.41%', volume: '156M', high24h: '0.0920', low24h: '0.0820', isFavorite: false },
    { pair: 'AVAX/USDT', price: '36.84', change: '+1.24', changePercent: '+3.48%', volume: '98M', high24h: '38.20', low24h: '35.10', isFavorite: false },
  ]);

  const tabs = [
    { id: 'favorites', label: 'Favorites', count: markets.filter(m => m.isFavorite).length },
    { id: 'spot', label: 'Spot', count: markets.length },
    { id: 'futures', label: 'Futures', count: 45 },
    { id: 'innovation', label: 'Innovation', count: 12 },
  ];

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.pair.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'favorites' ? market.isFavorite : true;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6">
      <div className="exchange-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-exchange-text-primary">Markets Overview</h2>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-exchange-text-muted" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="exchange-input pl-10 w-64"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-exchange-accent rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Market Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-exchange-accent p-4 rounded-lg">
            <div className="text-exchange-text-secondary text-sm mb-1">24h Volume</div>
            <div className="text-exchange-text-primary text-xl font-bold">$2.4B</div>
            <div className="text-exchange-green text-sm">+12.5%</div>
          </div>
          <div className="bg-exchange-accent p-4 rounded-lg">
            <div className="text-exchange-text-secondary text-sm mb-1">Active Pairs</div>
            <div className="text-exchange-text-primary text-xl font-bold">1,247</div>
            <div className="text-exchange-green text-sm">+3 New</div>
          </div>
          <div className="bg-exchange-accent p-4 rounded-lg">
            <div className="text-exchange-text-secondary text-sm mb-1">Market Cap</div>
            <div className="text-exchange-text-primary text-xl font-bold">$1.7T</div>
            <div className="text-exchange-green text-sm">+2.1%</div>
          </div>
          <div className="bg-exchange-accent p-4 rounded-lg">
            <div className="text-exchange-text-secondary text-sm mb-1">Fear & Greed</div>
            <div className="text-exchange-yellow text-xl font-bold">72</div>
            <div className="text-exchange-text-secondary text-sm">Greed</div>
          </div>
        </div>

        {/* Markets Table */}
        <div className="overflow-x-auto">
          <table className="trading-table">
            <thead>
              <tr>
                <th></th>
                <th>Pair</th>
                <th className="text-right">Last Price</th>
                <th className="text-right">24h Change</th>
                <th className="text-right">24h Volume</th>
                <th className="text-right">24h High</th>
                <th className="text-right">24h Low</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkets.map((market, index) => (
                <tr key={index} className="market-row">
                  <td>
                    <Star 
                      className={`w-4 h-4 cursor-pointer ${
                        market.isFavorite ? 'text-exchange-yellow fill-current' : 'text-exchange-text-muted'
                      }`}
                    />
                  </td>
                  <td>
                    <div className="font-medium text-exchange-text-primary">{market.pair}</div>
                  </td>
                  <td className="text-right text-exchange-text-primary">${market.price}</td>
                  <td className="text-right">
                    <div className={market.change.startsWith('+') ? 'text-exchange-green' : 'text-exchange-red'}>
                      {market.changePercent}
                    </div>
                    <div className={`text-xs ${market.change.startsWith('+') ? 'text-exchange-green' : 'text-exchange-red'}`}>
                      {market.change}
                    </div>
                  </td>
                  <td className="text-right text-exchange-text-secondary">${market.volume}</td>
                  <td className="text-right text-exchange-text-secondary">${market.high24h}</td>
                  <td className="text-right text-exchange-text-secondary">${market.low24h}</td>
                  <td>
                    <button className="text-exchange-blue hover:text-exchange-blue/80 text-sm">
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketsOverview;
