
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-base font-medium">Loading...</div>
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
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'sell':
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'mining_reward':
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'buy':
      case 'deposit':
      case 'mining_reward':
        return 'text-green-600';
      case 'sell':
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Back Button - Top Left */}
        <div className="mb-6">
          <BackButton fallbackPath="/dashboard" label="← Dashboard" />
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              My Assets
            </h1>
            <p className="text-gray-700 text-base leading-relaxed">
              Manage your cryptocurrency portfolio and view transaction history
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
          >
            {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showBalances ? 'Hide' : 'Show'} Balances</span>
          </Button>
        </div>

        {/* Portfolio Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Total Portfolio Value</div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    {showBalances ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '****'}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2 font-medium">24h Change</div>
              <div className={`text-xl md:text-2xl font-bold ${totalChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {showBalances ? (
                  <>
                    {totalChangePercent >= 0 ? '+' : ''}${totalChange24h.toFixed(2)} ({totalChangePercent.toFixed(2)}%)
                  </>
                ) : '****'}
              </div>
              <div className="flex items-center justify-center space-x-1 mt-1">
                {totalChangePercent >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="space-y-2">
                <Button className="bg-red-600 hover:bg-red-700 w-full md:w-auto font-semibold text-white">
                  Deposit
                </Button>
                <Button variant="outline" className="w-full md:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                  Withdraw
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8 bg-white rounded-t-xl">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm md:text-base transition-colors ${
                activeTab === 'overview'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Assets Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm md:text-base transition-colors ${
                activeTab === 'transactions'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Transaction History
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-gray-700 font-semibold text-sm">Asset</th>
                    <th className="text-right p-4 text-gray-700 font-semibold text-sm">Balance</th>
                    <th className="text-right p-4 text-gray-700 font-semibold text-sm">USD Value</th>
                    <th className="text-right p-4 text-gray-700 font-semibold text-sm">24h Change</th>
                    <th className="text-center p-4 text-gray-700 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-900 font-semibold text-sm">
                              {asset.symbol.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-base">{asset.symbol}</div>
                            <div className="text-sm text-gray-600">{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono text-gray-900 font-medium">
                          {showBalances ? asset.balance : '****'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono text-gray-900 font-semibold">
                          {showBalances ? `$${asset.usdValue}` : '****'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className={`font-mono ${asset.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          <div className="flex items-center justify-end space-x-1">
                            {asset.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-semibold">{showBalances ? asset.changePercent : '****'}</span>
                          </div>
                          <div className="text-sm font-medium">
                            {showBalances ? asset.change24h : '****'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex space-x-2 justify-center">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                          >
                            Buy
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
                <Button variant="outline" className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-gray-700 font-semibold text-sm">Type</th>
                    <th className="text-left p-4 text-gray-700 font-semibold text-sm">Asset</th>
                    <th className="text-right p-4 text-gray-700 font-semibold text-sm">Amount</th>
                    <th className="text-right p-4 text-gray-700 font-semibold text-sm">Total (USD)</th>
                    <th className="text-left p-4 text-gray-700 font-semibold text-sm">Date</th>
                    <th className="text-center p-4 text-gray-700 font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <span className={`capitalize font-semibold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-gray-900">{transaction.symbol}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-gray-900 font-medium">
                          {showBalances ? transaction.amount : '****'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-gray-900 font-semibold">
                          {showBalances ? `$${transaction.total}` : '****'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-700 text-sm">{transaction.date}</span>
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
