
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { formatPrice, formatVolume, SUPPORTED_PAIRS } from '@/hooks/useCryptoPrices';
import TradingPanel from './TradingPanel';
import TradingChatLive from './TradingChatLive';
import CandlestickChart from './CandlestickChart';
import MarketPairSelector from './MarketPairSelector';

interface TradingInterfaceProps {
  initialPair?: string;
}

const TradingInterface = ({ initialPair = 'BTC/USDT' }: TradingInterfaceProps) => {
  const { pair: urlPair } = useParams();
  const [selectedPair, setSelectedPair] = useState(() => {
    // Priority: URL param > initial prop > default
    if (urlPair && SUPPORTED_PAIRS.includes(urlPair)) {
      return urlPair;
    }
    return initialPair;
  });

  const { tradingPair, buyOrders, sellOrders, recentTrades, userTrades } = useTradingEngine(selectedPair);
  const [activeTab, setActiveTab] = useState<'market' | 'orders'>('market');

  // Update selected pair when URL changes
  useEffect(() => {
    if (urlPair && SUPPORTED_PAIRS.includes(urlPair) && urlPair !== selectedPair) {
      console.log('TradingInterface - Updating pair from URL:', urlPair);
      setSelectedPair(urlPair);
    }
  }, [urlPair, selectedPair]);

  const handlePairChange = (newPair: string) => {
    console.log('Trading Interface - Switching to pair:', newPair);
    setSelectedPair(newPair);
    
    // Update URL without page reload
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', `/trading/${newPair}`);
    }
  };

  if (!tradingPair) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-6">
        <div className="lg:col-span-8">
          <div className="exchange-panel p-8 text-center">
            <div className="text-exchange-text-secondary">
              Loading trading data for {selectedPair}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = tradingPair.change24h >= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-6">
      {/* Chart Section */}
      <div className="lg:col-span-8 space-y-4">
        <div className="exchange-panel p-4">
          {/* Market Pair Selector */}
          <div className="flex items-center justify-between mb-4">
            <MarketPairSelector 
              selectedPair={selectedPair}
              onPairChange={handlePairChange}
            />
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-mono text-exchange-text-primary">
                ${formatPrice(tradingPair.currentPrice)}
              </span>
              <div className={`flex items-center text-sm ${isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {isPositive ? '+' : ''}${Math.abs(tradingPair.change24h).toFixed(2)} ({((tradingPair.change24h / (tradingPair.currentPrice - tradingPair.change24h)) * 100).toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-exchange-accent/30 p-3 rounded-lg">
              <div className="text-xs text-exchange-text-secondary">24h Volume</div>
              <div className="text-sm font-mono text-exchange-text-primary">${formatVolume(tradingPair.volume24h)}</div>
            </div>
            <div className="bg-exchange-accent/30 p-3 rounded-lg">
              <div className="text-xs text-exchange-text-secondary">24h High</div>
              <div className="text-sm font-mono text-exchange-text-primary">${formatPrice(tradingPair.high24h)}</div>
            </div>
            <div className="bg-exchange-accent/30 p-3 rounded-lg">
              <div className="text-xs text-exchange-text-secondary">24h Low</div>
              <div className="text-sm font-mono text-exchange-text-primary">${formatPrice(tradingPair.low24h)}</div>
            </div>
            <div className="bg-exchange-accent/30 p-3 rounded-lg">
              <div className="text-xs text-exchange-text-secondary">Price Change</div>
              <div className={`text-sm font-mono ${isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                {isPositive ? '+' : ''}${Math.abs(tradingPair.change24h).toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Live Candlestick Chart */}
          <CandlestickChart symbol={selectedPair} />

          {/* User Trade History */}
          {userTrades.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-exchange-text-primary mb-3">Your Recent Trades</h3>
              <div className="space-y-2">
                {userTrades.slice(0, 5).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-2 bg-exchange-accent/20 rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${trade.side === 'buy' ? 'bg-exchange-green' : 'bg-exchange-red'}`} />
                      <span className="text-xs font-mono text-exchange-text-primary">
                        {trade.side.toUpperCase()} {trade.amount.toFixed(8)} {trade.pair.split('/')[0]}
                      </span>
                      <span className="text-xs text-exchange-text-secondary">
                        @ ${trade.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-exchange-green" />
                      <span className="text-xs text-exchange-text-secondary">
                        {trade.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Trading Chat */}
        <TradingChatLive />
      </div>

      {/* Order Book & Trading Panel */}
      <div className="lg:col-span-4 space-y-4">
        {/* Order Book */}
        <div className="exchange-panel p-4">
          <h3 className="text-lg font-semibold text-exchange-text-primary mb-4">Order Book</h3>
          
          {/* Sell Orders */}
          <div className="space-y-1 mb-4">
            <div className="grid grid-cols-3 text-xs text-exchange-text-secondary mb-2">
              <span>Price (USDT)</span>
              <span className="text-right">Amount ({tradingPair.baseAsset})</span>
              <span className="text-right">Total</span>
            </div>
            {sellOrders.slice(0, 5).map((order, index) => (
              <div key={index} className="grid grid-cols-3 text-xs font-mono hover:bg-exchange-accent/30 px-1 py-0.5 rounded">
                <span className="text-exchange-red">${order.price.toFixed(2)}</span>
                <span className="text-right text-exchange-text-primary">{order.amount.toFixed(8)}</span>
                <span className="text-right text-exchange-text-secondary">${order.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Current Price */}
          <div className="text-center py-2 bg-exchange-green/10 rounded mb-4">
            <span className="text-exchange-green font-mono font-bold">${formatPrice(tradingPair.currentPrice)}</span>
            <span className="text-exchange-text-secondary text-xs ml-2">≈ ${formatPrice(tradingPair.currentPrice)}</span>
          </div>

          {/* Buy Orders */}
          <div className="space-y-1">
            {buyOrders.slice(0, 5).map((order, index) => (
              <div key={index} className="grid grid-cols-3 text-xs font-mono hover:bg-exchange-accent/30 px-1 py-0.5 rounded">
                <span className="text-exchange-green">${order.price.toFixed(2)}</span>
                <span className="text-right text-exchange-text-primary">{order.amount.toFixed(8)}</span>
                <span className="text-right text-exchange-text-secondary">${order.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Panel - Now supports all currencies */}
        <TradingPanel selectedPair={selectedPair} />

        {/* Market Trades */}
        <div className="exchange-panel p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-exchange-text-primary">Market Trades</h3>
            <div className="flex space-x-1">
              <button 
                onClick={() => setActiveTab('market')}
                className={`px-2 py-1 text-xs rounded ${activeTab === 'market' ? 'bg-exchange-blue text-white' : 'bg-exchange-accent text-exchange-text-secondary'}`}
              >
                Market
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`px-2 py-1 text-xs rounded ${activeTab === 'orders' ? 'bg-exchange-blue text-white' : 'bg-exchange-accent text-exchange-text-secondary'}`}
              >
                My Orders
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-3 text-xs text-exchange-text-secondary mb-2">
              <span>Price</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Time</span>
            </div>
            
            {activeTab === 'market' ? (
              recentTrades.slice(0, 10).map((trade, index) => (
                <div key={index} className="grid grid-cols-3 text-xs font-mono">
                  <span className={trade.side === 'buy' ? 'text-exchange-green' : 'text-exchange-red'}>
                    ${trade.price.toFixed(2)}
                  </span>
                  <span className="text-right text-exchange-text-primary">{trade.amount.toFixed(8)}</span>
                  <span className="text-right text-exchange-text-secondary">{trade.timestamp.toLocaleTimeString()}</span>
                </div>
              ))
            ) : (
              userTrades.slice(0, 10).map((trade, index) => (
                <div key={index} className="grid grid-cols-3 text-xs font-mono">
                  <span className={trade.side === 'buy' ? 'text-exchange-green' : 'text-exchange-red'}>
                    ${trade.price.toFixed(2)}
                  </span>
                  <span className="text-right text-exchange-text-primary">{trade.amount.toFixed(8)}</span>
                  <span className="text-right text-exchange-text-secondary">{trade.timestamp.toLocaleTimeString()}</span>
                </div>
              ))
            )}
            
            {activeTab === 'orders' && userTrades.length === 0 && (
              <div className="text-center py-4 text-exchange-text-secondary text-xs">
                No trade history yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;
