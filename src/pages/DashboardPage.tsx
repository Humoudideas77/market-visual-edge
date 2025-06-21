import React, { useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useMiningInvestments } from '@/hooks/useMiningInvestments';
import { useCryptoPrices, formatPrice, formatVolume } from '@/hooks/useCryptoPrices';
import EnhancedDepositModal from '@/components/EnhancedDepositModal';
import WithdrawModal from '@/components/WithdrawModal';
import CountdownTimer from '@/components/CountdownTimer';
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
  DollarSign,
  Pickaxe
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { balances, transactions } = useWallet();
  const { investments, getTotalEarnings } = useMiningInvestments();
  const { prices } = useCryptoPrices();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
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
  const recentTransactions = transactions.slice(0, 8);

  // Get active mining data
  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const totalMiningEarnings = getTotalEarnings();
  const dailyMiningReturn = activeInvestments.reduce((sum, inv) => 
    sum + (inv.investment_amount * inv.daily_return_rate / 100), 0
  );

  // Get next payout time for the earliest investment
  const nextActivePayout = activeInvestments.length > 0 
    ? activeInvestments.reduce((earliest, current) => 
        new Date(current.next_payout_date) < new Date(earliest.next_payout_date) ? current : earliest
      )
    : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Monitor your portfolio and manage your investments
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="col-span-1 sm:col-span-2 bg-white border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-gray-900 text-lg sm:text-xl">Total Portfolio Value</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHideBalances(!hideBalances)}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowDepositModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowWithdrawModal(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {hideBalances ? '••••••' : `$${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Portfolio tracking active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 flex items-center text-base sm:text-lg">
                <ArrowDownLeft className="w-4 h-4 mr-2 text-green-600" />
                Total Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {hideBalances ? '••••••' : `$${transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`}
              </div>
              <div className="text-xs text-gray-500">
                {transactions.filter(t => t.type === 'deposit').length} deposits
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 flex items-center text-base sm:text-lg">
                <Pickaxe className="w-4 h-4 mr-2 text-red-600" />
                Mining Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {hideBalances ? '••••••' : `$${totalMiningEarnings.toFixed(2)}`}
              </div>
              <div className="text-xs text-gray-500">
                Daily: ${dailyMiningReturn.toFixed(2)}/day
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Mining Plan */}
        {activeInvestments.length > 0 && nextActivePayout && (
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Pickaxe className="w-5 h-5 mr-2 text-red-600" />
                Next Mining Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Plan Type</div>
                  <div className="text-lg font-semibold text-gray-900">{nextActivePayout.plan_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Investment Amount</div>
                  <div className="text-lg font-semibold text-gray-900">${nextActivePayout.investment_amount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Daily Return</div>
                  <div className="text-lg font-semibold text-green-600">
                    +${((nextActivePayout.investment_amount * nextActivePayout.daily_return_rate) / 100).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Next Payout</div>
                  <CountdownTimer
                    targetDate={new Date(nextActivePayout.next_payout_date)}
                    className="text-lg font-semibold"
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Days Active: {Math.floor((new Date().getTime() - new Date(nextActivePayout.start_date).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    Total Earned: ${nextActivePayout.total_earned.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Wallet Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {balances.filter(balance => balance.total > 0).map((balance) => {
                  const cryptoPrice = prices.find(p => p.symbol.toUpperCase() === balance.currency);
                  const usdValue = balance.currency === 'USDT' 
                    ? balance.total 
                    : balance.total * (cryptoPrice?.current_price || 0);

                  return (
                    <div key={balance.currency} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-red-600">
                            {balance.currency.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {balance.currency}
                          </div>
                          <div className="text-xs text-gray-500">
                            Available: {hideBalances ? '••••••' : balance.available.toFixed(8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-gray-900">
                          {hideBalances ? '••••••' : balance.total.toFixed(8)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {hideBalances ? '••••••' : `≈ $${usdValue.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {balances.filter(balance => balance.total > 0).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No balances yet</p>
                    <Button 
                      onClick={() => setShowDepositModal(true)}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white"
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
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit' ? 'bg-green-100' :
                        transaction.type === 'trade_buy' ? 'bg-blue-100' :
                        transaction.type === 'trade_sell' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        ) : transaction.type === 'trade_buy' ? (
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                        ) : transaction.type === 'trade_sell' ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 capitalize text-sm">
                          {transaction.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm ${
                        transaction.type === 'deposit' || transaction.type === 'trade_buy' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' || transaction.type === 'trade_buy' ? '+' : '-'}
                        {transaction.amount.toFixed(4)} {transaction.currency}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-600' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ArrowUpRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Button 
                onClick={() => setShowDepositModal(true)}
                className="h-16 sm:h-20 flex flex-col items-center justify-center bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">Deposit Funds</span>
              </Button>
              <Button 
                onClick={() => setShowWithdrawModal(true)}
                className="h-16 sm:h-20 flex flex-col items-center justify-center bg-gray-600 hover:bg-gray-700 text-white"
              >
                <Minus className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">Withdraw Funds</span>
              </Button>
              <Button 
                variant="outline"
                className="h-16 sm:h-20 flex flex-col items-center justify-center border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => window.location.href = '/exchange'}
              >
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">View Markets</span>
              </Button>
              <Button 
                variant="outline"
                className="h-16 sm:h-20 flex flex-col items-center justify-center border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => window.location.href = '/gold-mining'}
              >
                <Pickaxe className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">Gold Mining</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Deposit Modal */}
      <EnhancedDepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />

      {/* Withdraw Modal */}
      <WithdrawModal 
        isOpen={showWithdrawModal} 
        onClose={() => setShowWithdrawModal(false)} 
      />
    </div>
  );
};

export default DashboardPage;
