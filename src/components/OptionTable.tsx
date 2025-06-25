
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useCryptoPrices, getPriceBySymbol } from '@/hooks/useCryptoPrices';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, DollarSign, AlertCircle } from 'lucide-react';

interface OptionTableProps {
  selectedPair: string;
}

interface OptionContract {
  id: string;
  type: 'call' | 'put';
  strikePrice: number;
  premium: number;
  expiry: string;
  timeToExpiry: string;
  impliedVolatility: number;
  delta: number;
  isActive: boolean;
}

const OptionTable = ({ selectedPair }: OptionTableProps) => {
  const { getBalance, executeTransaction } = useWallet();
  const { prices } = useCryptoPrices();
  const [contracts, setContracts] = useState<OptionContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [showTradeModal, setShowTradeModal] = useState(false);

  const [baseAsset] = selectedPair.split('/');
  const currentPrice = getPriceBySymbol(prices, baseAsset)?.current_price || 0;
  const usdtBalance = getBalance('USDT');

  // Generate mock option contracts
  useEffect(() => {
    if (currentPrice > 0) {
      const mockContracts: OptionContract[] = [];
      const expiryDates = ['1H', '4H', '1D', '7D'];
      
      expiryDates.forEach((expiry) => {
        // Generate strike prices around current price
        for (let i = -2; i <= 2; i++) {
          const strikeOffset = currentPrice * (i * 0.05); // 5% increments
          const strikePrice = currentPrice + strikeOffset;
          
          // Call option
          mockContracts.push({
            id: `call-${expiry}-${i}`,
            type: 'call',
            strikePrice: parseFloat(strikePrice.toFixed(2)),
            premium: parseFloat((currentPrice * 0.02 + Math.abs(i) * 0.5).toFixed(2)),
            expiry,
            timeToExpiry: getTimeToExpiry(expiry),
            impliedVolatility: 25 + Math.random() * 20,
            delta: 0.5 + (i * 0.1),
            isActive: true
          });

          // Put option
          mockContracts.push({
            id: `put-${expiry}-${i}`,
            type: 'put',
            strikePrice: parseFloat(strikePrice.toFixed(2)),
            premium: parseFloat((currentPrice * 0.02 + Math.abs(i) * 0.5).toFixed(2)),
            expiry,
            timeToExpiry: getTimeToExpiry(expiry),
            impliedVolatility: 25 + Math.random() * 20,
            delta: -0.5 - (i * 0.1),
            isActive: true
          });
        }
      });

      setContracts(mockContracts);
    }
  }, [currentPrice]);

  const getTimeToExpiry = (expiry: string): string => {
    switch (expiry) {
      case '1H': return '59:45';
      case '4H': return '3:59:45';
      case '1D': return '23:59:45';
      case '7D': return '6d 23:59:45';
      default: return '00:00';
    }
  };

  const handleOpenTrade = (contract: OptionContract) => {
    setSelectedContract(contract);
    setShowTradeModal(true);
    setTradeAmount('');
  };

  const executeTrade = async () => {
    if (!selectedContract || !tradeAmount) {
      toast.error('Please enter a valid trade amount');
      return;
    }

    const amount = parseFloat(tradeAmount);
    if (amount <= 0) {
      toast.error('Trade amount must be greater than 0');
      return;
    }

    const totalCost = amount * selectedContract.premium;
    const availableBalance = usdtBalance?.available || 0;

    // Check if user has sufficient balance
    if (availableBalance < totalCost) {
      toast.error(`Insufficient balance! You need $${totalCost.toFixed(2)} USDT but only have $${availableBalance.toFixed(2)} USDT available.`);
      return;
    }

    try {
      // Deduct the premium from user's balance
      const success = await executeTransaction({
        type: 'trade_sell',
        currency: 'USDT',
        amount: totalCost
      });

      if (success) {
        toast.success(`✅ ${selectedContract.type.toUpperCase()} option opened successfully! Premium paid: $${totalCost.toFixed(2)} USDT`);
        setShowTradeModal(false);
        setSelectedContract(null);
        setTradeAmount('');
      } else {
        toast.error('Failed to execute trade. Please try again.');
      }
    } catch (error) {
      console.error('Trade execution error:', error);
      toast.error('Trade execution failed. Please try again.');
    }
  };

  const getContractColor = (contract: OptionContract) => {
    return contract.type === 'call' ? 'text-green-600' : 'text-red-600';
  };

  const getContractIcon = (contract: OptionContract) => {
    return contract.type === 'call' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Current Price Banner */}
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
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Open {selectedContract.type.toUpperCase()} Option
            </h3>
            
            <div className="space-y-4">
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
                <Label htmlFor="amount">Contracts</Label>
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
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OptionTable;
