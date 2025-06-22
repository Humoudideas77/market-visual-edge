
import React from 'react';
import { ChevronDown, Star } from 'lucide-react';
import { SUPPORTED_PAIRS, getPriceBySymbol } from '@/hooks/useCryptoPrices';
import { useCryptoPrices, formatPrice } from '@/hooks/useCryptoPrices';

interface MarketPairSelectorProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}

const MarketPairSelector = ({ selectedPair, onPairChange }: MarketPairSelectorProps) => {
  const { prices } = useCryptoPrices();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const currentPrice = getPriceBySymbol(prices, selectedPair.split('/')[0]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-exchange-panel border border-exchange-border rounded-lg px-4 py-3 min-w-[200px] hover:bg-exchange-accent/30 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="text-left">
            <div className="text-exchange-text-primary font-semibold">{selectedPair}</div>
            {currentPrice && (
              <div className="text-sm text-exchange-text-secondary">
                ${formatPrice(currentPrice.current_price)}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-exchange-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-exchange-panel border border-exchange-border rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
            <div className="p-3 border-b border-exchange-border">
              <div className="text-sm font-medium text-exchange-text-primary mb-2">Select Trading Pair</div>
              <input
                type="text"
                placeholder="Search pairs..."
                className="w-full px-3 py-2 bg-exchange-accent border border-exchange-border rounded text-exchange-text-primary placeholder:text-exchange-text-secondary text-sm focus:outline-none focus:ring-1 focus:ring-exchange-blue"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="p-2">
              <div className="text-xs text-exchange-text-secondary mb-2 px-2">USDT Markets</div>
              {SUPPORTED_PAIRS.map((pair) => {
                const [baseAsset] = pair.split('/');
                const priceData = getPriceBySymbol(prices, baseAsset);
                const isSelected = pair === selectedPair;
                const isPositive = priceData ? priceData.price_change_percentage_24h >= 0 : false;
                
                return (
                  <button
                    key={pair}
                    onClick={() => {
                      onPairChange(pair);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-exchange-accent/50 transition-colors ${
                      isSelected ? 'bg-exchange-blue/20 border border-exchange-blue/30' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-exchange-text-secondary hover:text-yellow-500 cursor-pointer" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-exchange-text-primary">{pair}</div>
                        <div className="text-xs text-exchange-text-secondary">{baseAsset}</div>
                      </div>
                    </div>
                    
                    {priceData && (
                      <div className="text-right">
                        <div className="text-sm font-mono text-exchange-text-primary">
                          ${formatPrice(priceData.current_price)}
                        </div>
                        <div className={`text-xs font-mono ${
                          isPositive ? 'text-exchange-green' : 'text-exchange-red'
                        }`}>
                          {isPositive ? '+' : ''}{priceData.price_change_percentage_24h.toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MarketPairSelector;
