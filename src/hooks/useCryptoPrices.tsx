
import { useState, useEffect, useCallback, useRef } from 'react';

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
  refetch: () => Promise<void>;
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
    current_price: 101188.00,
    price_change_24h: -305.09,
    price_change_percentage_24h: -0.30,
    market_cap: 2012819572604,
    total_volume: 49002153325,
    high_24h: 102001.00,
    low_24h: 98467.00,
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 2249.69,
    price_change_24h: 31.16,
    price_change_percentage_24h: 1.40,
    market_cap: 271728378746,
    total_volume: 22532659495,
    high_24h: 2265.67,
    low_24h: 2134.88,
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    current_price: 134.07,
    price_change_24h: 4.02,
    price_change_percentage_24h: 3.09,
    market_cap: 71249671095,
    total_volume: 5520957137,
    high_24h: 135.23,
    low_24h: 127.01,
  },
  {
    id: 'ripple',
    symbol: 'xrp',
    name: 'XRP',
    current_price: 2.00,
    price_change_24h: 0.024,
    price_change_percentage_24h: 1.24,
    market_cap: 117938197746,
    total_volume: 4100861140,
    high_24h: 2.03,
    low_24h: 1.92,
  },
  {
    id: 'binancecoin',
    symbol: 'bnb',
    name: 'BNB',
    current_price: 617.73,
    price_change_24h: -5.25,
    price_change_percentage_24h: -0.84,
    market_cap: 90121676246,
    total_volume: 1044631697,
    high_24h: 624.67,
    low_24h: 602.75,
  },
  {
    id: 'litecoin',
    symbol: 'ltc',
    name: 'Litecoin',
    current_price: 81.15,
    price_change_24h: 1.44,
    price_change_percentage_24h: 1.81,
    market_cap: 6166843382,
    total_volume: 409228421,
    high_24h: 81.52,
    low_24h: 76.59,
  },
  {
    id: 'bitcoin-cash',
    symbol: 'bch',
    name: 'Bitcoin Cash',
    current_price: 451.93,
    price_change_24h: -6.09,
    price_change_percentage_24h: -1.33,
    market_cap: 8988110862,
    total_volume: 612136694,
    high_24h: 458.02,
    low_24h: 438.49,
  },
  {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    current_price: 0.542051,
    price_change_24h: 0.00783,
    price_change_percentage_24h: 1.47,
    market_cap: 19572878757,
    total_volume: 889426644,
    high_24h: 0.550507,
    low_24h: 0.513977,
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
    current_price: 11.82,
    price_change_24h: 0.24,
    price_change_percentage_24h: 2.10,
    market_cap: 8019849804,
    total_volume: 570733300,
    high_24h: 11.94,
    low_24h: 11.02,
  },
  {
    id: 'dogecoin',
    symbol: 'doge',
    name: 'Dogecoin',
    current_price: 0.15285,
    price_change_24h: 0.00192,
    price_change_percentage_24h: 1.27,
    market_cap: 22912230216,
    total_volume: 1972244890,
    high_24h: 0.154695,
    low_24h: 0.144442,
  },
  {
    id: 'avalanche-2',
    symbol: 'avax',
    name: 'Avalanche',
    current_price: 16.89,
    price_change_24h: 0.56,
    price_change_percentage_24h: 3.41,
    market_cap: 7138682786,
    total_volume: 440621813,
    high_24h: 17.13,
    low_24h: 15.73,
  }
];

export const useCryptoPrices = (refreshInterval: number = 6000): UseCryptoPricesReturn => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const retryCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPrices = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      console.log('[CryptoPrices] Fetching live crypto prices...');
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS}&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h&_=${Date.now()}`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CryptoPrice[] = await response.json();
      
      if (data && data.length > 0) {
        console.log('[CryptoPrices] Successfully fetched live data:', data.length, 'items');
        console.log('[CryptoPrices] Sample price - BTC:', data.find(p => p.id === 'bitcoin')?.current_price);
        
        setPrices(data);
        setLastUpdated(new Date());
        setError(null);
        retryCountRef.current = 0;
      } else {
        throw new Error('No data received from API');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[CryptoPrices] Request aborted');
        return;
      }

      console.error('[CryptoPrices] Error fetching prices:', err);
      retryCountRef.current += 1;
      
      // Use mock data as fallback after 3 failed attempts
      if (retryCountRef.current >= 3) {
        console.log('[CryptoPrices] Using mock data as fallback');
        const mockData = getMockPrices();
        setPrices(mockData);
        setLastUpdated(new Date());
        setError('Live data unavailable - using offline mode');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch live prices');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    // Initial fetch
    fetchPrices();

    // Set up interval for continuous updates
    intervalRef.current = setInterval(() => {
      console.log('[CryptoPrices] Auto-refreshing prices...');
      fetchPrices();
    }, refreshInterval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchPrices, refreshInterval]);

  return { prices, loading, error, lastUpdated, refetch };
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
