
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { useCryptoPrices, getPriceBySymbol } from '@/hooks/useCryptoPrices';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, BarChart3, AlertCircle, DollarSign } from 'lucide-react';

interface PerpetualTradingViewProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}

interface Position {
  id: string;
  pair: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  isActive: boolean;
}

const PerpetualTradingView = ({ selectedPair, onPairChange }: PerpetualTradingViewProps) => {
  const { getBalance, executeTransaction } = useWallet();
  const { prices } = useCryptoPrices();
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradeSize, setTradeSize] = useState('');
  const [leverage, setLeverage] = useState('10');
  const [tradeSide, setTradeSide] = useState<'long' | 'short'>('long');

  const [baseAsset] = selectedPair.split('/');
  const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || 0;
  const usdtBalance = getBalance('USDT');

  // Calculate margin required for the trade
  const calculateMargin = () => {
    if (!tradeSize || !leverage || !currentPrice) return 0;
    const size = parseFloat(tradeSize);
    const lev = parseFloat(leverage);
    return (size * currentPrice) / lev;
  };

  const marginRequired = calculateMargin();
  const availableBalance = usdtBalance?.available || 0;

  const openPosition = async () => {
    if (!tradeSize || parseFloat(tradeSize) <= 0) {
      toast.error('Please enter a valid trade size');
      return;
    }

    if (!leverage || parseFloat(leverage) <= 0) {
      toast.error('Please enter a valid leverage');
      return;
    }

    // Check if user has sufficient balance
    if (availableBalance < marginRequired) {
      toast.error(`Insufficient balance! You need $${marginRequired.toFixed(2)} USDT margin but only have $${availableBalance.toFixed(2)} USDT available.`);
      return;
    }

    try {
      // Deduct margin from user's balance
      const success = await executeTransaction({
        type: 'trade_sell',
        currency: 'USDT',
        amount: marginRequired
      });

      if (success) {
        const newPosition: Position = {
          id: `pos_${Date.now()}`,
          pair: selectedPair,
          side: tradeSide,
          size: parseFloat(tradeSize),
          entryPrice: currentPrice,
          currentPrice: currentPrice,
          pnl: 0,
          pnlPercentage: 0,
          leverage: parseFloat(leverage),
          margin: marginRequired,
          liquidationPrice: calculateLiquidationPrice(currentPrice, tradeSide, parseFloat(leverage)),
          isActive: true
        };

        setPositions(prev => [...prev, newPosition]);
        toast.success(`✅ ${tradeSide.toUpperCase()} position opened! Size: ${tradeSize} ${baseAsset}, Leverage: ${leverage}x`);
        
        // Reset form
        setTradeSize('');
        setLeverage('10');
      } else {
        toast.error('Failed to open position. Please try again.');
      }
    } catch (error) {
      console.error('Position opening error:', error);
      toast.error('Failed to open position. Please try again.');
    }
  };

  const calculateLiquidationPrice = (entryPrice: number, side: 'long' | 'short', leverage: number): number => {
    const liquidationMargin = 0.05; // 5% liquidation margin
    if (side === 'long') {
      return entryPrice * (1 - (1 / leverage) + liquidationMargin);
    } else {
      return entryPrice * (1 + (1 / leverage) - liquidationMargin);
    }
  };

  const closePosition = async (position: Position) => {
    try {
      // Calculate PnL
      const priceDiff = position.currentPrice - position.entryPrice;
      const pnl = position.side === 'long' 
        ? priceDiff * position.size
        : -priceDiff * position.size;

      // Return margin + PnL to user's balance
      const totalReturn = position.margin + pnl;
      
      if (totalReturn > 0) {
        await executeTransaction({
          type: 'trade_buy',
          currency: 'USDT',
          amount: totalReturn
        });
      }

      // Remove position from active positions
      setPositions(prev => prev.filter(p => p.id !== position.id));
      
      toast.success(`✅ Position closed! PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} USDT`);
    } catch (error) {
      console.error('Position closing error:', error);
      toast.error('Failed to close position. Please try again.');
    }
  };

  // Update positions with current prices
  useEffect(() => {
    if (positions.length > 0 && currentPrice > 0) {
      setPositions(prev => prev.map(position => {
        const priceDiff = currentPrice - position.entryPrice;
        const pnl = position.side === 'long' 
          ? priceDiff * position.size
          : -priceDiff * position.size;
        const pnlPercentage = (pnl / position.margin) * 100;

        return {
          ...position,
          currentPrice,
          pnl,
          pnlPercentage
        };
      }));
    }
  }, [currentPrice, positions.length]);

  return (
    <div className="space-y-6">
      {/* Current Price and Balance */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Current Price</div>
              <div className="text-xl font-bold text-gray-900">${currentPrice.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Available Balance</div>
              <div className="text-xl font-bold text-gray-900">${availableBalance.toFixed(2)} USDT</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Active Positions</div>
              <div className="text-xl font-bold text-gray-900">{positions.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Open Perpetual Position</span>
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
              Long
            </Button>
            <Button
              variant={tradeSide === 'short' ? 'default' : 'outline'}
              onClick={() => setTradeSide('short')}
              className={`flex-1 ${tradeSide === 'short' ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Short
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="size">Size ({baseAsset})</Label>
              <Input
                id="size"
                type="number"
                placeholder="0.1"
                value={tradeSize}
                onChange={(e) => setTradeSize(e.target.value)}
                step="0.001"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="leverage">Leverage</Label>
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

          {/* Trade Summary */}
          {tradeSize && leverage && parseFloat(tradeSize) > 0 && parseFloat(leverage) > 0 && (
            <div className="bg-gray-50 p-4 rounded border">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Position Size:</div>
                <div className="font-semibold">{parseFloat(tradeSize).toFixed(3)} {baseAsset}</div>
                
                <div>Notional Value:</div>
                <div className="font-semibold">${(parseFloat(tradeSize) * currentPrice).toFixed(2)}</div>
                
                <div>Margin Required:</div>
                <div className="font-semibold">${marginRequired.toFixed(2)} USDT</div>
                
                <div>Available Balance:</div>
                <div className="font-semibold">${availableBalance.toFixed(2)} USDT</div>
              </div>
              
              {marginRequired > availableBalance && (
                <div className="flex items-center space-x-1 text-red-600 text-sm mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Insufficient balance for this position size</span>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={openPosition}
            disabled={!tradeSize || !leverage || parseFloat(tradeSize) <= 0 || parseFloat(leverage) <= 0 || marginRequired > availableBalance}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
          >
            Open {tradeSide.toUpperCase()} Position
          </Button>
        </CardContent>
      </Card>

      {/* Active Positions */}
      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Active Positions</span>
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
                    <th className="text-right p-3">Current Price</th>
                    <th className="text-right p-3">PnL</th>
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
                      <td className="p-3 text-right font-mono">{position.size.toFixed(3)}</td>
                      <td className="p-3 text-right font-mono">${position.entryPrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">${position.currentPrice.toFixed(2)}</td>
                      <td className={`p-3 text-right font-mono font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                        <div className="text-xs">
                          ({position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono">${position.margin.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => closePosition(position)}
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
    </div>
  );
};

export default PerpetualTradingView;
