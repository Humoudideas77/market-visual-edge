
import React from 'react';
import { ChevronDown, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { SUPPORTED_PAIRS } from '@/hooks/useCryptoPrices';

interface ChartControlsProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  chartType: 'candlestick' | 'line';
  onChartTypeChange: (type: 'candlestick' | 'line') => void;
  showIndicators: boolean;
  onToggleIndicators: (show: boolean) => void;
  timeframes: Array<{ value: string; label: string }>;
}

const ChartControls = ({
  selectedPair,
  onPairChange,
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  showIndicators,
  onToggleIndicators,
  timeframes
}: ChartControlsProps) => {
  const [showPairDropdown, setShowPairDropdown] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-exchange-accent/10 rounded-lg">
      {/* Coin Selector */}
      <div className="relative">
        <button
          onClick={() => setShowPairDropdown(!showPairDropdown)}
          className="flex items-center space-x-2 bg-exchange-panel border border-exchange-border rounded-lg px-4 py-2 hover:bg-exchange-accent/30 transition-colors"
        >
          <span className="font-semibold text-exchange-text-primary">{selectedPair}</span>
          <ChevronDown className={`w-4 h-4 text-exchange-text-secondary transition-transform ${showPairDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showPairDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowPairDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 bg-exchange-panel border border-exchange-border rounded-lg shadow-xl z-20 min-w-[200px]">
              <div className="p-2">
                <div className="text-xs text-exchange-text-secondary mb-2 px-2">Select Trading Pair</div>
                {SUPPORTED_PAIRS.map((pair) => (
                  <button
                    key={pair}
                    onClick={() => {
                      onPairChange(pair);
                      setShowPairDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-exchange-accent/50 transition-colors ${
                      pair === selectedPair ? 'bg-exchange-blue/20 text-exchange-blue' : 'text-exchange-text-primary'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Timeframe Selector */}
      <div className="flex space-x-1 bg-exchange-accent/30 rounded-lg p-1">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onTimeframeChange(tf.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              timeframe === tf.value
                ? 'bg-exchange-blue text-white shadow-sm'
                : 'text-exchange-text-secondary hover:text-exchange-text-primary hover:bg-exchange-accent/50'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Chart Type & Indicators */}
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1 bg-exchange-accent/30 rounded-lg p-1">
          <button
            onClick={() => onChartTypeChange('candlestick')}
            className={`p-2 rounded transition-colors ${
              chartType === 'candlestick'
                ? 'bg-exchange-blue text-white'
                : 'text-exchange-text-secondary hover:text-exchange-text-primary'
            }`}
            title="Candlestick Chart"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChartTypeChange('line')}
            className={`p-2 rounded transition-colors ${
              chartType === 'line'
                ? 'bg-exchange-blue text-white'
                : 'text-exchange-text-secondary hover:text-exchange-text-primary'
            }`}
            title="Line Chart"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onToggleIndicators(!showIndicators)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            showIndicators
              ? 'bg-exchange-blue text-white'
              : 'bg-exchange-accent/30 text-exchange-text-secondary hover:text-exchange-text-primary'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">Indicators</span>
        </button>
      </div>
    </div>
  );
};

export default ChartControls;
