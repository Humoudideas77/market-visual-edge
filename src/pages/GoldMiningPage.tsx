
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pickaxe, TrendingUp, Users, DollarSign, Calendar, Award, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface MiningPlan {
  id: string;
  name: string;
  minInvestment: number;
  maxInvestment: number;
  dailyReturn: number;
  maturityDays: number;
  totalReturn: number;
  referralBonus: number;
  popular?: boolean;
}

const GoldMiningPage = () => {
  const { user } = useAuth();
  const { balances, depositFunds } = useWallet();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<MiningPlan | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [showInvestForm, setShowInvestForm] = useState(false);
  const [isInvesting, setIsInvesting] = useState(false);

  // Get USDT balance for investment checking
  const usdtBalance = balances.find(b => b.currency === 'USDT')?.available || 0;

  const miningPlans: MiningPlan[] = [
    {
      id: 'basic',
      name: 'Basic Mining',
      minInvestment: 200,
      maxInvestment: 999,
      dailyReturn: 1.2,
      maturityDays: 30,
      totalReturn: 36,
      referralBonus: 5
    },
    {
      id: 'central',
      name: 'Central Mining',
      minInvestment: 1000,
      maxInvestment: 4999,
      dailyReturn: 2.0,
      maturityDays: 45,
      totalReturn: 90,
      referralBonus: 8,
      popular: true
    },
    {
      id: 'advanced',
      name: 'Advanced Mining',
      minInvestment: 5000,
      maxInvestment: 19999,
      dailyReturn: 2.8,
      maturityDays: 60,
      totalReturn: 168,
      referralBonus: 12
    },
    {
      id: 'premium',
      name: 'Premium Mining',
      minInvestment: 20000,
      maxInvestment: 100000,
      dailyReturn: 3.5,
      maturityDays: 90,
      totalReturn: 315,
      referralBonus: 15
    }
  ];

  // Mock active investment
  const activeInvestment = {
    planName: 'Central Mining',
    investmentAmount: 2500,
    dailyReturn: 50,
    daysActive: 12,
    totalEarned: 600,
    nextPayout: '06:45:23',
    roi: 24
  };

  const handlePlanSelect = (plan: MiningPlan) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedPlan(plan);
    setShowInvestForm(true);
    setInvestmentAmount(plan.minInvestment.toString());
  };

  const handleInvestment = async () => {
    if (!selectedPlan || !investmentAmount || !user) return;

    const amount = parseFloat(investmentAmount);
    
    if (amount < selectedPlan.minInvestment || amount > selectedPlan.maxInvestment) {
      alert(`Investment amount must be between $${selectedPlan.minInvestment} and $${selectedPlan.maxInvestment.toLocaleString()}`);
      return;
    }

    if (amount > usdtBalance) {
      alert('Insufficient USDT balance. Please deposit funds first.');
      return;
    }

    setIsInvesting(true);
    
    // Simulate investment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully invested $${amount} in ${selectedPlan.name}!`);
      setShowInvestForm(false);
      setSelectedPlan(null);
      setInvestmentAmount('');
    } catch (error) {
      alert('Investment failed. Please try again.');
    } finally {
      setIsInvesting(false);
    }
  };

  const dailyReturns = [
    { date: '2024-01-20', amount: 50.00, plan: 'Central Mining', status: 'paid' },
    { date: '2024-01-19', amount: 50.00, plan: 'Central Mining', status: 'paid' },
    { date: '2024-01-18', amount: 50.00, plan: 'Central Mining', status: 'paid' },
    { date: '2024-01-17', amount: 50.00, plan: 'Central Mining', status: 'paid' },
    { date: '2024-01-16', amount: 50.00, plan: 'Central Mining', status: 'paid' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Pickaxe className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Gold Mining Investment
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Invest in our gold mining operations and earn guaranteed daily returns. 
            Start with as little as $200 and build your passive income stream.
          </p>
        </div>

        {/* Current Balance Alert */}
        <Card className="mb-6 sm:mb-8 bg-blue-50 border border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-900">Available Balance</div>
                  <div className="text-sm text-gray-600">USDT balance for mining investments</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">${usdtBalance.toLocaleString()}</div>
                <div className="text-sm text-gray-600">USDT</div>
              </div>
            </div>
            {usdtBalance < 200 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Minimum $200 USDT required for mining investment. Please deposit funds first.</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Investment Dashboard */}
        {user && (
          <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Award className="w-5 h-5 mr-2 text-red-600" />
                Active Mining Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600 mb-1">{activeInvestment.planName}</div>
                  <div className="text-sm text-gray-600">Active Plan</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-gray-900 mb-1">${activeInvestment.investmentAmount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Investment Amount</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-green-600 mb-1">${activeInvestment.dailyReturn}</div>
                  <div className="text-sm text-gray-600">Daily Return</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600 mb-1">{activeInvestment.nextPayout}</div>
                  <div className="text-sm text-gray-600">Next Payout</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-white rounded-lg border border-red-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <div className="flex space-x-6">
                    <span className="text-sm text-gray-600">Days Active: <span className="font-semibold text-gray-900">{activeInvestment.daysActive}</span></span>
                    <span className="text-sm text-gray-600">ROI: <span className="font-semibold text-green-600">{activeInvestment.roi}%</span></span>
                  </div>
                  <span className="text-lg font-bold text-green-600">Total Earned: ${activeInvestment.totalEarned}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mining Plans */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            Choose Your Mining Plan
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {miningPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                  plan.popular 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-red-300 bg-white'
                }`}
                onClick={() => handlePlanSelect(plan)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-red-600 mb-1">{plan.dailyReturn}%</div>
                  <div className="text-sm text-gray-600">Daily Return</div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Min Investment:</span>
                      <span className="font-semibold text-gray-900">${plan.minInvestment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Max Investment:</span>
                      <span className="font-semibold text-gray-900">${plan.maxInvestment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-900">{plan.maturityDays} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total ROI:</span>
                      <span className="font-semibold text-green-600">{plan.totalReturn}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Referral Bonus:</span>
                      <span className="font-semibold text-blue-600">{plan.referralBonus}%</span>
                    </div>
                  </div>

                  <Button 
                    className={`w-full mt-4 ${
                      plan.popular 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                    disabled={usdtBalance < plan.minInvestment}
                  >
                    {usdtBalance < plan.minInvestment ? 'Insufficient Balance' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Investment Form Modal */}
        {showInvestForm && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 text-center">
                  Invest in {selectedPlan.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Investment Amount (USD)</label>
                  <input
                    type="number"
                    min={selectedPlan.minInvestment}
                    max={Math.min(selectedPlan.maxInvestment, usdtBalance)}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder={`Min: $${selectedPlan.minInvestment} - Max: $${selectedPlan.maxInvestment.toLocaleString()}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {investmentAmount && parseFloat(investmentAmount) >= selectedPlan.minInvestment && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-700 mb-2 font-medium">Investment Summary:</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Daily Return:</span>
                        <span className="text-green-600 font-semibold">
                          ${(parseFloat(investmentAmount) * selectedPlan.dailyReturn / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Return ({selectedPlan.maturityDays} days):</span>
                        <span className="text-green-600 font-semibold">
                          ${(parseFloat(investmentAmount) * selectedPlan.totalReturn / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInvestForm(false);
                      setSelectedPlan(null);
                    }}
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={isInvesting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInvestment}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={isInvesting || !investmentAmount || parseFloat(investmentAmount) < selectedPlan.minInvestment}
                  >
                    {isInvesting ? 'Processing...' : 'Invest Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Daily Returns History */}
        {user && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">Daily Returns History</CardTitle>
                <Button variant="outline" className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-3 text-gray-700 font-medium text-sm">Date</th>
                      <th className="text-left p-3 text-gray-700 font-medium text-sm">Plan</th>
                      <th className="text-right p-3 text-gray-700 font-medium text-sm">Amount</th>
                      <th className="text-center p-3 text-gray-700 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReturns.map((return_, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900 text-sm">{return_.date}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-900 text-sm">{return_.plan}</td>
                        <td className="p-3 text-right">
                          <span className="text-green-600 font-semibold">${return_.amount.toFixed(2)}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GoldMiningPage;
