
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

// Enhanced mock data with current realistic prices
const getMockPrices = (): CryptoPrice[] => [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    current_price: 107310.46,
    price_change_24h: 201.88,
    price_change_percentage_24h: 0.19,
    market_cap: 2134756012567,
    total_volume: 49002153325,
    high_24h: 107530.00,
    low_24h: 106905.00,
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 2436.46,
    price_change_24h: 13.03,
    price_change_percentage_24h: 0.54,
    market_cap: 294120250673,
    total_volume: 22532659495,
    high_24h: 2445.34,
    low_24h: 2410.91,
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    current_price: 150.91,
    price_change_24h: 8.01,
    price_change_percentage_24h: 5.61,
    market_cap: 80624275746,
    total_volume: 3587470060,
    high_24h: 152.15,
    low_24h: 141.40,
  },
  {
    id: 'ripple',
    symbol: 'xrp',
    name: 'XRP',
    current_price: 2.19,
    price_change_24h: 0.038,
    price_change_percentage_24h: 1.77,
    market_cap: 129031390675,
    total_volume: 1753569281,
    high_24h: 2.21,
    low_24h: 2.13,
  },
  {
    id: 'binancecoin',
    symbol: 'bnb',
    name: 'BNB',
    current_price: 648.46,
    price_change_24h: 1.71,
    price_change_percentage_24h: 0.26,
    market_cap: 94601681527,
    total_volume: 344139606,
    high_24h: 648.43,
    low_24h: 644.56,
  },
  {
    id: 'litecoin',
    symbol: 'ltc',
    name: 'Litecoin',
    current_price: 86.25,
    price_change_24h: 1.15,
    price_change_percentage_24h: 1.35,
    market_cap: 6557053084,
    total_volume: 206319591,
    high_24h: 87.28,
    low_24h: 84.69,
  },
  {
    id: 'bitcoin-cash',
    symbol: 'bch',
    name: 'Bitcoin Cash',
    current_price: 491.11,
    price_change_24h: -15.49,
    price_change_percentage_24h: -3.06,
    market_cap: 9765914613,
    total_volume: 222986255,
    high_24h: 508.29,
    low_24h: 487.81,
  },
  {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    current_price: 0.565736,
    price_change_24h: 0.0058,
    price_change_percentage_24h: 1.04,
    market_cap: 20437550909,
    total_volume: 346639110,
    high_24h: 0.56789,
    low_24h: 0.556139,
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
    current_price: 13.40,
    price_change_24h: 0.39,
    price_change_percentage_24h: 2.99,
    market_cap: 9080636444,
    total_volume: 185289436,
    high_24h: 13.39,
    low_24h: 13.01,
  },
  {
    id: 'dogecoin',
    symbol: 'doge',
    name: 'Dogecoin',
    current_price: 0.164197,
    price_change_24h: 0.0029,
    price_change_percentage_24h: 1.81,
    market_cap: 24595259093,
    total_volume: 449602816,
    high_24h: 0.164662,
    low_24h: 0.160646,
  },
  {
    id: 'avalanche-2',
    symbol: 'avax',
    name: 'Avalanche',
    current_price: 17.96,
    price_change_24h: 0.40,
    price_change_percentage_24h: 2.26,
    market_cap: 7577337688,
    total_volume: 150049514,
    high_24h: 18.05,
    low_24h: 17.51,
  }
];

export const useCryptoPrices = (refreshInterval: number = 30000): UseCryptoPricesReturn => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialLoadRef = useRef(true);

  const fetchPrices = useCallback(async (isManualRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      console.log('[CryptoPrices] Fetching live crypto prices...');
      
      // Use a more reliable endpoint with longer timeout
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS}&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data: CryptoPrice[] = await response.json();
      
      if (data && data.length > 0) {
        console.log('[CryptoPrices] Successfully fetched live data:', data.length, 'items');
        console.log('[CryptoPrices] BTC Price:', data.find(p => p.id === 'bitcoin')?.current_price);
        
        setPrices(data);
        setLastUpdated(new Date());
        setError(null);
        setFailureCount(0);
        
        if (isInitialLoadRef.current || isManualRefresh) {
          setLoading(false);
        }
      } else {
        throw new Error('No data received from API');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[CryptoPrices] Request aborted');
        return;
      }

      console.error('[CryptoPrices] Error fetching prices:', err);
      setFailureCount(prev => prev + 1);
      
      // Use mock data immediately if this is the initial load or after 2 failures
      if (isInitialLoadRef.current || failureCount >= 1) {
        console.log('[CryptoPrices] Using reliable mock data as fallback');
        const mockData = getMockPrices();
        setPrices(mockData);
        setLastUpdated(new Date());
        setError('Using offline data - Live updates temporarily unavailable');
        
        if (isInitialLoadRef.current) {
          setLoading(false);
        }
      } else {
        setError('Failed to fetch live prices - Retrying...');
      }
    } finally {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [failureCount]);

  const refetch = useCallback(async () => {
    console.log('[CryptoPrices] Manual refresh triggered');
    setLoading(true);
    await fetchPrices(true);
  }, [fetchPrices]);

  useEffect(() => {
    // Initial fetch
    fetchPrices();

    // Set up interval for continuous updates with adaptive timing
    const actualInterval = failureCount > 2 ? Math.min(refreshInterval * 2, 60000) : refreshInterval;
    
    intervalRef.current = setInterval(() => {
      console.log('[CryptoPrices] Auto-refreshing prices...');
      fetchPrices();
    }, actualInterval);

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
  }, [fetchPrices, refreshInterval, failureCount]);

  return { prices, loading, error, lastUpdated, refetch };
};

// Helper function to get price by symbol
export const getPriceBySymbol = (prices: CryptoPrice[], symbol: string): CryptoPrice | null => {
  return prices.find(price => CRYPTO_ID_TO_SYMBOL[price.id] === symbol.toUpperCase()) || null;
};

// Helper function to format price with better precision
export const formatPrice = (price: number): string => {
  if (price < 0.01) {
    return price.toFixed(6);
  } else if (price < 1) {
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
