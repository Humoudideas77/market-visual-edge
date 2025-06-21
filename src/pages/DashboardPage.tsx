
import React, { useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useCryptoPrices, formatPrice, formatVolume } from '@/hooks/useCryptoPrices';
import DepositModal from '@/components/DepositModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownLeft,
  Eye,
  EyeOff,
  DollarSign
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { balances, transactions } = useWallet();
  const { prices } = useCryptoPrices();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);

  // Calculate total portfolio value in USD
  const totalPortfolioValue = balances.reduce((total, balance) => {
    if (balance.currency === 'USDT') {
      return total + balance.total;
    }
    const cryptoPrice = prices.find(p => p.symbol.toUpperCase() === balance.currency);
    return total + (balance.total * (cryptoPrice?.current_price || 0));
  }, 0);

  // Get recent transactions
  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-exchange-text-primary mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-exchange-text-secondary">
            Monitor your portfolio and manage your trades
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-exchange-text-primary">Total Portfolio Value</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHideBalances(!hideBalances)}
                >
                  {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowDepositModal(true)}
                  className="bg-exchange-green hover:bg-exchange-green/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-exchange-text-primary mb-2">
                {hideBalances ? '••••••' : `$${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div className="flex items-center text-exchange-green text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Portfolio tracking active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-exchange-text-primary flex items-center">
                <ArrowDownLeft className="w-4 h-4 mr-2 text-exchange-green" />
                Total Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-exchange-text-primary mb-1">
                {hideBalances ? '••••••' : `$${transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`}
              </div>
              <div className="text-xs text-exchange-text-secondary">
                {transactions.filter(t => t.type === 'deposit').length} deposits
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-exchange-text-primary flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-exchange-blue" />
                Active Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-exchange-text-primary mb-1">
                {transactions.filter(t => t.type.includes('trade')).length}
              </div>
              <div className="text-xs text-exchange-text-secondary">
                Total trades executed
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Balances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-exchange-text-primary flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Wallet Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {balances.filter(balance => balance.total > 0).map((balance) => {
                  const cryptoPrice = prices.find(p => p.symbol.toUpperCase() === balance.currency);
                  const usdValue = balance.currency === 'USDT' 
                    ? balance.total 
                    : balance.total * (cryptoPrice?.current_price || 0);

                  return (
                    <div key={balance.currency} className="flex items-center justify-between p-3 bg-exchange-accent/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-exchange-blue/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-exchange-blue">
                            {balance.currency.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-exchange-text-primary">
                            {balance.currency}
                          </div>
                          <div className="text-xs text-exchange-text-secondary">
                            Available: {hideBalances ? '••••••' : balance.available.toFixed(8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-exchange-text-primary">
                          {hideBalances ? '••••••' : balance.total.toFixed(8)}
                        </div>
                        <div className="text-xs text-exchange-text-secondary">
                          {hideBalances ? '••••••' : `≈ $${usdValue.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {balances.filter(balance => balance.total > 0).length === 0 && (
                  <div className="text-center py-8 text-exchange-text-secondary">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No balances yet</p>
                    <Button 
                      onClick={() => setShowDepositModal(true)}
                      className="mt-4 bg-exchange-green hover:bg-exchange-green/90"
                      size="sm"
                    >
                      Make your first deposit
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-exchange-text-primary">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-exchange-accent/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit' ? 'bg-exchange-green/20' :
                        transaction.type === 'trade_buy' ? 'bg-exchange-blue/20' :
                        transaction.type === 'trade_sell' ? 'bg-exchange-red/20' :
                        'bg-exchange-accent'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <ArrowDownLeft className="w-4 h-4 text-exchange-green" />
                        ) : transaction.type === 'trade_buy' ? (
                          <TrendingUp className="w-4 h-4 text-exchange-blue" />
                        ) : transaction.type === 'trade_sell' ? (
                          <TrendingDown className="w-4 h-4 text-exchange-red" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-exchange-text-secondary" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-exchange-text-primary capitalize">
                          {transaction.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-exchange-text-secondary">
                          {transaction.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono ${
                        transaction.type === 'deposit' || transaction.type === 'trade_buy' 
                          ? 'text-exchange-green' 
                          : 'text-exchange-red'
                      }`}>
                        {transaction.type === 'deposit' || transaction.type === 'trade_buy' ? '+' : '-'}
                        {transaction.amount.toFixed(8)} {transaction.currency}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        transaction.status === 'completed' ? 'bg-exchange-green/20 text-exchange-green' :
                        transaction.status === 'pending' ? 'bg-exchange-yellow/20 text-exchange-yellow' :
                        'bg-exchange-red/20 text-exchange-red'
                      }`}>
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentTransactions.length === 0 && (
                  <div className="text-center py-8 text-exchange-text-secondary">
                    <ArrowUpRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-exchange-text-primary">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => setShowDepositModal(true)}
                className="h-20 flex flex-col items-center justify-center bg-exchange-green hover:bg-exchange-green/90"
              >
                <Plus className="w-6 h-6 mb-2" />
                Deposit Funds
              </Button>
              <Button 
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/exchange'}
              >
                <TrendingUp className="w-6 h-6 mb-2" />
                View Markets
              </Button>
              <Button 
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/trading'}
              >
                <DollarSign className="w-6 h-6 mb-2" />
                Start Trading
              </Button>
              <Button 
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/assets'}
              >
                <Wallet className="w-6 h-6 mb-2" />
                My Assets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Modal */}
      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />
    </div>
  );
};

export default DashboardPage;
