
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3 } from 'lucide-react';

interface Contract {
  id: string;
  symbol: string;
  type: 'spot' | 'futures';
  leverage: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
  openInterest?: string;
  fundingRate?: string;
  isPositive: boolean;
}

const ContractsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'spot' | 'futures'>('spot');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const contracts: Contract[] = [
    { id: '1', symbol: 'BTC/USDT', type: 'spot', leverage: '1x', price: '43,250.00', change: '+1,250.00', changePercent: '+2.98%', volume: '1.2B', isPositive: true },
    { id: '2', symbol: 'ETH/USDT', type: 'spot', leverage: '1x', price: '2,650.50', change: '+85.20', changePercent: '+3.32%', volume: '890M', isPositive: true },
    { id: '3', symbol: 'BTC/USDT', type: 'futures', leverage: '100x', price: '43,245.50', change: '+1,245.50', changePercent: '+2.96%', volume: '2.8B', openInterest: '1.5B', fundingRate: '0.0045%', isPositive: true },
    { id: '4', symbol: 'ETH/USDT', type: 'futures', leverage: '75x', price: '2,648.75', change: '+83.25', changePercent: '+3.25%', volume: '1.9B', openInterest: '890M', fundingRate: '0.0032%', isPositive: true },
    { id: '5', symbol: 'BNB/USDT', type: 'futures', leverage: '50x', price: '315.25', change: '-5.75', changePercent: '-1.79%', volume: '540M', openInterest: '234M', fundingRate: '-0.0021%', isPositive: false },
  ];

  const filteredContracts = contracts.filter(contract => contract.type === activeTab);

  const handleTradeClick = (contract: Contract) => {
    if (!user) {
      alert('Please login to start trading');
      return;
    }
    setSelectedContract(contract);
  };

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-exchange-text-primary mb-2">
            Trading Contracts
          </h1>
          <p className="text-exchange-text-secondary">
            Advanced spot and futures trading with leverage up to 100x
          </p>
        </div>

        {/* Contract Type Tabs */}
        <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6 mb-8">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('spot')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'spot'
                  ? 'bg-exchange-blue text-white'
                  : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              Spot Trading
            </button>
            <button
              onClick={() => setActiveTab('futures')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'futures'
                  ? 'bg-exchange-blue text-white'
                  : 'bg-exchange-accent text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              Futures Trading
            </button>
          </div>

          {/* Contract Info */}
          <div className="grid md:grid-cols-3 gap-4">
            {activeTab === 'spot' ? (
              <>
                <div className="bg-exchange-accent rounded-lg p-4 border border-exchange-border">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-8 h-8 text-exchange-blue" />
                    <div>
                      <div className="text-lg font-semibold text-exchange-text-primary">Spot Trading</div>
                      <div className="text-sm text-exchange-text-secondary">Buy and sell cryptocurrencies directly</div>
                    </div>
                  </div>
                </div>
                <div className="bg-exchange-accent rounded-lg p-4 border border-exchange-border">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-8 h-8 text-exchange-green" />
                    <div>
                      <div className="text-lg font-semibold text-exchange-text-primary">Low Fees</div>
                      <div className="text-sm text-exchange-text-secondary">0.1% trading fee</div>
                    </div>
                  </div>
                </div>
                <div className="bg-exchange-accent rounded-lg p-4 border border-exchange-border">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-8 h-8 text-exchange-red" />
                    <div>
                      <div className="text-lg font-semibold text-exchange-text-primary">Instant Settlement</div>
                      <div className="text-sm text-exchange-text-secondary">Real-time execution</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-exchange-accent rounded-lg p-4 border border-exchange-border">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-exchange-blue" />
                    <div>
                      <div className="text-lg font-semibold text-exchange-text-primary">High Leverage</div>
                      <div className="text-sm text-exchange-text-secondary">Up to 100x leverage</div>
                    </div>
                  </div>
                </div>
                <div className="bg-exchange-accent rounded-lg p-4 border border-exchange-border">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-8 h-8 text-exchange-green" />
                    <div>
                      <div className="text-lg font-semibold text-exchange-text-primary">Deep Liquidity</div>
                      <div className="text-sm text-exchange-text-secondary">$5B+ daily volume</div>
                    </div>
                  </div>
                </div>
                <div className="bg-exchange-accent rounded-lg p-4 border border-exchange-border">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-8 h-8 text-exchange-red" />
                    <div>
                      <div className="text-lg font-semibold text-exchange-text-primary">24/7 Trading</div>
                      <div className="text-sm text-exchange-text-secondary">Never miss an opportunity</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-exchange-panel rounded-xl border border-exchange-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-exchange-accent border-b border-exchange-border">
                <tr>
                  <th className="text-left p-4 text-exchange-text-secondary font-medium">Contract</th>
                  <th className="text-right p-4 text-exchange-text-secondary font-medium">Price</th>
                  <th className="text-right p-4 text-exchange-text-secondary font-medium">24h Change</th>
                  <th className="text-right p-4 text-exchange-text-secondary font-medium">Volume</th>
                  {activeTab === 'futures' && (
                    <>
                      <th className="text-right p-4 text-exchange-text-secondary font-medium">Open Interest</th>
                      <th className="text-right p-4 text-exchange-text-secondary font-medium">Funding Rate</th>
                    </>
                  )}
                  <th className="text-center p-4 text-exchange-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-exchange-border/30 hover:bg-exchange-accent/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-semibold text-exchange-text-primary">{contract.symbol}</div>
                          <div className="text-sm text-exchange-text-secondary">
                            {contract.type === 'futures' ? `${contract.leverage} Leverage` : 'Spot'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono text-exchange-text-primary font-semibold">
                        ${contract.price}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`font-mono ${contract.isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                        <div className="flex items-center justify-end space-x-1">
                          {contract.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{contract.changePercent}</span>
                        </div>
                        <div className="text-sm">{contract.change}</div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono text-exchange-text-primary">${contract.volume}</div>
                    </td>
                    {activeTab === 'futures' && (
                      <>
                        <td className="p-4 text-right">
                          <div className="font-mono text-exchange-text-primary">${contract.openInterest}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-mono ${contract.fundingRate?.startsWith('-') ? 'text-exchange-red' : 'text-exchange-green'}`}>
                            {contract.fundingRate}
                          </div>
                        </td>
                      </>
                    )}
                    <td className="p-4 text-center">
                      <div className="flex space-x-2 justify-center">
                        <Button
                          onClick={() => handleTradeClick(contract)}
                          className="bg-exchange-green hover:bg-exchange-green/90 text-white px-4 py-2"
                        >
                          Buy
                        </Button>
                        <Button
                          onClick={() => handleTradeClick(contract)}
                          className="bg-exchange-red hover:bg-exchange-red/90 text-white px-4 py-2"
                        >
                          Sell
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Book Preview */}
        {selectedContract && (
          <div className="mt-8 bg-exchange-panel rounded-xl border border-exchange-border p-6">
            <h3 className="text-xl font-semibold text-exchange-text-primary mb-4">
              Order Book - {selectedContract.symbol}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Buy Orders */}
              <div>
                <div className="text-exchange-green font-semibold mb-3">Buy Orders</div>
                <div className="space-y-2">
                  {[
                    { price: '43,248.50', amount: '0.245', total: '10,595.88' },
                    { price: '43,247.00', amount: '0.150', total: '6,487.05' },
                    { price: '43,245.50', amount: '0.380', total: '16,433.29' },
                    { price: '43,244.00', amount: '0.125', total: '5,405.50' },
                  ].map((order, index) => (
                    <div key={index} className="flex justify-between text-sm bg-exchange-green/10 p-2 rounded">
                      <span className="text-exchange-green font-mono">{order.price}</span>
                      <span className="text-exchange-text-secondary font-mono">{order.amount}</span>
                      <span className="text-exchange-text-primary font-mono">{order.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sell Orders */}
              <div>
                <div className="text-exchange-red font-semibold mb-3">Sell Orders</div>
                <div className="space-y-2">
                  {[
                    { price: '43,252.50', amount: '0.185', total: '8,001.71' },
                    { price: '43,254.00', amount: '0.290', total: '12,543.66' },
                    { price: '43,255.50', amount: '0.165', total: '7,137.16' },
                    { price: '43,257.00', amount: '0.220', total: '9,516.54' },
                  ].map((order, index) => (
                    <div key={index} className="flex justify-between text-sm bg-exchange-red/10 p-2 rounded">
                      <span className="text-exchange-red font-mono">{order.price}</span>
                      <span className="text-exchange-text-secondary font-mono">{order.amount}</span>
                      <span className="text-exchange-text-primary font-mono">{order.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractsPage;
