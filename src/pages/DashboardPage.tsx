
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-base font-medium">Loading dashboard...</div>
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-700 text-base">
            Monitor your portfolio and manage your investments
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="assets" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              My Assets
            </TabsTrigger>
            <TabsTrigger 
              value="kyc" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              Profile & KYC
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Balance</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalances(!showBalances)}
                    className="h-8 w-8 p-0"
                  >
                    {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {showBalances ? `$${totalUSDValue.toFixed(2)}` : '****'}
                  </div>
                  <p className="text-xs text-gray-600">
                    +2.5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Active Assets</CardTitle>
                  <Wallet className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {nonZeroBalances.length}
                  </div>
                  <p className="text-xs text-gray-600">
                    Currencies with balance
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Portfolio Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    +12.5%
                  </div>
                  <p className="text-xs text-gray-600">
                    This month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    Quick Deposit
                  </CardTitle>
                  <CardDescription>
                    Fund your account instantly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowDepositModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    Deposit Funds
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Minus className="h-5 w-5 text-red-600" />
                    Quick Withdrawal
                  </CardTitle>
                  <CardDescription>
                    Withdraw your funds securely
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowWithdrawModal(true)}
                    variant="outline" 
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assets">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>My Assets</CardTitle>
                <CardDescription>
                  Overview of your cryptocurrency holdings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nonZeroBalances.length > 0 ? (
                    nonZeroBalances.map((balance) => (
                      <div key={balance.currency} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-gray-900">
                              {balance.currency.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{balance.currency}</div>
                            <div className="text-sm text-gray-600">
                              Available: {showBalances ? balance.available.toFixed(8) : '****'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {showBalances ? `$${(balance.available * (balance.currency === 'USDT' ? 1 : 50000)).toFixed(2)}` : '****'}
                          </div>
                          <div className="text-sm text-green-600">+2.5%</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No assets found. Make your first deposit to get started.</p>
                      <Button 
                        onClick={() => setShowDepositModal(true)}
                        className="mt-4 bg-red-600 hover:bg-red-700"
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
