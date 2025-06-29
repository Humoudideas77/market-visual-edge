
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { useCryptoPrices, getPriceBySymbol } from '@/hooks/useCryptoPrices';
import { usePerpetualTrades } from '@/hooks/usePerpetualTrades';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, BarChart3, AlertCircle, DollarSign, History, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PerpetualTradingViewProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}

const PerpetualTradingView = ({ selectedPair, onPairChange }: PerpetualTradingViewProps) => {
  const { getBalance, refreshBalances } = useWallet();
  const { prices } = useCryptoPrices();
  const { positions, allPositions, loading, openPosition, closePosition } = usePerpetualTrades(selectedPair);
  
  const [tradeSize, setTradeSize] = useState('');
  const [leverage, setLeverage] = useState('10');
  const [tradeSide, setTradeSide] = useState<'long' | 'short'>('long');

  const [baseAsset] = selectedPair.split('/');
  const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || 0;
  const usdtBalance = getBalance('USDT');

  // Refresh balances periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBalances();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [refreshBalances]);

  // Calculate precise margin required for the trade
  const calculateMargin = (): number => {
    if (!tradeSize || !leverage || !currentPrice) return 0;
    const size = parseFloat(tradeSize);
    const lev = parseFloat(leverage);
    const notionalValue = size * currentPrice;
    return Number((notionalValue / lev).toFixed(8));
  };

  const marginRequired = calculateMargin();
  const availableBalance = usdtBalance?.available || 0;

  // Calculate total PnL with precise arithmetic
  const totalPnL = positions.reduce((sum, position) => {
    return Number((sum + position.pnl).toFixed(8));
  }, 0);
  
  const totalMargin = positions.reduce((sum, position) => {
    return Number((sum + position.margin).toFixed(8));
  }, 0);

  const totalNotionalValue = positions.reduce((sum, position) => {
    return Number((sum + (position.size * position.current_price)).toFixed(2));
  }, 0);

  const handleOpenPosition = async () => {
    if (!tradeSize || parseFloat(tradeSize) <= 0) {
      toast.error('Please enter a valid trade size');
      return;
    }

    if (!leverage || parseFloat(leverage) <= 0 || parseFloat(leverage) > 100) {
      toast.error('Please enter a valid leverage (1-100x)');
      return;
    }

    if (!currentPrice || currentPrice <= 0) {
      toast.error('Invalid market price. Please wait for price data to load.');
      return;
    }

    // Refresh balance before opening position
    await refreshBalances();

    const result = await openPosition(tradeSide, parseFloat(tradeSize), parseFloat(leverage));
    
    if (result.success) {
      // Reset form
      setTradeSize('');
      setLeverage('10');
    } else {
      toast.error(result.message);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    const result = await closePosition(positionId);
    if (!result.success) {
      toast.error(result.message);
    }
  };

  // Validate trade inputs
  const isValidTrade = (): boolean => {
    if (!tradeSize || parseFloat(tradeSize) <= 0) return false;
    if (!leverage || parseFloat(leverage) <= 0 || parseFloat(leverage) > 100) return false;
    if (!currentPrice || currentPrice <= 0) return false;
    return marginRequired > 0 && availableBalance >= marginRequired;
  };

  const getBalanceValidationMessage = () => {
    if (!tradeSize || !leverage || parseFloat(tradeSize) <= 0 || parseFloat(leverage) <= 0) return null;
    
    if (marginRequired > availableBalance) {
      const shortfall = marginRequired - availableBalance;
      return `Insufficient balance! Required: $${marginRequired.toFixed(2)} USDT, Available: $${availableBalance.toFixed(2)} USDT, Shortfall: $${shortfall.toFixed(2)} USDT`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading positions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Financial Metrics */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-gray-600">Market Price</div>
              <div className="text-xl font-bold text-gray-900 font-mono">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Available Balance</div>
              <div className="text-xl font-bold text-gray-900 font-mono">
                ${availableBalance.toFixed(2)} USDT
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Active Positions</div>
              <div className="text-xl font-bold text-gray-900">
                {positions.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Margin Used</div>
              <div className="text-xl font-bold text-gray-900 font-mono">
                ${totalMargin.toFixed(2)} USDT
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Unrealized P&L</div>
              <div 
                className={`text-xl font-bold font-mono ${
                  totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} USDT
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trading" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="trading" className="space-y-6">
          {/* Enhanced Trading Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Open Perpetual Position - {selectedPair}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Side Selection */}
              <div className="flex space-x-2">
                <Button
                  variant={tradeSide === 'long' ? 'default' : 'outline'}
                  onClick={() => setTradeSide('long')}
                  className={`flex-1 ${tradeSide === 'long' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Long (Buy)
                </Button>
                <Button
                  variant={tradeSide === 'short' ? 'default' : 'outline'}
                  onClick={() => setTradeSide('short')}
                  className={`flex-1 ${tradeSide === 'short' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Short (Sell)
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">Position Size ({baseAsset})</Label>
                  <Input
                    id="size"
                    type="number"
                    placeholder="0.001"
                    value={tradeSize}
                    onChange={(e) => setTradeSize(e.target.value)}
                    step="0.001"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="leverage">Leverage (1x - 100x)</Label>
                  <Input
                    id="leverage"
                    type="number"
                    placeholder="10"
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                    step="1"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              {/* Precise Trade Calculation */}
              {tradeSize && leverage && parseFloat(tradeSize) > 0 && parseFloat(leverage) > 0 && currentPrice > 0 && (
                <div className="bg-gray-50 p-4 rounded border space-y-2">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Trade Calculation</div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Position Size:</span>
                      <span className="font-mono font-semibold ml-2">
                        {parseFloat(tradeSize).toFixed(6)} {baseAsset}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Entry Price:</span>
                      <span className="font-mono font-semibold ml-2">
                        ${currentPrice.toFixed(2)}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Notional Value:</span>
                      <span className="font-mono font-semibold ml-2">
                        ${(parseFloat(tradeSize) * currentPrice).toFixed(2)}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Leverage:</span>
                      <span className="font-mono font-semibold ml-2">
                        {parseFloat(leverage).toFixed(0)}x
                      </span>
                    </div>
                    
                    <div className="col-span-2 border-t pt-2 mt-2">
                      <span className="text-gray-600">Margin Required:</span>
                      <span className="font-mono font-bold ml-2 text-lg">
                        ${marginRequired.toFixed(2)} USDT
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="text-gray-600">Available Balance:</span>
                      <span 
                        className={`font-mono font-semibold ml-2 ${
                          availableBalance >= marginRequired ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${availableBalance.toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Validation Warning */}
              {getBalanceValidationMessage() && (
                <div className="flex items-start space-x-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{getBalanceValidationMessage()}</span>
                </div>
              )}

              <Button
                onClick={handleOpenPosition}
                disabled={!isValidTrade()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                Open {tradeSide.toUpperCase()} Position
                {marginRequired > 0 && ` (${marginRequired.toFixed(2)} USDT Margin)`}
              </Button>
            </CardContent>
          </Card>

          {/* Active Positions with Real-time PnL */}
          {positions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Active Positions ({positions.length})</span>
                  </div>
                  <div className="text-sm font-normal">
                    Total Unrealized P&L: 
                    <span 
                      className={`ml-2 font-mono font-bold ${
                        totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} USDT
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3">Pair</th>
                        <th className="text-center p-3">Side</th>
                        <th className="text-right p-3">Size</th>
                        <th className="text-right p-3">Entry Price</th>
                        <th className="text-right p-3">Mark Price</th>
                        <th className="text-right p-3">Unrealized P&L</th>
                        <th className="text-right p-3">Margin</th>
                        <th className="text-center p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((position) => (
                        <tr key={position.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 font-semibold">{position.pair}</td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant={position.side === 'long' ? 'default' : 'destructive'}
                              className="uppercase"
                            >
                              {position.side}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-mono">{position.size.toFixed(6)}</td>
                          <td className="p-3 text-right font-mono">${position.entry_price.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono">${position.current_price.toFixed(2)}</td>
                          <td className={`p-3 text-right font-mono font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                            <div className="text-xs">
                              ({position.pnl_percentage >= 0 ? '+' : ''}{position.pnl_percentage.toFixed(2)}%)
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono">${position.margin.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              onClick={() => handleClosePosition(position.id)}
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Close
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Trading History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allPositions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3">Pair</th>
                        <th className="text-center p-3">Side</th>
                        <th className="text-right p-3">Size</th>
                        <th className="text-right p-3">Entry</th>
                        <th className="text-right p-3">Exit</th>
                        <th className="text-right p-3">Realized P&L</th>
                        <th className="text-center p-3">Status</th>
                        <th className="text-right p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPositions.map((position) => (
                        <tr key={position.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 font-semibold">{position.pair}</td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant={position.side === 'long' ? 'default' : 'destructive'}
                              className="uppercase"
                            >
                              {position.side}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-mono">{position.size.toFixed(6)}</td>
                          <td className="p-3 text-right font-mono">${position.entry_price.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono">
                            {position.status === 'closed' ? `$${position.current_price.toFixed(2)}` : '-'}
                          </td>
                          <td className={`p-3 text-right font-mono font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                            <div className="text-xs">
                              ({position.pnl_percentage >= 0 ? '+' : ''}{position.pnl_percentage.toFixed(2)}%)
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={position.status === 'active' ? 'default' : 'secondary'}>
                              {position.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right text-xs">
                            {position.created_at.toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No trading history yet</p>
                  <p className="text-sm">Start trading to see your history here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerpetualTradingView;
