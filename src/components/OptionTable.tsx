
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
import { TrendingUp, TrendingDown, Clock, DollarSign, AlertCircle, X, Target } from 'lucide-react';

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
  const { optionTrades, activeTrades, closedTrades, openOptionTrade, closeOptionTrade } = useOptionTrades(selectedPair);
  const [contracts, setContracts] = useState<OptionContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'contracts' | 'positions'>('contracts');

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

    const result = await openOptionTrade(
      selectedContract.type,
      selectedContract.strikePrice,
      selectedContract.premium,
      amount,
      selectedContract.expiry
    );

    if (result.success) {
      setShowTradeModal(false);
      setSelectedContract(null);
      setTradeAmount('');
    } else {
      toast.error(result.message);
    }
  };

  const handleClosePosition = async (tradeId: string) => {
    const result = await closeOptionTrade(tradeId);
    if (!result.success) {
      toast.error(result.message);
    }
  };

  const getContractColor = (contract: OptionContract) => {
    return contract.type === 'call' ? 'text-exchange-green' : 'text-exchange-red';
  };

  const getContractIcon = (contract: OptionContract) => {
    return contract.type === 'call' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Current Price Banner */}
      <Card className="bg-exchange-panel border-exchange-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-exchange-text-primary">{selectedPair} Options</h3>
              <p className="text-sm text-exchange-text-secondary">Current Spot Price: ${currentPrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-exchange-text-secondary">Available Balance</div>
              <div className="text-lg font-semibold text-exchange-text-primary">${(usdtBalance?.available || 0).toFixed(2)} USDT</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'contracts'
              ? 'bg-exchange-blue text-white'
              : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
          }`}
        >
          Option Contracts
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'positions'
              ? 'bg-exchange-blue text-white'
              : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
          }`}
        >
          My Positions ({activeTrades.length})
        </button>
      </div>

      {/* Option Contracts Tab */}
      {activeTab === 'contracts' && (
        <Card className="bg-exchange-panel border-exchange-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-exchange-text-primary">
              <DollarSign className="w-5 h-5" />
              <span>Option Contracts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-exchange-border">
                    <th className="text-left p-3 font-semibold text-exchange-text-secondary">Type</th>
                    <th className="text-right p-3 font-semibold text-exchange-text-secondary">Strike Price</th>
                    <th className="text-right p-3 font-semibold text-exchange-text-secondary">Premium</th>
                    <th className="text-center p-3 font-semibold text-exchange-text-secondary">Expiry</th>
                    <th className="text-right p-3 font-semibold text-exchange-text-secondary">IV</th>
                    <th className="text-right p-3 font-semibold text-exchange-text-secondary">Delta</th>
                    <th className="text-center p-3 font-semibold text-exchange-text-secondary">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b border-exchange-border/30 hover:bg-exchange-accent/30 transition-colors">
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
                      <td className="p-3 text-right font-mono text-exchange-text-primary">${contract.strikePrice}</td>
                      <td className="p-3 text-right font-mono font-semibold text-exchange-text-primary">${contract.premium}</td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-exchange-text-primary">{contract.expiry}</span>
                          <span className="text-xs text-exchange-text-secondary flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {contract.timeToExpiry}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-exchange-text-primary">{contract.impliedVolatility.toFixed(1)}%</td>
                      <td className="p-3 text-right text-exchange-text-primary">{contract.delta.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleOpenTrade(contract)}
                          className="bg-exchange-blue hover:bg-exchange-blue/90 text-white"
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
      )}

      {/* My Positions Tab */}
      {activeTab === 'positions' && (
        <Card className="bg-exchange-panel border-exchange-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-exchange-text-primary">
              <Target className="w-5 h-5" />
              <span>My Option Positions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {optionTrades.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-exchange-text-secondary">No option positions found</div>
                <div className="text-xs text-exchange-text-secondary mt-1">Open your first option trade to see it here</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Positions */}
                {activeTrades.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-exchange-text-primary mb-3">Active Positions</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-exchange-border">
                            <th className="text-left p-3 font-semibold text-exchange-text-secondary">Type</th>
                            <th className="text-right p-3 font-semibold text-exchange-text-secondary">Strike</th>
                            <th className="text-right p-3 font-semibold text-exchange-text-secondary">Contracts</th>
                            <th className="text-right p-3 font-semibold text-exchange-text-secondary">Premium Paid</th>
                            <th className="text-right p-3 font-semibold text-exchange-text-secondary">Current P&L</th>
                            <th className="text-center p-3 font-semibold text-exchange-text-secondary">Expiry</th>
                            <th className="text-center p-3 font-semibold text-exchange-text-secondary">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeTrades.map((trade) => (
                            <tr key={trade.id} className="border-b border-exchange-border/30 hover:bg-exchange-accent/30">
                              <td className="p-3">
                                <Badge variant={trade.type === 'call' ? 'default' : 'destructive'} className="uppercase">
                                  {trade.type}
                                </Badge>
                              </td>
                              <td className="p-3 text-right font-mono text-exchange-text-primary">${trade.strike_price}</td>
                              <td className="p-3 text-right font-mono text-exchange-text-primary">{trade.contracts}</td>
                              <td className="p-3 text-right font-mono text-exchange-text-primary">${(trade.premium_paid * trade.contracts).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono">
                                <span className={trade.pnl >= 0 ? 'text-exchange-green' : 'text-exchange-red'}>
                                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                </span>
                                <div className={`text-xs ${trade.pnl >= 0 ? 'text-exchange-green' : 'text-exchange-red'}`}>
                                  ({trade.pnl_percentage >= 0 ? '+' : ''}{trade.pnl_percentage.toFixed(1)}%)
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="text-exchange-text-primary">{trade.expiry}</div>
                                <div className="text-xs text-exchange-text-secondary">
                                  {trade.expiry_timestamp.toLocaleString()}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  size="sm"
                                  onClick={() => handleClosePosition(trade.id)}
                                  className="bg-exchange-red hover:bg-exchange-red/90 text-white"
                                >
                                  Close
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Closed Positions */}
                {closedTrades.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-exchange-text-primary mb-3">Closed Positions</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-exchange-border">
                            <th className="text-left p-3 font-semibold text-exchange-text-secondary">Type</th>
                            <th className="text-right p-3 font-semibold text-exchange-text-secondary">Strike</th>
                            <th className="text-right p-3 font-semibold text-exchange-text-secondary">Contracts</th>
                            <th className="text-right p-3 font-semibold text-exchange-text-secondary">Final P&L</th>
                            <th className="text-center p-3 font-semibold text-exchange-text-secondary">Status</th>
                            <th className="text-center p-3 font-semibold text-exchange-text-secondary">Closed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {closedTrades.slice(0, 10).map((trade) => (
                            <tr key={trade.id} className="border-b border-exchange-border/30">
                              <td className="p-3">
                                <Badge variant={trade.type === 'call' ? 'default' : 'destructive'} className="uppercase">
                                  {trade.type}
                                </Badge>
                              </td>
                              <td className="p-3 text-right font-mono text-exchange-text-primary">${trade.strike_price}</td>
                              <td className="p-3 text-right font-mono text-exchange-text-primary">{trade.contracts}</td>
                              <td className="p-3 text-right font-mono">
                                <span className={trade.pnl >= 0 ? 'text-exchange-green' : 'text-exchange-red'}>
                                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                </span>
                                <div className={`text-xs ${trade.pnl >= 0 ? 'text-exchange-green' : 'text-exchange-red'}`}>
                                  ({trade.pnl_percentage >= 0 ? '+' : ''}{trade.pnl_percentage.toFixed(1)}%)
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant={trade.status === 'exercised' ? 'default' : 'secondary'}>
                                  {trade.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-center text-exchange-text-secondary text-xs">
                                {trade.closed_at?.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trade Modal */}
      {showTradeModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md mx-4 bg-exchange-panel border-exchange-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-semibold text-exchange-text-primary">
                Open {selectedContract.type.toUpperCase()} Option
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTradeModal(false)}
                className="text-exchange-text-secondary hover:text-exchange-text-primary"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-exchange-text-secondary">Strike Price:</span>
                    <div className="font-semibold text-exchange-text-primary">${selectedContract.strikePrice}</div>
                  </div>
                  <div>
                    <span className="text-exchange-text-secondary">Premium:</span>
                    <div className="font-semibold text-exchange-text-primary">${selectedContract.premium}</div>
                  </div>
                  <div>
                    <span className="text-exchange-text-secondary">Expiry:</span>
                    <div className="font-semibold text-exchange-text-primary">{selectedContract.expiry}</div>
                  </div>
                  <div>
                    <span className="text-exchange-text-secondary">Type:</span>
                    <div className={`font-semibold uppercase ${getContractColor(selectedContract)}`}>
                      {selectedContract.type}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount" className="text-exchange-text-secondary">Contracts</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter number of contracts"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="bg-exchange-accent border-exchange-border text-exchange-text-primary"
                  />
                </div>

                {tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <div className="bg-exchange-accent/50 p-3 rounded border border-exchange-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-exchange-text-secondary">Total Cost:</span>
                      <span className="font-semibold text-exchange-text-primary">
                        ${(parseFloat(tradeAmount) * selectedContract.premium).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-exchange-text-secondary">Available Balance:</span>
                      <span className="font-semibold text-exchange-text-primary">
                        ${(usdtBalance?.available || 0).toFixed(2)} USDT
                      </span>
                    </div>
                    {parseFloat(tradeAmount) * selectedContract.premium > (usdtBalance?.available || 0) && (
                      <div className="flex items-center space-x-1 text-exchange-red text-sm mt-2">
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
                    className="flex-1 border-exchange-border text-exchange-text-secondary hover:text-exchange-text-primary"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={executeTrade}
                    disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || 
                      (parseFloat(tradeAmount) * selectedContract.premium) > (usdtBalance?.available || 0)}
                    className="flex-1 bg-exchange-blue hover:bg-exchange-blue/90 text-white disabled:bg-exchange-accent disabled:text-exchange-text-secondary"
                  >
                    Open Trade
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OptionTable;
