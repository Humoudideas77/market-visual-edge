
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
    setSubscribedSymbols(prev => new Set([...prev, symbol]));
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      newSet.delete(symbol);
      return newSet;
    });
  }, []);

  // Controlled price updates - slower and more realistic
  useEffect(() => {
    if (subscribedSymbols.size === 0) return;

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
            
            // More controlled price movement - less volatile
            const volatility = 0.0008; // Reduced volatility
            const randomChange = (Math.random() - 0.5) * volatility;
            const marketTrend = (cryptoData.price_change_percentage_24h / 100) * 0.0005; // Reduced trend impact
            
            const newPrice = lastPrice * (1 + randomChange + marketTrend);
            const priceChange = newPrice - lastPrice;
            const changePercent = (priceChange / lastPrice) * 100;
            
            newPrices.set(symbol, {
              symbol,
              price: parseFloat(newPrice.toFixed(2)),
              change: parseFloat(priceChange.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(4)),
              timestamp: Date.now()
            });
          }
        });
        
        return newPrices;
      });
    }, 3000); // Update every 3 seconds instead of 1 second

    return () => clearInterval(updateInterval);
  }, [subscribedSymbols, prices]);

  return {
    realtimePrices,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    isConnected
  };
};
