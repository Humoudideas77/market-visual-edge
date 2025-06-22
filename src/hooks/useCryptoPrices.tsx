
import { useState, useEffect } from 'react';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

interface UseCryptoPricesReturn {
  prices: CryptoPrice[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Expanded list of supported cryptocurrencies
const CRYPTO_IDS = 'bitcoin,ethereum,binancecoin,cardano,solana,ripple,polkadot,chainlink,dogecoin,avalanche-2,litecoin,bitcoin-cash,tether';

// Supported trading pairs
export const SUPPORTED_PAIRS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'XRP/USDT',
  'BNB/USDT',
  'LTC/USDT',
  'BCH/USDT',
  'ADA/USDT',
  'DOT/USDT',
  'LINK/USDT',
  'DOGE/USDT',
  'AVAX/USDT'
];

// Map crypto IDs to symbols for easy lookup
export const CRYPTO_ID_TO_SYMBOL: { [key: string]: string } = {
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'binancecoin': 'BNB',
  'cardano': 'ADA',
  'solana': 'SOL',
  'ripple': 'XRP',
  'polkadot': 'DOT',
  'chainlink': 'LINK',
  'dogecoin': 'DOGE',
  'avalanche-2': 'AVAX',
  'litecoin': 'LTC',
  'bitcoin-cash': 'BCH',
  'tether': 'USDT'
};

export const useCryptoPrices = (refreshInterval: number = 8000): UseCryptoPricesReturn => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS}&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CryptoPrice[] = await response.json();
      setPrices(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching crypto prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPrices();

    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { prices, loading, error, lastUpdated };
};

// Helper function to get price by symbol
export const getPriceBySymbol = (prices: CryptoPrice[], symbol: string): CryptoPrice | null => {
  return prices.find(price => CRYPTO_ID_TO_SYMBOL[price.id] === symbol.toUpperCase()) || null;
};

// Helper function to format price
export const formatPrice = (price: number): string => {
  if (price < 1) {
    return price.toFixed(4);
  } else if (price < 100) {
    return price.toFixed(2);
  } else {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
};

// Helper function to format market cap/volume
export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(1)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(0)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(0)}K`;
  }
  return volume.toString();
};
