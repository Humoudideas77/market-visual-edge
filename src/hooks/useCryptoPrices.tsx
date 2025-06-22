
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

// Mock data fallback when API fails
const getMockPrices = (): CryptoPrice[] => [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    current_price: 43250.00,
    price_change_24h: 1250.50,
    price_change_percentage_24h: 2.98,
    market_cap: 850000000000,
    total_volume: 28500000000,
    high_24h: 43800.00,
    low_24h: 41900.00,
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 2650.75,
    price_change_24h: -85.25,
    price_change_percentage_24h: -3.12,
    market_cap: 320000000000,
    total_volume: 15200000000,
    high_24h: 2750.00,
    low_24h: 2580.00,
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    current_price: 98.45,
    price_change_24h: 4.25,
    price_change_percentage_24h: 4.51,
    market_cap: 45000000000,
    total_volume: 2500000000,
    high_24h: 102.00,
    low_24h: 94.20,
  },
  {
    id: 'ripple',
    symbol: 'xrp',
    name: 'XRP',
    current_price: 0.52,
    price_change_24h: 0.03,
    price_change_percentage_24h: 6.12,
    market_cap: 28000000000,
    total_volume: 1200000000,
    high_24h: 0.55,
    low_24h: 0.49,
  },
  {
    id: 'binancecoin',
    symbol: 'bnb',
    name: 'BNB',
    current_price: 315.20,
    price_change_24h: -12.80,
    price_change_percentage_24h: -3.90,
    market_cap: 47000000000,
    total_volume: 1800000000,
    high_24h: 328.00,
    low_24h: 312.50,
  },
  {
    id: 'litecoin',
    symbol: 'ltc',
    name: 'Litecoin',
    current_price: 72.15,
    price_change_24h: 2.35,
    price_change_percentage_24h: 3.37,
    market_cap: 5400000000,
    total_volume: 450000000,
    high_24h: 75.00,
    low_24h: 69.80,
  },
  {
    id: 'bitcoin-cash',
    symbol: 'bch',
    name: 'Bitcoin Cash',
    current_price: 245.80,
    price_change_24h: -8.20,
    price_change_percentage_24h: -3.23,
    market_cap: 4900000000,
    total_volume: 380000000,
    high_24h: 255.00,
    low_24h: 242.50,
  },
  {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    current_price: 0.38,
    price_change_24h: 0.02,
    price_change_percentage_24h: 5.56,
    market_cap: 13500000000,
    total_volume: 650000000,
    high_24h: 0.40,
    low_24h: 0.36,
  },
  {
    id: 'polkadot',
    symbol: 'dot',
    name: 'Polkadot',
    current_price: 5.85,
    price_change_24h: 0.15,
    price_change_percentage_24h: 2.63,
    market_cap: 8500000000,
    total_volume: 280000000,
    high_24h: 6.10,
    low_24h: 5.70,
  },
  {
    id: 'chainlink',
    symbol: 'link',
    name: 'Chainlink',
    current_price: 14.25,
    price_change_24h: -0.75,
    price_change_percentage_24h: -5.00,
    market_cap: 8800000000,
    total_volume: 420000000,
    high_24h: 15.20,
    low_24h: 14.00,
  },
  {
    id: 'dogecoin',
    symbol: 'doge',
    name: 'Dogecoin',
    current_price: 0.085,
    price_change_24h: 0.008,
    price_change_percentage_24h: 10.39,
    market_cap: 12200000000,
    total_volume: 890000000,
    high_24h: 0.092,
    low_24h: 0.077,
  },
  {
    id: 'avalanche-2',
    symbol: 'avax',
    name: 'Avalanche',
    current_price: 26.80,
    price_change_24h: 1.20,
    price_change_percentage_24h: 4.69,
    market_cap: 11000000000,
    total_volume: 520000000,
    high_24h: 28.50,
    low_24h: 25.60,
  }
];

export const useCryptoPrices = (refreshInterval: number = 10000): UseCryptoPricesReturn => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchPrices = async () => {
    try {
      console.log('Fetching crypto prices...');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS}&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CryptoPrice[] = await response.json();
      console.log('Successfully fetched crypto prices:', data.length, 'items');
      setPrices(data);
      setLastUpdated(new Date());
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching crypto prices:', err);
      setRetryCount(prev => prev + 1);
      
      // Use mock data as fallback after 3 failed attempts
      if (retryCount >= 2) {
        console.log('Using mock data as fallback');
        const mockData = getMockPrices();
        setPrices(mockData);
        setLastUpdated(new Date());
        setError('Using offline data - live prices unavailable');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPrices();

    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, retryCount]);

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
