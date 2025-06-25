
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import KindleCandlestickChart from './KindleCandlestickChart';
import ChartControls from './ChartControls';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PerpetualTradingViewProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}

interface PerpetualTrade {
  id: string;
  pair: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  timestamp: Date;
  status: 'open' | 'closed';
}

const PerpetualTradingView = ({ selectedPair, onPairChange }: PerpetualTradingViewProps) => {
  const { user } = useAuth();
  const { tradingPair } = useTradingEngine(selectedPair);
  const [tradeLotSize, setTradeLotSize] = useState<number>(0.001);
  const [timeframe, setTimeframe] = useState('5m');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showIndicators, setShowIndicators] = useState(false);
  const [perpetualTrades, setPerpetualTrades] = useState<PerpetualTrade[]>([]);

  const timeframes = [
    { value: '1m', label: '1M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '30m', label: '30M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' }
  ];

  const executePerpetualTrade = (side: 'long' | 'short') => {
    if (!user) {
      toast.error('Please log in to trade');
      return;
    }

    if (!tradingPair) {
      toast.error('Trading pair not available');
      return;
    }

    if (tradeLotSize <= 0) {
      toast.error('Please enter a valid trade lot size');
      return;
    }

    const newTrade: PerpetualTrade = {
      id: `perp_${Date.now()}`,
      pair: selectedPair,
      side,
      size: tradeLotSize,
      entryPrice: tradingPair.currentPrice,
      currentPrice: tradingPair.currentPrice,
      pnl: 0,
      pnlPercentage: 0,
      timestamp: new Date(),
      status: 'open'
    };

    setPerpetualTrades(prev => [newTrade, ...prev]);
    
    // Save to localStorage
    const savedTrades = [...perpetualTrades, newTrade];
    localStorage.setItem(`perpetual_trades_${user.id}`, JSON.stringify(savedTrades));

    toast.success(`${side.toUpperCase()} position opened for ${tradeLotSize} ${selectedPair.split('/')[0]}`);
  };

  const closeTrade = (tradeId: string) => {
    setPerpetualTrades(prev => 
      prev.map(trade => 
        trade.id === tradeId 
          ? { ...trade, status: 'closed' as const }
          : trade
      )
    );

    if (user) {
      const updatedTrades = perpetualTrades.map(trade => 
        trade.id === tradeId 
          ? { ...trade, status: 'closed' as const }
          : trade
      );
      localStorage.setItem(`perpetual_trades_${user.id}`, JSON.stringify(updatedTrades));
    }

    toast.success('Position closed successfully');
  };

  // Load saved trades on component mount
  React.useEffect(() => {
    if (user) {
      const savedTrades = localStorage.getItem(`perpetual_trades_${user.id}`);
      if (savedTrades) {
        const trades = JSON.parse(savedTrades).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
        setPerpetualTrades(trades);
      }
    }
  }, [user]);

  // Update current prices and PnL for open trades
  React.useEffect(() => {
    if (tradingPair) {
      setPerpetualTrades(prev => 
        prev.map(trade => {
          if (trade.status === 'open') {
            const currentPrice = tradingPair.currentPrice;
            const priceDiff = trade.side === 'long' 
              ? currentPrice - trade.entryPrice
              : trade.entryPrice - currentPrice;
            const pnl = priceDiff * trade.size;
            const pnlPercentage = (priceDiff / trade.entryPrice) * 100;

            return {
              ...trade,
              currentPrice,
              pnl,
              pnlPercentage
            };
          }
          return trade;
        })
      );
    }
  }, [tradingPair]);

  if (!tradingPair) {
    return (
      <div className="exchange-panel p-8 text-center">
        <div className="text-exchange-text-secondary">
          Loading perpetual trading data for {selectedPair}...
        </div>
      </div>
    );
  }

  const openTrades = perpetualTrades.filter(trade => trade.status === 'open');
  const totalPnL = openTrades.reduce((sum, trade) => sum + trade.pnl, 0);

  return (
    <div className="space-y-4">
      {/* Trading Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="exchange-panel p-3">
          <div className="text-xs text-exchange-text-secondary mb-1">Current Price</div>
          <div className="text-lg font-mono text-exchange-text-primary">
            ${tradingPair.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="exchange-panel p-3">
          <div className="text-xs text-exchange-text-secondary mb-1">Open Positions</div>
          <div className="text-lg font-bold text-exchange-text-primary">
            {openTrades.length}
          </div>
        </div>
        <div className="exchange-panel p-3">
          <div className="text-xs text-exchange-text-secondary mb-1">Total PnL</div>
          <div className={`text-lg font-mono ${totalPnL >= 0 ? 'text-exchange-green' : 'text-exchange-red'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="exchange-panel p-3">
          <div className="text-xs text-exchange-text-secondary mb-1">24h Change</div>
          <div className={`text-lg font-mono flex items-center ${
            tradingPair.change24h >= 0 ? 'text-exchange-green' : 'text-exchange-red'
          }`}>
            {tradingPair.change24h >= 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            {tradingPair.change24h >= 0 ? '+' : ''}${Math.abs(tradingPair.change24h).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="exchange-panel p-4">
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
        
        <div className="mt-4">
          <KindleCandlestickChart 
            symbol={selectedPair}
            timeframe={timeframe}
            chartType={chartType}
          />
        </div>
      </div>

      {/* Trading Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trade Entry */}
        <div className="exchange-panel p-4">
          <h3 className="text-lg font-semibold text-exchange-text-primary mb-4">Open Position</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-exchange-text-secondary mb-2">
                Trade Lot Size ({selectedPair.split('/')[0]})
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={tradeLotSize}
                onChange={(e) => setTradeLotSize(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-exchange-accent border border-exchange-border rounded text-exchange-text-primary font-mono"
                placeholder="0.001"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => executePerpetualTrade('long')}
                className="bg-exchange-green hover:bg-exchange-green/90 text-white font-semibold py-3"
                disabled={!user || tradeLotSize <= 0}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Buy Long
              </Button>
              
              <Button
                onClick={() => executePerpetualTrade('short')}
                className="bg-exchange-red hover:bg-exchange-red/90 text-white font-semibold py-3"
                disabled={!user || tradeLotSize <= 0}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Sell Short
              </Button>
            </div>

            {!user && (
              <div className="text-center text-sm text-exchange-text-secondary">
                Please log in to start trading
              </div>
            )}
          </div>
        </div>

        {/* Trade History */}
        <div className="exchange-panel p-4">
          <h3 className="text-lg font-semibold text-exchange-text-primary mb-4">Trade History</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {perpetualTrades.length === 0 ? (
              <div className="text-center text-sm text-exchange-text-secondary py-8">
                No trades yet
              </div>
            ) : (
              perpetualTrades.map((trade) => (
                <div key={trade.id} className="bg-exchange-accent/30 p-3 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        trade.side === 'long' ? 'bg-exchange-green' : 'bg-exchange-red'
                      }`} />
                      <span className="text-sm font-medium text-exchange-text-primary uppercase">
                        {trade.side} {trade.pair}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        trade.status === 'open' 
                          ? 'bg-exchange-blue/20 text-exchange-blue' 
                          : 'bg-exchange-text-secondary/20 text-exchange-text-secondary'
                      }`}>
                        {trade.status}
                      </span>
                    </div>
                    {trade.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closeTrade(trade.id)}
                        className="text-xs"
                      >
                        Close Trade
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-exchange-text-secondary">Size</div>
                      <div className="font-mono text-exchange-text-primary">
                        {trade.size} {trade.pair.split('/')[0]}
                      </div>
                    </div>
                    <div>
                      <div className="text-exchange-text-secondary">Entry Price</div>
                      <div className="font-mono text-exchange-text-primary">
                        ${trade.entryPrice.toFixed(2)}
                      </div>
                    </div>
                    {trade.status === 'open' && (
                      <>
                        <div>
                          <div className="text-exchange-text-secondary">Current Price</div>
                          <div className="font-mono text-exchange-text-primary">
                            ${trade.currentPrice.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-exchange-text-secondary">PnL</div>
                          <div className={`font-mono ${trade.pnl >= 0 ? 'text-exchange-green' : 'text-exchange-red'}`}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)} ({trade.pnlPercentage.toFixed(2)}%)
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="text-xs text-exchange-text-secondary mt-2">
                    {trade.timestamp.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerpetualTradingView;
