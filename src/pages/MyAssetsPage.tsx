import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface Asset {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  change24h: string;
  changePercent: string;
  isPositive: boolean;
}

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'mining_reward';
  symbol: string;
  amount: string;
  price: string;
  total: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const MyAssetsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showBalances, setShowBalances] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const assets: Asset[] = [
    { symbol: 'USDT', name: 'Tether', balance: '2,500.00', usdValue: '2,500.00', change24h: '+0.00', changePercent: '+0.00%', isPositive: true },
    { symbol: 'BTC', name: 'Bitcoin', balance: '0.0580', usdValue: '2,508.50', change24h: '+74.75', changePercent: '+3.07%', isPositive: true },
    { symbol: 'ETH', name: 'Ethereum', balance: '0.9420', usdValue: '2,497.23', change24h: '+81.23', changePercent: '+3.36%', isPositive: true },
    { symbol: 'BNB', name: 'BNB', balance: '1.580', usdValue: '499.14', change24h: '-8.54', changePercent: '-1.68%', isPositive: false },
  ];

  const transactions: Transaction[] = [
    { id: '1', type: 'mining_reward', symbol: 'USDT', amount: '30.00', price: '1.00', total: '30.00', date: '2024-01-15 08:00', status: 'completed' },
    { id: '2', type: 'buy', symbol: 'BTC', amount: '0.0230', price: '43,200.00', total: '993.60', date: '2024-01-14 14:30', status: 'completed' },
    { id: '3', type: 'sell', symbol: 'ETH', amount: '0.1580', price: '2,640.00', total: '417.12', date: '2024-01-14 11:15', status: 'completed' },
    { id: '4', type: 'deposit', symbol: 'USDT', amount: '1,000.00', price: '1.00', total: '1,000.00', date: '2024-01-13 16:45', status: 'completed' },
    { id: '5', type: 'mining_reward', symbol: 'USDT', amount: '30.00', price: '1.00', total: '30.00', date: '2024-01-13 08:00', status: 'completed' },
  ];

  const totalBalance = assets.reduce((sum, asset) => sum + parseFloat(asset.usdValue), 0);
  const totalChange24h = assets.reduce((sum, asset) => sum + parseFloat(asset.change24h), 0);
  const totalChangePercent = totalBalance > 0 ? (totalChange24h / (totalBalance - totalChange24h)) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-exchange-bg flex items-center justify-center">
        <div className="text-exchange-text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-exchange-green" />;
      case 'sell':
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-exchange-red" />;
      case 'mining_reward':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-exchange-text-secondary" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'buy':
      case 'deposit':
      case 'mining_reward':
        return 'text-exchange-green';
      case 'sell':
      case 'withdrawal':
        return 'text-exchange-red';
      default:
        return 'text-exchange-text-secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-exchange-green/20 text-exchange-green';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'failed':
        return 'bg-exchange-red/20 text-exchange-red';
      default:
        return 'bg-exchange-text-secondary/20 text-exchange-text-secondary';
    }
  };

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Back Button - Top Left */}
        <div className="mb-6">
          <BackButton fallbackPath="/dashboard" label="← Dashboard" />
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-exchange-text-primary mb-2">
              My Assets
            </h1>
            <p className="text-exchange-text-secondary">
              Manage your cryptocurrency portfolio and view transaction history
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center space-x-2"
          >
            {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showBalances ? 'Hide' : 'Show'} Balances</span>
          </Button>
        </div>

        {/* Portfolio Overview */}
        <div className="bg-exchange-panel rounded-xl border border-exchange-border p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-exchange-blue/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-exchange-blue" />
                </div>
                <div>
                  <div className="text-sm text-exchange-text-secondary">Total Portfolio Value</div>
                  <div className="text-3xl font-bold text-exchange-text-primary">
                    {showBalances ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '****'}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-exchange-text-secondary mb-2">24h Change</div>
              <div className={`text-2xl font-bold ${totalChangePercent >= 0 ? 'text-exchange-green' : 'text-exchange-red'}`}>
                {showBalances ? (
                  <>
                    {totalChangePercent >= 0 ? '+' : ''}${totalChange24h.toFixed(2)} ({totalChangePercent.toFixed(2)}%)
                  </>
                ) : '****'}
              </div>
              <div className="flex items-center justify-center space-x-1 mt-1">
                {totalChangePercent >= 0 ? <TrendingUp className="w-4 h-4 text-exchange-green" /> : <TrendingDown className="w-4 h-4 text-exchange-red" />}
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="space-y-2">
                <Button className="bg-exchange-blue hover:bg-exchange-blue/90 w-full md:w-auto">
                  Deposit
                </Button>
                <Button variant="outline" className="w-full md:w-auto border-exchange-border">
                  Withdraw
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-exchange-border mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-exchange-blue text-exchange-blue'
                  : 'border-transparent text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              Assets Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-exchange-blue text-exchange-blue'
                  : 'border-transparent text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              Transaction History
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="bg-exchange-panel rounded-xl border border-exchange-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-exchange-accent border-b border-exchange-border">
                  <tr>
                    <th className="text-left p-4 text-exchange-text-secondary font-medium">Asset</th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">Balance</th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">USD Value</th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">24h Change</th>
                    <th className="text-center p-4 text-exchange-text-secondary font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, index) => (
                    <tr key={index} className="border-b border-exchange-border/30 hover:bg-exchange-accent/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-exchange-accent rounded-full flex items-center justify-center">
                            <span className="text-exchange-text-primary font-semibold text-sm">
                              {asset.symbol.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-exchange-text-primary">{asset.symbol}</div>
                            <div className="text-sm text-exchange-text-secondary">{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono text-exchange-text-primary">
                          {showBalances ? asset.balance : '****'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono text-exchange-text-primary font-semibold">
                          {showBalances ? `$${asset.usdValue}` : '****'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className={`font-mono ${asset.isPositive ? 'text-exchange-green' : 'text-exchange-red'}`}>
                          <div className="flex items-center justify-end space-x-1">
                            {asset.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span>{showBalances ? asset.changePercent : '****'}</span>
                          </div>
                          <div className="text-sm">
                            {showBalances ? asset.change24h : '****'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex space-x-2 justify-center">
                          <Button
                            size="sm"
                            className="bg-exchange-green hover:bg-exchange-green/90 text-white"
                          >
                            Buy
                          </Button>
                          <Button
                            size="sm"
                            className="bg-exchange-red hover:bg-exchange-red/90 text-white"
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
        )}

        {activeTab === 'transactions' && (
          <div className="bg-exchange-panel rounded-xl border border-exchange-border overflow-hidden">
            <div className="p-6 border-b border-exchange-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-exchange-text-primary">Recent Transactions</h3>
                <Button variant="outline" className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-exchange-accent border-b border-exchange-border">
                  <tr>
                    <th className="text-left p-4 text-exchange-text-secondary font-medium">Type</th>
                    <th className="text-left p-4 text-exchange-text-secondary font-medium">Asset</th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">Amount</th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">Total (USD)</th>
                    <th className="text-left p-4 text-exchange-text-secondary font-medium">Date</th>
                    <th className="text-center p-4 text-exchange-text-secondary font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-exchange-border/30 hover:bg-exchange-accent/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <span className={`capitalize font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-exchange-text-primary">{transaction.symbol}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-exchange-text-primary">
                          {showBalances ? transaction.amount : '****'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-exchange-text-primary font-semibold">
                          {showBalances ? `$${transaction.total}` : '****'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-exchange-text-secondary">{transaction.date}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAssetsPage;
