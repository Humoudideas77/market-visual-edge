
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity, Volume2, Wifi } from 'lucide-react';
import { useCryptoPrices, getPriceBySymbol, SUPPORTED_PAIRS } from '@/hooks/useCryptoPrices';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';
import KindleCandlestickChart from './KindleCandlestickChart';
import ChartControls from './ChartControls';
import TechnicalIndicators from './TechnicalIndicators';
import TradingChatLive from './TradingChatLive';

interface KindleStakeLabProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}

const KindleStakeLab = ({ selectedPair, onPairChange }: KindleStakeLabProps) => {
  const { prices } = useCryptoPrices();
  const { realtimePrices, subscribeToSymbol, isConnected } = useRealtimePrices();
  const [timeframe, setTimeframe] = useState('5m');
  const [showIndicators, setShowIndicators] = useState(false);
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');

  const [baseAsset] = selectedPair.split('/');
  const currentCrypto = getPriceBySymbol(prices, baseAsset);
  const realtimeData = realtimePrices.get(selectedPair);
  
  // Use real-time price if available, otherwise use static price
  const displayPrice = realtimeData?.price || currentCrypto?.current_price || 0;
  const displayChange = realtimeData?.changePercent || currentCrypto?.price_change_percentage_24h || 0;
  const isPositive = displayChange >= 0;

  const timeframes = [
    { value: '1m', label: '1M' },
    { value: '2m', label: '2M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '30m', label: '30M' },
    { value: '1h', label: '1H' }
  ];

  // Subscribe to real-time updates for the selected pair
  useEffect(() => {
    subscribeToSymbol(selectedPair);
  }, [selectedPair, subscribeToSymbol]);

  return (
    <div className="space-y-6">
      <div className="exchange-panel p-6">
        {/* Enhanced Header with Real-time Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-exchange-blue" />
            <h2 className="text-xl font-bold text-exchange-text-primary">Kindle Stake Lab</h2>
            <div className="bg-exchange-blue/20 text-exchange-blue px-2 py-1 rounded text-xs font-medium">
              PROFESSIONAL
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
              isConnected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
            }`}>
              <Wifi className="w-3 h-3" />
              <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentCrypto && (
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-exchange-text-primary">
                  ${displayPrice.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                  {realtimeData && (
                    <span className="text-xs ml-2 text-exchange-text-secondary">
                      📊 Real-time
                    </span>
                  )}
                </div>
                <div className={`flex items-center text-sm ${isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {isPositive ? '+' : ''}{displayChange.toFixed(2)}%
                  {realtimeData && (
                    <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Chart Controls */}
        <ChartControls
          selectedPair={selectedPair}
          onPairChange={onPairChange}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          chartType={chartType}
          onChartTypeChange={setChartType}
          showIndicators={showIndicators}
          onToggleIndicators={setShowIndicators}
          timeframes={timeframes}
        />

        {/* Enhanced Main Chart with Real-time Data */}
        <div className="mt-6">
          <KindleCandlestickChart 
            symbol={selectedPair}
            timeframe={timeframe}
            chartType={chartType}
          />
        </div>

        {/* Technical Indicators */}
        {showIndicators && (
          <div className="mt-6">
            <TechnicalIndicators symbol={selectedPair} />
          </div>
        )}

        {/* Enhanced Market Stats with Real-time Updates */}
        {currentCrypto && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-exchange-accent/20 p-4 rounded-lg relative">
              <div className="flex items-center space-x-2 mb-2">
                <Volume2 className="w-4 h-4 text-exchange-text-secondary" />
                <span className="text-xs text-exchange-text-secondary">24h Volume</span>
                {realtimeData && <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>}
              </div>
              <div className="text-lg font-mono text-exchange-text-primary">
                ${(currentCrypto.total_volume / 1e9).toFixed(2)}B
              </div>
            </div>

            <div className="bg-exchange-accent/20 p-4 rounded-lg relative">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-exchange-green" />
                <span className="text-xs text-exchange-text-secondary">24h High</span>
              </div>
              <div className="text-lg font-mono text-exchange-text-primary">
                ${currentCrypto.high_24h.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
            </div>

            <div className="bg-exchange-accent/20 p-4 rounded-lg relative">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="w-4 h-4 text-exchange-red" />
                <span className="text-xs text-exchange-text-secondary">24h Low</span>
              </div>
              <div className="text-lg font-mono text-exchange-text-primary">
                ${currentCrypto.low_24h.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
            </div>

            <div className="bg-exchange-accent/20 p-4 rounded-lg relative">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-exchange-text-secondary" />
                <span className="text-xs text-exchange-text-secondary">Market Cap</span>
              </div>
              <div className="text-lg font-mono text-exchange-text-primary">
                ${(currentCrypto.market_cap / 1e9).toFixed(1)}B
              </div>
            </div>
          </div>
        )}

        {/* Real-time Status Banner */}
        <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-exchange-text-primary">📊 Real-time market data active</span>
            </div>
            <div className="text-xs text-exchange-text-secondary">
              Updates every second • Live price movements
            </div>
          </div>
        </div>
      </div>

      {/* Live Trading Chat */}
      <TradingChatLive />
    </div>
  );
};

export default KindleStakeLab;
