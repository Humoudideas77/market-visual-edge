
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCryptoPrices, formatPrice, formatVolume, SUPPORTED_PAIRS, CRYPTO_ID_TO_SYMBOL } from '@/hooks/useCryptoPrices';
import Header from '../components/Header';
import MarketTicker from '../components/MarketTicker';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, Star, Lock, Wifi, WifiOff } from 'lucide-react';

const ExchangePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prices, loading, error, lastUpdated } = useCryptoPrices(8000);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'gainers' | 'losers'>('all');

  // Filter to show only supported trading pairs
  const supportedCryptos = prices.filter(crypto => {
    const symbol = CRYPTO_ID_TO_SYMBOL[crypto.id];
    return symbol && SUPPORTED_PAIRS.some(pair => pair.startsWith(symbol + '/'));
  });

  const filteredMarkets = supportedCryptos.filter(crypto => {
    const matchesSearch = crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crypto.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'gainers':
        return matchesSearch && crypto.price_change_percentage_24h > 0;
      case 'losers':
        return matchesSearch && crypto.price_change_percentage_24h < 0;
      default:
        return matchesSearch;
    }
  });

  const handleTradeClick = (symbol: string) => {
    if (user) {
      const tradingPair = `${symbol.toUpperCase()}/USDT`;
      navigate(`/trading/${tradingPair}`);
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      <MarketTicker />
      
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-exchange-text-primary mb-2">
                Cryptocurrency Markets
              </h1>
              <p className="text-exchange-text-secondary">
                Real-time cryptocurrency prices and market data - {supportedCryptos.length} supported pairs
              </p>
            </div>
            
            {/* Live Status Indicator */}
            <div className="flex items-center space-x-2 bg-exchange-panel border border-exchange-border rounded-lg px-4 py-2">
              {error ? (
                <WifiOff className="w-4 h-4 text-exchange-red" />
              ) : (
                <Wifi className="w-4 h-4 text-exchange-green" />
              )}
              <div className="text-sm">
                <div className="text-exchange-text-primary font-medium">
                  {error ? 'Offline' : 'Live'}
                </div>
                <div className="text-xs text-exchange-text-secondary">
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
                </div>
              </div>
            </div>
          </div>
          
          {!user && (
            <div className="mt-4 p-4 bg-exchange-accent/30 border border-exchange-border rounded-lg">
              <p className="text-exchange-text-secondary text-sm">
                <Lock className="w-4 h-4 inline-block mr-2" />
                You're viewing in read-only mode. <span className="text-exchange-blue cursor-pointer hover:underline" onClick={() => navigate('/auth')}>Sign in</span> to start trading.
              </p>
            </div>
          )}
        </div>

        {/* Supported Pairs Overview */}
        <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6 mb-8">
          <h3 className="text-lg font-semibold text-exchange-text-primary mb-4">Supported Trading Pairs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {SUPPORTED_PAIRS.map((pair) => (
              <div key={pair} className="bg-exchange-accent/30 rounded px-3 py-2 text-center">
                <span className="text-sm font-mono text-exchange-text-primary">{pair}</span>
              </div>
            ))}
          </div>
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

        {/* Loading State */}
        {loading && supportedCryptos.length === 0 && (
          <div className="bg-exchange-panel rounded-xl border border-exchange-border p-12 text-center">
            <div className="text-exchange-text-secondary">Loading real-time market data...</div>
          </div>
        )}

        {/* Error State */}
        {error && supportedCryptos.length === 0 && (
          <div className="bg-exchange-panel rounded-xl border border-exchange-border p-12 text-center">
            <WifiOff className="w-8 h-8 text-exchange-red mx-auto mb-4" />
            <div className="text-exchange-red mb-2">Unable to load market data</div>
            <div className="text-exchange-text-secondary text-sm">Please check your connection and try again</div>
          </div>
        )}

        {/* Markets Table */}
        {supportedCryptos.length > 0 && (
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
                  {filteredMarkets.map((crypto) => {
                    const isPositive = crypto.price_change_percentage_24h >= 0;
                    const symbol = CRYPTO_ID_TO_SYMBOL[crypto.id];
                    const tradingPair = `${symbol}/USDT`;
                    
                    return (
                      <tr key={crypto.id} className="border-b border-exchange-border/30 hover:bg-exchange-accent/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {user && (
                              <button className="text-exchange-text-secondary hover:text-yellow-500 transition-colors">
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                            <div>
                              <div className="font-semibold text-exchange-text-primary">{tradingPair}</div>
                              <div className="text-sm text-exchange-text-secondary">{crypto.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono text-exchange-text-primary font-semibold">
                            ${formatPrice(crypto.current_price)}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-mono ${isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                            <div className="flex items-center justify-end space-x-1">
                              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              <span>{isPositive ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%</span>
                            </div>
                            <div className="text-sm">
                              {isPositive ? '+' : ''}${Math.abs(crypto.price_change_24h).toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono text-exchange-text-primary">${formatVolume(crypto.total_volume)}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono text-exchange-text-primary">${formatVolume(crypto.market_cap)}</div>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            onClick={() => handleTradeClick(symbol)}
                            className={`px-4 py-2 ${
                              user 
                                ? 'bg-exchange-blue hover:bg-exchange-blue/90 text-white' 
                                : 'bg-exchange-accent text-exchange-text-secondary border border-exchange-border hover:bg-exchange-blue hover:text-white'
                            }`}
                          >
                            {user ? 'Trade' : 'Sign In to Trade'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredMarkets.length === 0 && supportedCryptos.length > 0 && (
              <div className="text-center py-12">
                <div className="text-exchange-text-secondary">
                  No markets found matching your search criteria.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangePage;
