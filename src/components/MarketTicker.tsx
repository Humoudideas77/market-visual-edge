
import React from 'react';
import { useCryptoPrices, formatPrice } from '@/hooks/useCryptoPrices';
import { TrendingUp, TrendingDown, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const MarketTicker = () => {
  const { prices, loading, error, lastUpdated, refetch } = useCryptoPrices(30000); // Update every 30 seconds

  const handleRefresh = () => {
    console.log('[MarketTicker] Manual refresh triggered');
    refetch();
  };

  if (loading && prices.length === 0) {
    return (
      <div className="bg-exchange-panel border-b border-exchange-border">
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-4 h-4 text-exchange-blue animate-spin mr-2" />
          <div className="text-exchange-text-secondary">Loading market data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-exchange-panel border-b border-exchange-border">
      <div className="flex overflow-x-auto py-3 px-6 space-x-8">
        {/* Enhanced connection status indicator */}
        <div className="flex-shrink-0 flex items-center space-x-3 min-w-[160px]">
          <div className="flex items-center space-x-1">
            {error ? (
              <WifiOff className="w-3 h-3 text-orange-500" />
            ) : (
              <Wifi className="w-3 h-3 text-exchange-green" />
            )}
            <span className="text-xs text-exchange-text-secondary">
              {error ? 'Offline Mode' : 'Live Data'}
            </span>
          </div>
          <div className="text-xs text-exchange-text-secondary">
            {lastUpdated ? `${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </div>
          <button 
            onClick={handleRefresh}
            className="text-exchange-blue hover:text-exchange-blue/80 transition-colors"
            title="Refresh prices"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {prices.slice(0, 6).map((crypto) => {
          const isPositive = crypto.price_change_percentage_24h >= 0;
          const symbol = crypto.symbol.toUpperCase();
          
          return (
            <div key={crypto.id} className="flex-shrink-0 flex items-center space-x-4 min-w-[220px]">
              <div>
                <div className="text-exchange-text-primary font-medium text-sm">
                  {symbol}/USDT
                </div>
                <div className="text-exchange-text-secondary text-xs">
                  Vol: {crypto.total_volume >= 1e9 
                    ? `${(crypto.total_volume / 1e9).toFixed(1)}B` 
                    : `${(crypto.total_volume / 1e6).toFixed(0)}M`
                  }
                </div>
              </div>
              <div className="text-right">
                <div className="text-exchange-text-primary font-mono text-sm font-semibold">
                  ${formatPrice(crypto.current_price)}
                </div>
                <div className={`text-xs font-mono flex items-center ${
                  isPositive ? 'text-exchange-green' : 'text-exchange-red'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {isPositive ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketTicker;
