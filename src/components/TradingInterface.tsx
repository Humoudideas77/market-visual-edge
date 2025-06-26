import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, CheckCircle, BarChart3, Activity } from 'lucide-react';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { formatPrice, formatVolume, SUPPORTED_PAIRS } from '@/hooks/useCryptoPrices';
import TradingPanel from './TradingPanel';
import TradingChatLive from './TradingChatLive';
import CandlestickChart from './CandlestickChart';
import MarketPairSelector from './MarketPairSelector';
import KindleStakeLab from './KindleStakeLab';
import OptionTrading from './OptionTrading';

interface TradingInterfaceProps {
  initialPair?: string;
}

type ActiveViewType = 'standard' | 'kindle' | 'option';

const TradingInterface = ({ initialPair = 'BTC/USDT' }: TradingInterfaceProps) => {
  const { baseAsset, quoteAsset } = useParams();
  const [selectedPair, setSelectedPair] = useState(() => {
    // Priority: URL params > initial prop > default
    if (baseAsset && quoteAsset) {
      const constructedPair = `${baseAsset.toUpperCase()}/${quoteAsset.toUpperCase()}`;
      if (SUPPORTED_PAIRS.includes(constructedPair)) {
        return constructedPair;
      }
    }
    return initialPair;
  });

  const { tradingPair, buyOrders, sellOrders, recentTrades, userTrades } = useTradingEngine(selectedPair);
  const [activeTab, setActiveTab] = useState<'market' | 'orders'>('market');
  const [activeView, setActiveView] = useState<ActiveViewType>('standard');

  // Update selected pair when URL changes
  useEffect(() => {
    if (baseAsset && quoteAsset) {
      const constructedPair = `${baseAsset.toUpperCase()}/${quoteAsset.toUpperCase()}`;
      if (SUPPORTED_PAIRS.includes(constructedPair) && constructedPair !== selectedPair) {
        console.log('TradingInterface - Updating pair from URL:', constructedPair);
        setSelectedPair(constructedPair);
      }
    }
  }, [baseAsset, quoteAsset, selectedPair]);

  const handlePairChange = (newPair: string) => {
    console.log('Trading Interface - Switching to pair:', newPair);
    setSelectedPair(newPair);
    
    // Update URL without page reload
    const [newBaseAsset, newQuoteAsset] = newPair.split('/');
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', `/trading/${newBaseAsset}/${newQuoteAsset}`);
    }
  };

  const handleViewChange = (view: ActiveViewType) => {
    setActiveView(view);
  };

  if (!tradingPair) {
    return (
      <div className="container-responsive max-w-6xl py-6">
        <div className="bg-exchange-panel border border-exchange-border rounded-lg p-6 sm:p-8 text-center">
          <div className="text-exchange-text-secondary text-sm sm:text-base">
            Loading trading data for {selectedPair}...
          </div>
        </div>
      </div>
    );
  }

  const isPositive = tradingPair.change24h >= 0;

  // Render Option Trading view
  if (activeView === ('option' as ActiveViewType)) {
    return (
      <div className="container-responsive max-w-6xl space-y-3 sm:space-y-4">
        {/* View Toggle */}
        <div className="flex items-center justify-between py-3 sm:py-4 lg:py-6">
          <div className="flex space-x-1 sm:space-x-2 bg-exchange-accent/30 rounded-lg p-1">
            <button
              onClick={() => handleViewChange('standard' as ActiveViewType)}
              className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                activeView === ('standard' as ActiveViewType)
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => handleViewChange('kindle' as ActiveViewType)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                activeView === ('kindle' as ActiveViewType)
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Kindle Stake</span>
            </button>
            <button
              onClick={() => handleViewChange('option' as ActiveViewType)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                activeView === ('option' as ActiveViewType)
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Option</span>
            </button>
          </div>
        </div>

        <OptionTrading 
          selectedPair={selectedPair}
          onPairChange={handlePairChange}
        />
      </div>
    );
  }

  // Render Kindle Stake Lab view
  if (activeView === ('kindle' as ActiveViewType)) {
    return (
      <div className="container-responsive max-w-6xl space-y-3 sm:space-y-4 py-3 sm:py-4 lg:py-6">
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 sm:space-x-2 bg-exchange-accent/30 rounded-lg p-1">
            <button
              onClick={() => handleViewChange('standard' as ActiveViewType)}
              className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                activeView === ('standard' as ActiveViewType)
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => handleViewChange('kindle' as ActiveViewType)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                activeView === ('kindle' as ActiveViewType)
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Kindle Stake</span>
            </button>
            <button
              onClick={() => handleViewChange('option' as ActiveViewType)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                activeView === ('option' as ActiveViewType)
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Option</span>
            </button>
          </div>
        </div>

        <KindleStakeLab 
          selectedPair={selectedPair}
          onPairChange={handlePairChange}
        />

        {/* Trading Panel - Only show once here */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <TradingPanel selectedPair={selectedPair} />
          {/* Chat is already included in KindleStakeLab, so don't duplicate it here */}
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive max-w-7xl py-3 sm:py-4 lg:py-6 overflow-x-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Chart Section */}
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          {/* View Toggle */}
          <div className="flex space-x-1 sm:space-x-2 bg-exchange-accent/30 rounded-lg p-1 w-fit">
            <button
              onClick={() => handleViewChange('standard' as ActiveViewType)}
              className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                activeView === ('standard' as ActiveViewType)
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => handleViewChange('kindle' as ActiveViewType)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                activeView === ('kindle' as ActiveViewType)
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Kindle Stake</span>
            </button>
            <button
              onClick={() => handleViewChange('option' as ActiveViewType)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                activeView === ('option' as ActiveViewType)
                  ? 'bg-exchange-blue text-white'
                  : 'text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Option</span>
            </button>
          </div>

          {/* Market Panel with stats, chart, and user trade history sections */}
          <div className="bg-exchange-panel border border-exchange-border rounded-lg p-3 sm:p-4">
            {/* Market Pair Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
              <MarketPairSelector 
                selectedPair={selectedPair}
                onPairChange={handlePairChange}
              />
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl lg:text-2xl font-mono text-exchange-text-primary">
                  ${formatPrice(tradingPair.currentPrice)}
                </span>
                <div className={`flex items-center text-xs sm:text-sm ${isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  {isPositive ? '+' : ''}${Math.abs(tradingPair.change24h).toFixed(2)} ({((tradingPair.change24h / (tradingPair.currentPrice - tradingPair.change24h)) * 100).toFixed(2)}%)
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
              <div className="bg-exchange-accent/30 p-2 sm:p-3 rounded-lg">
                <div className="text-xs text-exchange-text-secondary">24h Volume</div>
                <div className="text-xs sm:text-sm font-mono text-exchange-text-primary">${formatVolume(tradingPair.volume24h)}</div>
              </div>
              <div className="bg-exchange-accent/30 p-2 sm:p-3 rounded-lg">
                <div className="text-xs text-exchange-text-secondary">24h High</div>
                <div className="text-xs sm:text-sm font-mono text-exchange-text-primary">${formatPrice(tradingPair.high24h)}</div>
              </div>
              <div className="bg-exchange-accent/30 p-2 sm:p-3 rounded-lg">
                <div className="text-xs text-exchange-text-secondary">24h Low</div>
                <div className="text-xs sm:text-sm font-mono text-exchange-text-primary">${formatPrice(tradingPair.low24h)}</div>
              </div>
              <div className="bg-exchange-accent/30 p-2 sm:p-3 rounded-lg">
                <div className="text-xs text-exchange-text-secondary">Price Change</div>
                <div className={`text-xs sm:text-sm font-mono ${isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                  {isPositive ? '+' : ''}${Math.abs(tradingPair.change24h).toFixed(2)}
                </div>
              </div>
            </div>
            
            {/* Live Candlestick Chart */}
            <CandlestickChart symbol={selectedPair} />

            {/* User Trade History */}
            {userTrades.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <h3 className="text-xs sm:text-sm font-semibold text-exchange-text-primary mb-2 sm:mb-3">Your Recent Trades</h3>
                <div className="space-y-1 sm:space-y-2">
                  {userTrades.slice(0, 5).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-2 bg-exchange-accent/20 rounded text-xs sm:text-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${trade.side === 'buy' ? 'bg-exchange-green' : 'bg-exchange-red'}`} />
                        <span className="font-mono text-exchange-text-primary">
                          {trade.side.toUpperCase()} {trade.amount.toFixed(8)} {trade.pair.split('/')[0]}
                        </span>
                        <span className="text-exchange-text-secondary">
                          @ ${trade.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-exchange-green" />
                        <span className="text-exchange-text-secondary">
                          {trade.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Trading Chat - Only rendered once here */}
          <TradingChatLive />
        </div>

        {/* Order Book & Trading Panel */}
        <div className="lg:col-span-4 space-y-3 sm:space-y-4">
          {/* Order Book */}
          <div className="bg-exchange-panel border border-exchange-border rounded-lg p-3 sm:p-4">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-exchange-text-primary mb-3 sm:mb-4">Order Book</h3>
            
            {/* Sell Orders */}
            <div className="space-y-1 mb-3 sm:mb-4">
              <div className="grid grid-cols-3 text-xs text-exchange-text-secondary mb-1 sm:mb-2">
                <span>Price (USDT)</span>
                <span className="text-right">Amount ({tradingPair.baseAsset})</span>
                <span className="text-right">Total</span>
              </div>
              {sellOrders.slice(0, 5).map((order, index) => (
                <div key={index} className="grid grid-cols-3 text-xs font-mono hover:bg-exchange-accent/30 px-1 py-0.5 rounded">
                  <span className="text-exchange-red">${order.price.toFixed(2)}</span>
                  <span className="text-right text-exchange-text-primary">{order.amount.toFixed(6)}</span>
                  <span className="text-right text-exchange-text-secondary">${order.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Current Price */}
            <div className="text-center py-2 bg-exchange-green/10 rounded mb-3 sm:mb-4">
              <span className="text-exchange-green font-mono font-bold text-xs sm:text-sm">${formatPrice(tradingPair.currentPrice)}</span>
              <span className="text-exchange-text-secondary text-xs ml-1 sm:ml-2">≈ ${formatPrice(tradingPair.currentPrice)}</span>
            </div>

            {/* Buy Orders */}
            <div className="space-y-1">
              {buyOrders.slice(0, 5).map((order, index) => (
                <div key={index} className="grid grid-cols-3 text-xs font-mono hover:bg-exchange-accent/30 px-1 py-0.5 rounded">
                  <span className="text-exchange-green">${order.price.toFixed(2)}</span>
                  <span className="text-right text-exchange-text-primary">{order.amount.toFixed(6)}</span>
                  <span className="text-right text-exchange-text-secondary">${order.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Panel - Now supports all currencies */}
          <TradingPanel selectedPair={selectedPair} />

          {/* Market Trades */}
          <div className="bg-exchange-panel border border-exchange-border rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-semibold text-exchange-text-primary">Market Trades</h3>
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
              <div className="grid grid-cols-3 text-xs text-exchange-text-secondary mb-1 sm:mb-2">
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
                    <span className="text-right text-exchange-text-primary">{trade.amount.toFixed(6)}</span>
                    <span className="text-right text-exchange-text-secondary">{trade.timestamp.toLocaleTimeString()}</span>
                  </div>
                ))
              ) : (
                userTrades.slice(0, 10).map((trade, index) => (
                  <div key={index} className="grid grid-cols-3 text-xs font-mono">
                    <span className={trade.side === 'buy' ? 'text-exchange-green' : 'text-exchange-red'}>
                      ${trade.price.toFixed(2)}
                    </span>
                    <span className="text-right text-exchange-text-primary">{trade.amount.toFixed(6)}</span>
                    <span className="text-right text-exchange-text-secondary">{trade.timestamp.toLocaleTimeString()}</span>
                  </div>
                ))
              )}
              
              {activeTab === 'orders' && userTrades.length === 0 && (
                <div className="text-center py-3 sm:py-4 text-exchange-text-secondary text-xs">
                  No trade history yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;
