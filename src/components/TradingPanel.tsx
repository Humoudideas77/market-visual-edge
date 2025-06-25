
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { Loader2, Calculator, TrendingUp, TrendingDown } from 'lucide-react';

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

  // Handle URL action parameter (for quick buy/sell)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'buy' || action === 'sell') {
      setTradeTab(action);
      console.log('TradingPanel - Setting trade tab from URL:', action);
    }
  }, [searchParams]);

  const [baseAsset, quoteAsset] = selectedPair.split('/');
  const baseBalance = getBalance(baseAsset);
  const quoteBalance = getBalance(quoteAsset);

  const currentPrice = tradingPair?.currentPrice || 0;
  const tradePrice = orderType === 'market' ? currentPrice : parseFloat(price) || currentPrice;
  const tradeAmount = parseFloat(amount) || 0;
  const totalCost = tradeAmount * tradePrice;

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
      const maxAmount = (availableQuote * percentage / 100) / tradePrice;
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

    // Enhanced balance validation to prevent the bug
    if (tradeTab === 'buy') {
      const availableQuote = quoteBalance?.available || 0;
      console.log('Buy validation - Available USDT:', availableQuote, 'Required:', totalCost);
      
      if (availableQuote < totalCost) {
        toast.error(`Insufficient ${quoteAsset} balance! You need ${totalCost.toFixed(2)} ${quoteAsset} but only have ${availableQuote.toFixed(2)} ${quoteAsset} available.`);
        return;
      }
      
      // Additional safety check for minimum balance
      if (totalCost > availableQuote) {
        toast.error(`Cannot buy ${tradeAmount.toFixed(8)} ${baseAsset}. Maximum you can buy is ${(availableQuote / tradePrice).toFixed(8)} ${baseAsset} with your current balance.`);
        return;
      }
    } else {
      const availableBase = baseBalance?.available || 0;
      console.log('Sell validation - Available base:', availableBase, 'Required:', tradeAmount);
      
      if (availableBase < tradeAmount) {
        toast.error(`Insufficient ${baseAsset} balance! You need ${tradeAmount.toFixed(8)} ${baseAsset} but only have ${availableBase.toFixed(8)} ${baseAsset} available.`);
        return;
      }
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
        toast.success(
          `✅ ${tradeTab.toUpperCase()} ${baseAsset} executed successfully! ${tradeAmount.toFixed(8)} ${baseAsset} at $${tradePrice.toFixed(2)}`
        );
        
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

  const isValidTrade = () => {
    if (!amount || tradeAmount <= 0) return false;
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) return false;
    
    if (tradeTab === 'buy') {
      const availableQuote = quoteBalance?.available || 0;
      return availableQuote >= totalCost && totalCost > 0;
    } else {
      const availableBase = baseBalance?.available || 0;
      return availableBase >= tradeAmount && tradeAmount > 0;
    }
  };

  const getInsufficientBalanceMessage = () => {
    if (!amount || tradeAmount <= 0) return null;
    
    if (tradeTab === 'buy') {
      const availableQuote = quoteBalance?.available || 0;
      if (availableQuote < totalCost) {
        return `Insufficient ${quoteAsset} balance (Available: ${availableQuote.toFixed(2)}, Required: ${totalCost.toFixed(2)})`;
      }
    } else {
      const availableBase = baseBalance?.available || 0;
      if (availableBase < tradeAmount) {
        return `Insufficient ${baseAsset} balance (Available: ${availableBase.toFixed(8)}, Required: ${tradeAmount.toFixed(8)})`;
      }
    }
    return null;
  };

  // Show loading state if trading pair is not loaded
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

        {/* Total */}
        <div>
          <Label className="block text-xs text-exchange-text-secondary mb-1">Total ({quoteAsset})</Label>
          <div className="exchange-input w-full bg-exchange-accent/30 border border-exchange-border rounded p-2 font-mono text-sm text-exchange-text-primary">
            {totalCost.toFixed(2)} {quoteAsset}
          </div>
        </div>

        {/* Trade Summary */}
        {amount && tradeAmount > 0 && (
          <div className="bg-exchange-accent/20 rounded-lg p-3 space-y-1 border border-exchange-border">
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
            <div className="flex justify-between text-xs border-t border-exchange-border pt-1">
              <span className="text-exchange-text-secondary">Total:</span>
              <span className="text-exchange-text-primary font-mono font-semibold">{totalCost.toFixed(2)} {quoteAsset}</span>
            </div>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {getInsufficientBalanceMessage() && (
          <div className="text-xs text-exchange-red text-center bg-red-50 border border-red-200 rounded p-2">
            {getInsufficientBalanceMessage()}
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
            ? 'Executes immediately at current market price' 
            : 'Executes only when price reaches your specified level'
          }
        </div>
      </div>
    </div>
  );
};

// Helper function for price formatting (if not imported)
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
