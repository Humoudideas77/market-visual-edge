
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface OrderBookEntry {
  price: string;
  amount: string;
  total: string;
}

interface Trade {
  price: string;
  amount: string;
  time: string;
  type: 'buy' | 'sell';
}

const TradingInterface = () => {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  
  // Mock order book data
  const [buyOrders] = useState<OrderBookEntry[]>([
    { price: '43,248.50', amount: '0.25643', total: '11,087.45' },
    { price: '43,247.20', amount: '0.18975', total: '8,205.87' },
    { price: '43,245.80', amount: '0.35421', total: '15,312.76' },
    { price: '43,244.10', amount: '0.12887', total: '5,571.23' },
    { price: '43,242.90', amount: '0.28764', total: '12,436.89' },
  ]);

  const [sellOrders] = useState<OrderBookEntry[]>([
    { price: '43,251.20', amount: '0.19876', total: '8,596.34' },
    { price: '43,252.80', amount: '0.31245', total: '13,515.67' },
    { price: '43,254.10', amount: '0.22183', total: '9,592.45' },
    { price: '43,255.60', amount: '0.15924', total: '6,887.23' },
    { price: '43,257.30', amount: '0.27645', total: '11,956.78' },
  ]);

  const [recentTrades] = useState<Trade[]>([
    { price: '43,249.80', amount: '0.12543', time: '14:23:45', type: 'buy' },
    { price: '43,248.20', amount: '0.08976', time: '14:23:42', type: 'sell' },
    { price: '43,250.10', amount: '0.21087', time: '14:23:38', type: 'buy' },
    { price: '43,247.90', amount: '0.15432', time: '14:23:35', type: 'sell' },
    { price: '43,251.50', amount: '0.09876', time: '14:23:32', type: 'buy' },
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-6">
      {/* Chart Section */}
      <div className="lg:col-span-8">
        <div className="exchange-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-exchange-text-primary">{selectedPair}</h2>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-mono text-exchange-green">$43,249.80</span>
                <div className="flex items-center text-exchange-green text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +1,250.00 (+2.98%)
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs bg-exchange-accent text-exchange-text-secondary rounded">1m</button>
              <button className="px-3 py-1 text-xs bg-exchange-blue text-white rounded">5m</button>
              <button className="px-3 py-1 text-xs bg-exchange-accent text-exchange-text-secondary rounded">15m</button>
              <button className="px-3 py-1 text-xs bg-exchange-accent text-exchange-text-secondary rounded">1h</button>
              <button className="px-3 py-1 text-xs bg-exchange-accent text-exchange-text-secondary rounded">4h</button>
              <button className="px-3 py-1 text-xs bg-exchange-accent text-exchange-text-secondary rounded">1D</button>
            </div>
          </div>
          
          {/* Mock Trading Chart */}
          <div className="h-96 bg-exchange-bg rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-exchange-text-secondary">TradingView Chart Integration</p>
              <p className="text-sm text-exchange-text-muted mt-1">Real-time candlestick chart would be integrated here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Book & Trading Panel */}
      <div className="lg:col-span-4 space-y-4">
        {/* Order Book */}
        <div className="exchange-panel p-4">
          <h3 className="text-lg font-semibold text-exchange-text-primary mb-4">Order Book</h3>
          
          {/* Sell Orders */}
          <div className="space-y-1 mb-4">
            <div className="grid grid-cols-3 text-xs text-exchange-text-secondary mb-2">
              <span>Price (USDT)</span>
              <span className="text-right">Amount (BTC)</span>
              <span className="text-right">Total</span>
            </div>
            {sellOrders.map((order, index) => (
              <div key={index} className="grid grid-cols-3 text-xs font-mono hover:bg-exchange-accent/30 px-1 py-0.5 rounded">
                <span className="text-exchange-red">{order.price}</span>
                <span className="text-right text-exchange-text-primary">{order.amount}</span>
                <span className="text-right text-exchange-text-secondary">{order.total}</span>
              </div>
            ))}
          </div>

          {/* Current Price */}
          <div className="text-center py-2 bg-exchange-green/10 rounded mb-4">
            <span className="text-exchange-green font-mono font-bold">43,249.80</span>
            <span className="text-exchange-text-secondary text-xs ml-2">≈ $43,249.80</span>
          </div>

          {/* Buy Orders */}
          <div className="space-y-1">
            {buyOrders.map((order, index) => (
              <div key={index} className="grid grid-cols-3 text-xs font-mono hover:bg-exchange-accent/30 px-1 py-0.5 rounded">
                <span className="text-exchange-green">{order.price}</span>
                <span className="text-right text-exchange-text-primary">{order.amount}</span>
                <span className="text-right text-exchange-text-secondary">{order.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Panel */}
        <div className="exchange-panel p-4">
          <div className="flex mb-4">
            <button 
              onClick={() => setTradeTab('buy')}
              className={`flex-1 py-2 text-sm font-medium ${tradeTab === 'buy' ? 'bg-exchange-green text-white' : 'bg-exchange-accent text-exchange-text-secondary'}`}
            >
              Buy BTC
            </button>
            <button 
              onClick={() => setTradeTab('sell')}
              className={`flex-1 py-2 text-sm font-medium ${tradeTab === 'sell' ? 'bg-exchange-red text-white' : 'bg-exchange-accent text-exchange-text-secondary'}`}
            >
              Sell BTC
            </button>
          </div>

          <div className="space-y-4">
            {/* Order Type */}
            <div className="flex space-x-2">
              <button 
                onClick={() => setOrderType('limit')}
                className={`px-3 py-1 text-xs rounded ${orderType === 'limit' ? 'bg-exchange-blue text-white' : 'bg-exchange-accent text-exchange-text-secondary'}`}
              >
                Limit
              </button>
              <button 
                onClick={() => setOrderType('market')}
                className={`px-3 py-1 text-xs rounded ${orderType === 'market' ? 'bg-exchange-blue text-white' : 'bg-exchange-accent text-exchange-text-secondary'}`}
              >
                Market
              </button>
            </div>

            {/* Price Input */}
            {orderType === 'limit' && (
              <div>
                <label className="block text-xs text-exchange-text-secondary mb-1">Price</label>
                <input 
                  type="text" 
                  className="exchange-input w-full" 
                  placeholder="43,249.80"
                />
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-xs text-exchange-text-secondary mb-1">Amount</label>
              <input 
                type="text" 
                className="exchange-input w-full" 
                placeholder="0.00000000"
              />
            </div>

            {/* Percentage Buttons */}
            <div className="flex space-x-2">
              {['25%', '50%', '75%', '100%'].map((percent) => (
                <button key={percent} className="flex-1 py-1 text-xs bg-exchange-accent text-exchange-text-secondary rounded hover:bg-exchange-accent/80">
                  {percent}
                </button>
              ))}
            </div>

            {/* Total */}
            <div>
              <label className="block text-xs text-exchange-text-secondary mb-1">Total</label>
              <input 
                type="text" 
                className="exchange-input w-full" 
                placeholder="0.00 USDT"
                readOnly
              />
            </div>

            {/* Submit Button */}
            <button className={`w-full py-3 rounded-md font-medium ${tradeTab === 'buy' ? 'buy-button' : 'sell-button'}`}>
              {tradeTab === 'buy' ? 'Buy BTC' : 'Sell BTC'}
            </button>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="exchange-panel p-4">
          <h3 className="text-sm font-semibold text-exchange-text-primary mb-3">Recent Trades</h3>
          <div className="space-y-1">
            <div className="grid grid-cols-3 text-xs text-exchange-text-secondary mb-2">
              <span>Price</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Time</span>
            </div>
            {recentTrades.map((trade, index) => (
              <div key={index} className="grid grid-cols-3 text-xs font-mono">
                <span className={trade.type === 'buy' ? 'text-exchange-green' : 'text-exchange-red'}>
                  {trade.price}
                </span>
                <span className="text-right text-exchange-text-primary">{trade.amount}</span>
                <span className="text-right text-exchange-text-secondary">{trade.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;
