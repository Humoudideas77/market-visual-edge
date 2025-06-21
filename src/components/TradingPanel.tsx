
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { Loader2, Calculator } from 'lucide-react';

interface TradingPanelProps {
  selectedPair: string;
}

const TradingPanel = ({ selectedPair }: TradingPanelProps) => {
  const { tradingPair, executeTrade } = useTradingEngine(selectedPair);
  const { getBalance } = useWallet();
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const [baseAsset, quoteAsset] = selectedPair.split('/');
  const baseBalance = getBalance(baseAsset);
  const quoteBalance = getBalance(quoteAsset);

  const currentPrice = tradingPair?.currentPrice || 0;
  const tradePrice = orderType === 'market' ? currentPrice : parseFloat(price) || currentPrice;
  const tradeAmount = parseFloat(amount) || 0;
  const totalCost = tradeAmount * tradePrice;

  // Set price to current market price when switching to limit order
  React.useEffect(() => {
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
        setAmount('');
        if (orderType === 'limit') {
          setPrice(currentPrice.toString());
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Trade execution failed');
    } finally {
      setLoading(false);
    }
  };

  const isValidTrade = () => {
    if (!amount || tradeAmount <= 0) return false;
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) return false;
    
    if (tradeTab === 'buy') {
      return (quoteBalance?.available || 0) >= totalCost;
    } else {
      return (baseBalance?.available || 0) >= tradeAmount;
    }
  };

  return (
    <div className="exchange-panel p-4">
      {/* Trade Type Tabs */}
      <div className="flex mb-4">
        <button 
          onClick={() => setTradeTab('buy')}
          className={`flex-1 py-2 text-sm font-medium rounded-l-md ${
            tradeTab === 'buy' 
              ? 'bg-exchange-green text-white' 
              : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
          }`}
        >
          Buy {baseAsset}
        </button>
        <button 
          onClick={() => setTradeTab('sell')}
          className={`flex-1 py-2 text-sm font-medium rounded-r-md ${
            tradeTab === 'sell' 
              ? 'bg-exchange-red text-white' 
              : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
          }`}
        >
          Sell {baseAsset}
        </button>
      </div>

      <div className="space-y-4">
        {/* Order Type */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setOrderType('limit')}
            className={`px-3 py-1 text-xs rounded ${
              orderType === 'limit' 
                ? 'bg-exchange-blue text-white' 
                : 'bg-exchange-accent text-exchange-text-secondary'
            }`}
          >
            Limit
          </button>
          <button 
            onClick={() => setOrderType('market')}
            className={`px-3 py-1 text-xs rounded ${
              orderType === 'market' 
                ? 'bg-exchange-blue text-white' 
                : 'bg-exchange-accent text-exchange-text-secondary'
            }`}
          >
            Market
          </button>
        </div>

        {/* Available Balance */}
        <div className="text-xs text-exchange-text-secondary">
          Available: {tradeTab === 'buy' 
            ? `${(quoteBalance?.available || 0).toFixed(2)} ${quoteAsset}`
            : `${(baseBalance?.available || 0).toFixed(8)} ${baseAsset}`
          }
        </div>

        {/* Price Input (for limit orders) */}
        {orderType === 'limit' && (
          <div>
            <Label className="block text-xs text-exchange-text-secondary mb-1">Price</Label>
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
          <Label className="block text-xs text-exchange-text-secondary mb-1">Amount</Label>
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
              className="flex-1 py-1 text-xs bg-exchange-accent text-exchange-text-secondary rounded hover:bg-exchange-accent/80"
            >
              {percent}%
            </button>
          ))}
        </div>

        {/* Total */}
        <div>
          <Label className="block text-xs text-exchange-text-secondary mb-1">Total</Label>
          <div className="exchange-input w-full bg-exchange-accent/30 border border-exchange-border rounded p-2 font-mono text-sm">
            {totalCost.toFixed(2)} {quoteAsset}
          </div>
        </div>

        {/* Trade Summary */}
        {amount && tradeAmount > 0 && (
          <div className="bg-exchange-accent/20 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-exchange-text-secondary">Order Type:</span>
              <span className="text-exchange-text-primary capitalize">{orderType}</span>
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

        {/* Submit Button */}
        <Button 
          onClick={handleTrade}
          disabled={loading || !isValidTrade()}
          className={`w-full py-3 rounded-md font-medium ${
            tradeTab === 'buy' 
              ? 'bg-exchange-green hover:bg-exchange-green/90 text-white' 
              : 'bg-exchange-red hover:bg-exchange-red/90 text-white'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4 mr-2" />
          )}
          {tradeTab === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
        </Button>

        {/* Insufficient Balance Warning */}
        {amount && !isValidTrade() && (
          <div className="text-xs text-exchange-red text-center">
            Insufficient {tradeTab === 'buy' ? quoteAsset : baseAsset} balance
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingPanel;
