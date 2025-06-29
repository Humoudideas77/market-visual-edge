
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { Loader2, Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface TradingPanelProps {
  selectedPair: string;
}

const TradingPanel = ({ selectedPair }: TradingPanelProps) => {
  const [searchParams] = useSearchParams();
  const { tradingPair, executeTrade } = useTradingEngine(selectedPair);
  const { getBalance } = useWallet();
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // Trading fee rate
  const TRADING_FEE_RATE = 0.001; // 0.1%

  // Handle URL action parameter
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'buy' || action === 'sell') {
      setTradeTab(action);
    }
  }, [searchParams]);

  const [baseAsset, quoteAsset] = selectedPair.split('/');
  const baseBalance = getBalance(baseAsset);
  const quoteBalance = getBalance(quoteAsset);

  const currentPrice = tradingPair?.currentPrice || 0;
  const tradePrice = orderType === 'market' ? currentPrice : parseFloat(price) || currentPrice;
  const tradeAmount = parseFloat(amount) || 0;
  const totalCost = tradeAmount * tradePrice;
  const tradingFees = totalCost * TRADING_FEE_RATE;
  const totalWithFees = tradeTab === 'buy' ? totalCost + tradingFees : totalCost;
  const netReceived = tradeTab === 'sell' ? totalCost - tradingFees : tradeAmount;

  // Set price to current market price when switching to limit order
  useEffect(() => {
    if (orderType === 'limit' && tradingPair && !price) {
      setPrice(tradingPair.currentPrice.toString());
    }
  }, [orderType, tradingPair, price]);

  const handlePercentageClick = (percentage: number) => {
    if (!tradingPair) return;

    if (tradeTab === 'buy') {
      const availableQuote = quoteBalance?.available || 0;
      const maxSpendable = availableQuote * percentage / 100;
      const maxAmount = maxSpendable / (tradePrice * (1 + TRADING_FEE_RATE));
      setAmount(maxAmount.toFixed(8));
    } else {
      const availableBase = baseBalance?.available || 0;
      const maxAmount = availableBase * percentage / 100;
      setAmount(maxAmount.toFixed(8));
    }
  };

  const handleTrade = async () => {
    if (!tradingPair || !amount) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      toast.error('Please enter a valid price');
      return;
    }

    if (tradeAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const result = await executeTrade(
        tradeTab,
        orderType,
        tradeAmount,
        orderType === 'limit' ? parseFloat(price) : undefined
      );

      if (result.success) {
        toast.success(result.message);
        
        // Reset form
        setAmount('');
        if (orderType === 'limit') {
          setPrice(currentPrice.toString());
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Trade execution error:', error);
      toast.error('Trade execution failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidTrade = (): boolean => {
    if (!amount || tradeAmount <= 0) return false;
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) return false;
    
    if (tradeTab === 'buy') {
      const availableQuote = quoteBalance?.available || 0;
      return availableQuote >= totalWithFees && totalWithFees > 0;
    } else {
      const availableBase = baseBalance?.available || 0;
      return availableBase >= tradeAmount && tradeAmount > 0;
    }
  };

  const getBalanceValidationMessage = () => {
    if (!amount || tradeAmount <= 0) return null;
    
    if (tradeTab === 'buy') {
      const availableQuote = quoteBalance?.available || 0;
      if (availableQuote < totalWithFees) {
        const shortfall = totalWithFees - availableQuote;
        return `Insufficient ${quoteAsset} balance. Required: ${totalWithFees.toFixed(2)} (including ${tradingFees.toFixed(2)} fees), Available: ${availableQuote.toFixed(2)}, Shortfall: ${shortfall.toFixed(2)}`;
      }
    } else {
      const availableBase = baseBalance?.available || 0;
      if (availableBase < tradeAmount) {
        const shortfall = tradeAmount - availableBase;
        return `Insufficient ${baseAsset} balance. Required: ${tradeAmount.toFixed(8)}, Available: ${availableBase.toFixed(8)}, Shortfall: ${shortfall.toFixed(8)}`;
      }
    }
    return null;
  };

  if (!tradingPair) {
    return (
      <div className="exchange-panel p-4">
        <div className="text-center py-8">
          <div className="text-exchange-text-secondary">Loading trading data for {selectedPair}...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="exchange-panel p-4">
      {/* Currency Header */}
      <div className="mb-4 p-3 bg-exchange-accent/20 rounded-lg border">
        <div className="text-sm font-semibold text-exchange-text-primary">Trading {selectedPair}</div>
        <div className="text-xs text-exchange-text-secondary">
          Current Price: <span className="text-exchange-text-primary font-mono">${formatPrice(currentPrice)}</span>
        </div>
        <div className="text-xs text-exchange-text-secondary mt-1">
          Trading Fee: <span className="text-exchange-text-primary">{(TRADING_FEE_RATE * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Trade Type Tabs */}
      <div className="flex mb-4">
        <button 
          onClick={() => setTradeTab('buy')}
          className={`flex-1 py-2 text-sm font-medium rounded-l-md transition-all duration-200 ${
            tradeTab === 'buy' 
              ? 'bg-exchange-green text-white shadow-sm' 
              : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary hover:bg-exchange-accent/80'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-1" />
          Buy {baseAsset}
        </button>
        <button 
          onClick={() => setTradeTab('sell')}
          className={`flex-1 py-2 text-sm font-medium rounded-r-md transition-all duration-200 ${
            tradeTab === 'sell' 
              ? 'bg-exchange-red text-white shadow-sm' 
              : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary hover:bg-exchange-accent/80'
          }`}
        >
          <TrendingDown className="w-4 h-4 inline mr-1" />
          Sell {baseAsset}
        </button>
      </div>

      <div className="space-y-4">
        {/* Order Type */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setOrderType('limit')}
            className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
              orderType === 'limit' 
                ? 'bg-exchange-blue text-white shadow-sm' 
                : 'bg-exchange-accent text-exchange-text-secondary hover:bg-exchange-accent/80'
            }`}
          >
            Limit Order
          </button>
          <button 
            onClick={() => setOrderType('market')}
            className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
              orderType === 'market' 
                ? 'bg-exchange-blue text-white shadow-sm' 
                : 'bg-exchange-accent text-exchange-text-secondary hover:bg-exchange-accent/80'
            }`}
          >
            Market Order
          </button>
        </div>

        {/* Available Balance */}
        <div className="text-xs text-exchange-text-secondary bg-exchange-accent/30 rounded p-2">
          Available: {tradeTab === 'buy' 
            ? `${(quoteBalance?.available || 0).toFixed(2)} ${quoteAsset}`
            : `${(baseBalance?.available || 0).toFixed(8)} ${baseAsset}`
          }
        </div>

        {/* Price Input (for limit orders) */}
        {orderType === 'limit' && (
          <div>
            <Label className="block text-xs text-exchange-text-secondary mb-1">Price ({quoteAsset})</Label>
            <Input 
              type="number" 
              className="exchange-input w-full font-mono" 
              placeholder={currentPrice.toString()}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
            />
          </div>
        )}

        {/* Amount Input */}
        <div>
          <Label className="block text-xs text-exchange-text-secondary mb-1">Amount ({baseAsset})</Label>
          <Input 
            type="number" 
            className="exchange-input w-full font-mono" 
            placeholder="0.00000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.00000001"
          />
        </div>

        {/* Percentage Buttons */}
        <div className="flex space-x-2">
          {[25, 50, 75, 100].map((percent) => (
            <button 
              key={percent}
              onClick={() => handlePercentageClick(percent)}
              className="flex-1 py-1 text-xs bg-exchange-accent text-exchange-text-secondary rounded hover:bg-exchange-accent/80 transition-colors"
            >
              {percent}%
            </button>
          ))}
        </div>

        {/* Trading Calculation Summary */}
        {amount && tradeAmount > 0 && (
          <div className="bg-exchange-accent/20 rounded-lg p-3 space-y-2 border border-exchange-border">
            <div className="text-xs font-semibold text-exchange-text-primary mb-2">Trade Summary</div>
            
            <div className="flex justify-between text-xs">
              <span className="text-exchange-text-secondary">Order Type:</span>
              <span className="text-exchange-text-primary capitalize font-medium">{orderType}</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-exchange-text-secondary">Price:</span>
              <span className="text-exchange-text-primary font-mono">${tradePrice.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-exchange-text-secondary">Amount:</span>
              <span className="text-exchange-text-primary font-mono">{tradeAmount.toFixed(8)} {baseAsset}</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-exchange-text-secondary">Subtotal:</span>
              <span className="text-exchange-text-primary font-mono">${totalCost.toFixed(2)} {quoteAsset}</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-exchange-text-secondary">Trading Fee ({(TRADING_FEE_RATE * 100).toFixed(1)}%):</span>
              <span className="text-exchange-text-primary font-mono">${tradingFees.toFixed(2)} {quoteAsset}</span>
            </div>
            
            <div className="flex justify-between text-xs border-t border-exchange-border pt-2">
              <span className="text-exchange-text-secondary font-semibold">
                {tradeTab === 'buy' ? 'Total Cost:' : 'Net Received:'}
              </span>
              <span className="text-exchange-text-primary font-mono font-semibold">
                {tradeTab === 'buy' 
                  ? `$${totalWithFees.toFixed(2)} ${quoteAsset}`
                  : `$${netReceived.toFixed(2)} ${quoteAsset}`
                }
              </span>
            </div>
          </div>
        )}

        {/* Balance Validation Warning */}
        {getBalanceValidationMessage() && (
          <div className="flex items-start space-x-2 text-xs text-exchange-red bg-red-50 border border-red-200 rounded p-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{getBalanceValidationMessage()}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleTrade}
          disabled={loading || !isValidTrade()}
          className={`w-full py-3 rounded-md font-medium transition-all duration-200 ${
            tradeTab === 'buy' 
              ? 'bg-exchange-green hover:bg-exchange-green/90 text-white disabled:bg-gray-400' 
              : 'bg-exchange-red hover:bg-exchange-red/90 text-white disabled:bg-gray-400'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing {tradeTab}...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 mr-2" />
              {tradeTab === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
            </>
          )}
        </Button>

        {/* Order Type Information */}
        <div className="text-xs text-exchange-text-secondary bg-blue-50 border border-blue-200 rounded p-2">
          <strong>{orderType === 'market' ? 'Market Order:' : 'Limit Order:'}</strong>{' '}
          {orderType === 'market' 
            ? 'Executes immediately at current market price with 0.1% trading fee' 
            : 'Executes only when price reaches your specified level with 0.1% trading fee'
          }
        </div>
      </div>
    </div>
  );
};

// Helper function for price formatting
const formatPrice = (price: number): string => {
  if (price < 1) {
    return price.toFixed(4);
  } else if (price < 100) {
    return price.toFixed(2);
  } else {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
};

export default TradingPanel;
