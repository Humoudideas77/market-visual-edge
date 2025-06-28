
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  FileCheck, 
  Activity,
  Plus,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import EnhancedDepositModal from '@/components/EnhancedDepositModal';
import WithdrawModal from '@/components/WithdrawModal';
import KYCSection from '@/components/KYCSection';
import UserActivitySection from '@/components/UserActivitySection';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { balances, loading: walletLoading } = useWallet();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || walletLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-base font-medium">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalUSDValue = balances.reduce((total, balance) => {
    if (balance.currency === 'USDT') {
      return total + balance.available;
    }
    return total + (balance.available * 50000); // Mock conversion rate
  }, 0);

  const nonZeroBalances = balances.filter(balance => balance.available > 0 || balance.locked > 0);

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-300 text-base">
            Monitor your portfolio and manage your investments
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border border-gray-600 shadow-lg">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="assets" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              My Assets
            </TabsTrigger>
            <TabsTrigger 
              value="kyc" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              Profile & KYC
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gray-800 border-gray-600 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Balance</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalances(!showBalances)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  >
                    {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {showBalances ? `$${totalUSDValue.toFixed(2)}` : '****'}
                  </div>
                  <p className="text-xs text-green-400">
                    +2.5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-600 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Active Assets</CardTitle>
                  <Wallet className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {nonZeroBalances.length}
                  </div>
                  <p className="text-xs text-gray-400">
                    Currencies with balance
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-600 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Portfolio Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    +12.5%
                  </div>
                  <p className="text-xs text-gray-400">
                    This month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card className="bg-gray-800 border-gray-600 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Plus className="h-5 w-5 text-green-400" />
                    Quick Deposit
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Fund your account instantly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowDepositModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    Deposit Funds
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-600 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Minus className="h-5 w-5 text-red-400" />
                    Quick Withdrawal
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Withdraw your funds securely
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowWithdrawModal(true)}
                    variant="outline" 
                    className="w-full border-red-500 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assets">
            <Card className="bg-gray-800 border-gray-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">My Assets</CardTitle>
                <CardDescription className="text-gray-400">
                  Overview of your cryptocurrency holdings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nonZeroBalances.length > 0 ? (
                    nonZeroBalances.map((balance) => (
                      <div key={balance.currency} className="flex items-center justify-between p-4 border border-gray-600 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-white">
                              {balance.currency.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-white">{balance.currency}</div>
                            <div className="text-sm text-gray-400">
                              Available: {showBalances ? balance.available.toFixed(8) : '****'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">
                            {showBalances ? `$${(balance.available * (balance.currency === 'USDT' ? 1 : 50000)).toFixed(2)}` : '****'}
                          </div>
                          <div className="text-sm text-green-400">+2.5%</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No assets found. Make your first deposit to get started.</p>
                      <Button 
                        onClick={() => setShowDepositModal(true)}
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Make First Deposit
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <KYCSection />
          </TabsContent>

          <TabsContent value="activity">
            <UserActivitySection />
          </TabsContent>
        </Tabs>
      </div>

      {showDepositModal && (
        <EnhancedDepositModal 
          isOpen={showDepositModal} 
          onClose={() => setShowDepositModal(false)} 
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal 
          isOpen={showWithdrawModal} 
          onClose={() => setShowWithdrawModal(false)} 
        />
      )}
    </div>
  );
};

export default DashboardPage;
