import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCryptoPrices, formatPrice, formatVolume, CRYPTO_ID_TO_SYMBOL } from '@/hooks/useCryptoPrices';
import Header from '../components/Header';
import MarketTicker from '../components/MarketTicker';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, Star, Lock, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ExchangePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prices, loading, error, lastUpdated, refetch } = useCryptoPrices(5000); // Faster updates - every 5 seconds
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'gainers' | 'losers'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter to show only supported trading pairs
  const supportedCryptos = prices.filter(crypto => {
    const symbol = CRYPTO_ID_TO_SYMBOL[crypto.id];
    return symbol && ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'DOGE', 'AVAX'].includes(symbol);
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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Market data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh market data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTradeClick = (symbol: string) => {
    const baseAsset = symbol.toUpperCase();
    const quoteAsset = 'USDT';
    console.log('ExchangePage - Navigating to trading pair:', `${baseAsset}/${quoteAsset}`);
    
    if (user) {
      navigate(`/trading/${baseAsset}/${quoteAsset}`);
      toast.success(`Opening ${baseAsset}/${quoteAsset} trading interface`);
    } else {
      toast.error('Please sign in to start trading');
      navigate('/auth');
    }
  };

  const handleQuickBuy = (symbol: string) => {
    const baseAsset = symbol.toUpperCase();
    const quoteAsset = 'USDT';
    console.log('ExchangePage - Quick buy for:', `${baseAsset}/${quoteAsset}`);
    
    if (user) {
      navigate(`/trading/${baseAsset}/${quoteAsset}?action=buy`);
      toast.success(`Quick buy for ${symbol} - redirecting to trading interface`);
    } else {
      toast.error('Please sign in to trade');
      navigate('/auth');
    }
  };

  const handleQuickSell = (symbol: string) => {
    const baseAsset = symbol.toUpperCase();
    const quoteAsset = 'USDT';
    console.log('ExchangePage - Quick sell for:', `${baseAsset}/${quoteAsset}`);
    
    if (user) {
      navigate(`/trading/${baseAsset}/${quoteAsset}?action=sell`);
      toast.success(`Quick sell for ${symbol} - redirecting to trading interface`);
    } else {
      toast.error('Please sign in to trade');
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      <MarketTicker />
      
      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Page Header with Live Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-exchange-text-primary mb-2">
                Live Cryptocurrency Markets
              </h1>
              <p className="text-exchange-text-secondary">
                Real-time cryptocurrency prices and market data - {supportedCryptos.length} supported pairs
              </p>
            </div>
            
            {/* Enhanced Live Status Indicator */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-exchange-panel border border-exchange-border rounded-lg px-4 py-2">
                {error && !prices.length ? (
                  <WifiOff className="w-4 h-4 text-exchange-red" />
                ) : error ? (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Wifi className="w-4 h-4 text-exchange-green animate-pulse" />
                )}
                <div className="text-sm">
                  <div className="text-exchange-text-primary font-medium">
                    {error && !prices.length ? 'Offline' : error ? 'Limited' : 'Live Market'}
                  </div>
                  <div className="text-xs text-exchange-text-secondary">
                    {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleManualRefresh} 
                disabled={isRefreshing}
                size="sm"
                className="bg-exchange-blue hover:bg-exchange-blue/90"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-600 text-sm">
                <AlertCircle className="w-4 h-4 inline-block mr-2" />
                {error} - {prices.length > 0 ? 'Showing cached data with auto-refresh' : 'Please refresh to try again'}
              </p>
            </div>
          )}
          
          {!user && (
            <div className="mt-4 p-4 bg-exchange-accent/30 border border-exchange-border rounded-lg">
              <p className="text-exchange-text-secondary text-sm">
                <Lock className="w-4 h-4 inline-block mr-2" />
                You're viewing live prices in read-only mode. <span className="text-exchange-blue cursor-pointer hover:underline" onClick={() => navigate('/auth')}>Sign in</span> to start trading.
              </p>
            </div>
          )}
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
            <RefreshCw className="w-8 h-8 text-exchange-blue mx-auto mb-4 animate-spin" />
            <div className="text-exchange-text-secondary">Loading live market data...</div>
          </div>
        )}

        {/* Error State */}
        {error && supportedCryptos.length === 0 && (
          <div className="bg-exchange-panel rounded-xl border border-exchange-border p-12 text-center">
            <WifiOff className="w-8 h-8 text-exchange-red mx-auto mb-4" />
            <div className="text-exchange-red mb-2">Unable to load live market data</div>
            <div className="text-exchange-text-secondary text-sm mb-4">Connection to market data failed</div>
            <button 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
              className="px-4 py-2 bg-exchange-blue text-white rounded-lg hover:bg-exchange-blue/90 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 inline-block ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry Connection
            </button>
          </div>
        )}

        {/* Enhanced Markets Table with Real-time Updates */}
        {supportedCryptos.length > 0 && (
          <div className="bg-exchange-panel rounded-xl border border-exchange-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-exchange-accent border-b border-exchange-border">
                  <tr>
                    <th className="text-left p-4 text-exchange-text-secondary font-medium">Market</th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <span>Live Price</span>
                        {!error && <Wifi className="w-3 h-3 text-exchange-green" />}
                      </div>
                    </th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">24h Change</th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">24h Volume</th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">Market Cap</th>
                    <th className="text-center p-4 text-exchange-text-secondary font-medium">Quick Actions</th>
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
                            <div className="cursor-pointer" onClick={() => handleTradeClick(symbol)}>
                              <div className="font-semibold text-exchange-text-primary hover:text-exchange-blue transition-colors">{tradingPair}</div>
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
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-2">
                            {user ? (
                              <>
                                <Button
                                  onClick={() => handleQuickBuy(symbol)}
                                  size="sm"
                                  className="bg-exchange-green hover:bg-exchange-green/90 text-white px-3 py-1 text-xs"
                                >
                                  Buy
                                </Button>
                                <Button
                                  onClick={() => handleQuickSell(symbol)}
                                  size="sm"
                                  className="bg-exchange-red hover:bg-exchange-red/90 text-white px-3 py-1 text-xs"
                                >
                                  Sell
                                </Button>
                                <Button
                                  onClick={() => handleTradeClick(symbol)}
                                  size="sm"
                                  className="bg-exchange-blue hover:bg-exchange-blue/90 text-white px-3 py-1 text-xs"
                                >
                                  Trade
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => navigate('/auth')}
                                size="sm"
                                className="bg-exchange-accent text-exchange-text-secondary border border-exchange-border hover:bg-exchange-blue hover:text-white px-4 py-2 text-xs"
                              >
                                Sign In to Trade
                              </Button>
                            )}
                          </div>
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
