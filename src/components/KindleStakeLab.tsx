
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity, Volume2 } from 'lucide-react';
import { useCryptoPrices, getPriceBySymbol, SUPPORTED_PAIRS } from '@/hooks/useCryptoPrices';
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
  const [timeframe, setTimeframe] = useState('5m');
  const [showIndicators, setShowIndicators] = useState(false);
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');

  const [baseAsset] = selectedPair.split('/');
  const currentCrypto = getPriceBySymbol(prices, baseAsset);
  const isPositive = currentCrypto ? currentCrypto.price_change_percentage_24h >= 0 : false;

  const timeframes = [
    { value: '1m', label: '1M' },
    { value: '2m', label: '2M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '30m', label: '30M' },
    { value: '1h', label: '1H' }
  ];

  return (
    <div className="space-y-6">
      <div className="exchange-panel p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-exchange-blue" />
            <h2 className="text-xl font-bold text-exchange-text-primary">Kindle Stake Lab</h2>
            <div className="bg-exchange-blue/20 text-exchange-blue px-2 py-1 rounded text-xs font-medium">
              PROFESSIONAL
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentCrypto && (
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-exchange-text-primary">
                  ${currentCrypto.current_price.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className={`flex items-center text-sm ${isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {isPositive ? '+' : ''}{currentCrypto.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart Controls */}
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

        {/* Main Chart */}
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

        {/* Market Stats */}
        {currentCrypto && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-exchange-accent/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Volume2 className="w-4 h-4 text-exchange-text-secondary" />
                <span className="text-xs text-exchange-text-secondary">24h Volume</span>
              </div>
              <div className="text-lg font-mono text-exchange-text-primary">
                ${(currentCrypto.total_volume / 1e9).toFixed(2)}B
              </div>
            </div>

            <div className="bg-exchange-accent/20 p-4 rounded-lg">
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

            <div className="bg-exchange-accent/20 p-4 rounded-lg">
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

            <div className="bg-exchange-accent/20 p-4 rounded-lg">
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
      </div>

      {/* Live Trading Chat */}
      <TradingChatLive />
    </div>
  );
};

export default KindleStakeLab;
