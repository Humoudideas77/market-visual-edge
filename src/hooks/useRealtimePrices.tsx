
import { useState, useEffect, useCallback } from 'react';
import { useCryptoPrices } from './useCryptoPrices';

interface RealtimePriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface UseRealtimePricesReturn {
  realtimePrices: Map<string, RealtimePriceUpdate>;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  isConnected: boolean;
}

export const useRealtimePrices = (): UseRealtimePricesReturn => {
  const [realtimePrices, setRealtimePrices] = useState<Map<string, RealtimePriceUpdate>>(new Map());
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(true);
  const { prices } = useCryptoPrices();

  const subscribeToSymbol = useCallback((symbol: string) => {
    console.log(`[RealtimePrices] Subscribing to ${symbol}`);
    setSubscribedSymbols(prev => new Set([...prev, symbol]));
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    console.log(`[RealtimePrices] Unsubscribing from ${symbol}`);
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      newSet.delete(symbol);
      return newSet;
    });
  }, []);

  // Professional-grade controlled price updates - very stable
  useEffect(() => {
    if (subscribedSymbols.size === 0) return;

    console.log(`[RealtimePrices] Starting price updates for ${subscribedSymbols.size} symbols`);

    const updateInterval = setInterval(() => {
      setRealtimePrices(prevPrices => {
        const newPrices = new Map(prevPrices);
        
        subscribedSymbols.forEach(symbol => {
          const baseAsset = symbol.split('/')[0];
          const cryptoData = prices.find(p => p.symbol.toUpperCase() === baseAsset);
          
          if (cryptoData) {
            const currentPrice = cryptoData.current_price;
            const previousUpdate = newPrices.get(symbol);
            const lastPrice = previousUpdate?.price || currentPrice;
            
            // Very controlled price movement - professional stability
            const baseVolatility = 0.0001; // Reduced to 0.01% max movement
            const randomChange = (Math.random() - 0.5) * baseVolatility;
            const marketTrend = (cryptoData.price_change_percentage_24h / 100) * 0.00005; // Very minimal trend impact
            
            const newPrice = lastPrice * (1 + randomChange + marketTrend);
            const priceChange = newPrice - lastPrice;
            const changePercent = (priceChange / lastPrice) * 100;
            
            newPrices.set(symbol, {
              symbol,
              price: parseFloat(newPrice.toFixed(2)),
              change: parseFloat(priceChange.toFixed(4)),
              changePercent: parseFloat(changePercent.toFixed(6)),
              timestamp: Date.now()
            });
          }
        });
        
        return newPrices;
      });
    }, 10000); // Update every 10 seconds - much more stable

    return () => {
      console.log('[RealtimePrices] Cleaning up price update interval');
      clearInterval(updateInterval);
    };
  }, [subscribedSymbols, prices]);

  return {
    realtimePrices,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    isConnected
  };
};
