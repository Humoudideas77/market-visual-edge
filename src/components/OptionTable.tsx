
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useCryptoPrices, getPriceBySymbol } from '@/hooks/useCryptoPrices';
import { useOptionTrades } from '@/hooks/useOptionTrades';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, DollarSign, AlertCircle, X } from 'lucide-react';

interface OptionTableProps {
  selectedPair: string;
}

interface OptionContract {
  id: string;
  type: 'call' | 'put';
  strikePrice: number;
  premium: number;
  expiry: string;
  expiryMinutes: number;
  timeToExpiry: string;
  impliedVolatility: number;
  delta: number;
  isActive: boolean;
}

const OptionTable = ({ selectedPair }: OptionTableProps) => {
  const { getBalance } = useWallet();
  const { prices } = useCryptoPrices();
  const { activeTrades, closedTrades, openTrade, closeTrade, getTotalPnL } = useOptionTrades();
  const [contracts, setContracts] = useState<OptionContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showActiveTradesModal, setShowActiveTradesModal] = useState(false);

  const [baseAsset] = selectedPair.split('/');
  const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || 0;
  const usdtBalance = getBalance('USDT');

  // Generate option contracts based on current price
  useEffect(() => {
    if (currentPrice > 0) {
      const mockContracts: OptionContract[] = [];
      const expiryOptions = [
        { label: '1H', minutes: 60 },
        { label: '4H', minutes: 240 },
        { label: '1D', minutes: 1440 },
        { label: '7D', minutes: 10080 }
      ];
      
      expiryOptions.forEach((expiry) => {
        // Generate strike prices around current price
        for (let i = -2; i <= 2; i++) {
          const strikeOffset = currentPrice * (i * 0.05); // 5% increments
          const strikePrice = currentPrice + strikeOffset;
          
          // Calculate more realistic premium based on moneyness and time
          const moneyness = Math.abs(strikePrice - currentPrice) / currentPrice;
          const timeValue = Math.sqrt(expiry.minutes / 1440); // Time decay factor
          const basePremium = currentPrice * 0.02;
          const premium = basePremium * (1 + moneyness) * timeValue;
          
          // Call option
          mockContracts.push({
            id: `call-${expiry.label}-${i}`,
            type: 'call',
            strikePrice: parseFloat(strikePrice.toFixed(2)),
            premium: parseFloat(premium.toFixed(2)),
            expiry: expiry.label,
            expiryMinutes: expiry.minutes,
            timeToExpiry: getTimeToExpiry(expiry.minutes),
            impliedVolatility: 25 + Math.random() * 20,
            delta: 0.5 + (i * 0.1),
            isActive: true
          });

          // Put option
          mockContracts.push({
            id: `put-${expiry.label}-${i}`,
            type: 'put',
            strikePrice: parseFloat(strikePrice.toFixed(2)),
            premium: parseFloat(premium.toFixed(2)),
            expiry: expiry.label,
            expiryMinutes: expiry.minutes,
            timeToExpiry: getTimeToExpiry(expiry.minutes),
            impliedVolatility: 25 + Math.random() * 20,
            delta: -0.5 - (i * 0.1),
            isActive: true
          });
        }
      });

      setContracts(mockContracts);
    }
  }, [currentPrice]);

  const getTimeToExpiry = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days}d ${hours}h`;
  };

  const handleOpenTrade = (contract: OptionContract) => {
    setSelectedContract(contract);
    setShowTradeModal(true);
    setTradeAmount('');
  };

  const executeTrade = async () => {
    if (!selectedContract || !tradeAmount) {
      toast.error('Please enter a valid number of contracts');
      return;
    }

    const contracts = parseFloat(tradeAmount);
    if (contracts <= 0) {
      toast.error('Number of contracts must be greater than 0');
      return;
    }

    const result = await openTrade({
      type: selectedContract.type,
      strikePrice: selectedContract.strikePrice,
      premium: selectedContract.premium,
      contracts: contracts,
      expiryMinutes: selectedContract.expiryMinutes,
      baseAsset: baseAsset
    });

    if (result.success) {
      toast.success(result.message);
      setShowTradeModal(false);
      setSelectedContract(null);
      setTradeAmount('');
    } else {
      toast.error(result.message);
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    const result = await closeTrade(tradeId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const getContractColor = (contract: OptionContract) => {
    return contract.type === 'call' ? 'text-green-600' : 'text-red-600';
  };

  const getContractIcon = (contract: OptionContract) => {
    return contract.type === 'call' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const formatTimeRemaining = (expiryTime: Date): string => {
    const now = new Date();
    const remaining = expiryTime.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Current Price and Active Trades Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedPair} Options</h3>
                <p className="text-sm text-gray-600">Current Spot Price: ${currentPrice.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Available Balance</div>
                <div className="text-lg font-semibold text-gray-900">${(usdtBalance?.available || 0).toFixed(2)} USDT</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Trades</h3>
                <p className="text-sm text-gray-600">{activeTrades.length} open positions</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total P&L</div>
                <div className={`text-lg font-semibold ${getTotalPnL() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${getTotalPnL().toFixed(2)}
                </div>
              </div>
            </div>
            {activeTrades.length > 0 && (
              <Button
                onClick={() => setShowActiveTradesModal(true)}
                className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                View Active Trades
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Options Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Option Contracts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-right p-3 font-semibold">Strike Price</th>
                  <th className="text-right p-3 font-semibold">Premium</th>
                  <th className="text-center p-3 font-semibold">Expiry</th>
                  <th className="text-right p-3 font-semibold">IV</th>
                  <th className="text-right p-3 font-semibold">Delta</th>
                  <th className="text-center p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div className={`flex items-center space-x-2 ${getContractColor(contract)}`}>
                        {getContractIcon(contract)}
                        <Badge 
                          variant={contract.type === 'call' ? 'default' : 'destructive'}
                          className="uppercase"
                        >
                          {contract.type}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono">${contract.strikePrice}</td>
                    <td className="p-3 text-right font-mono font-semibold">${contract.premium}</td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">{contract.expiry}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {contract.timeToExpiry}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right">{contract.impliedVolatility.toFixed(1)}%</td>
                    <td className="p-3 text-right">{contract.delta.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        onClick={() => handleOpenTrade(contract)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Trade
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trade Modal */}
      {showTradeModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Open {selectedContract.type.toUpperCase()} Option
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTradeModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Strike Price:</span>
                  <div className="font-semibold">${selectedContract.strikePrice}</div>
                </div>
                <div>
                  <span className="text-gray-600">Premium:</span>
                  <div className="font-semibold">${selectedContract.premium}</div>
                </div>
                <div>
                  <span className="text-gray-600">Expiry:</span>
                  <div className="font-semibold">{selectedContract.expiry}</div>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <div className={`font-semibold uppercase ${getContractColor(selectedContract)}`}>
                    {selectedContract.type}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Number of Contracts</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter number of contracts"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>

              {tradeAmount && parseFloat(tradeAmount) > 0 && (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="flex justify-between text-sm">
                    <span>Total Cost:</span>
                    <span className="font-semibold">
                      ${(parseFloat(tradeAmount) * selectedContract.premium).toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Available Balance:</span>
                    <span className="font-semibold">
                      ${(usdtBalance?.available || 0).toFixed(2)} USDT
                    </span>
                  </div>
                  {parseFloat(tradeAmount) * selectedContract.premium > (usdtBalance?.available || 0) && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm mt-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Insufficient balance for this trade</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeTrade}
                  disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || 
                    (parseFloat(tradeAmount) * selectedContract.premium) > (usdtBalance?.available || 0)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  Open Trade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Trades Modal */}
      {showActiveTradesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Active Option Trades</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActiveTradesModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {activeTrades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active trades
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTrades.map((trade) => (
                    <div key={trade.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={trade.type === 'call' ? 'default' : 'destructive'}>
                            {trade.type.toUpperCase()}
                          </Badge>
                          <span className="font-semibold">${trade.strikePrice}</span>
                          <span className="text-sm text-gray-500">
                            {trade.contracts} contracts
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${trade.pnl.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {trade.isInMoney ? 'In the Money' : 'Out of Money'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Open Price:</span>
                          <div>${trade.openPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Current Price:</span>
                          <div>${trade.currentPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Premium Paid:</span>
                          <div>${trade.totalCost.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Time Left:</span>
                          <div>{formatTimeRemaining(trade.expiryTime)}</div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleCloseTrade(trade.id)}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        Close Position
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OptionTable;
