
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Pickaxe, TrendingUp, Users, DollarSign, Calendar, Award, RefreshCw } from 'lucide-react';

interface MiningPlan {
  id: string;
  name: string;
  minInvestment: number;
  maxInvestment: number;
  dailyReturn: string;
  maturityDays: number;
  totalReturn: string;
  referralBonus: string;
}

interface MiningStats {
  totalInvested: string;
  dailyEarnings: string;
  totalEarnings: string;
  referralEarnings: string;
  activeReferrals: number;
}

const GoldMiningPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<MiningPlan | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<string>('');

  const miningPlans: MiningPlan[] = [
    {
      id: 'basic',
      name: 'Basic Mining',
      minInvestment: 100,
      maxInvestment: 999,
      dailyReturn: '0.8%',
      maturityDays: 30,
      totalReturn: '24%',
      referralBonus: '5%'
    },
    {
      id: 'standard',
      name: 'Standard Mining',
      minInvestment: 1000,
      maxInvestment: 4999,
      dailyReturn: '1.2%',
      maturityDays: 45,
      totalReturn: '54%',
      referralBonus: '7%'
    },
    {
      id: 'premium',
      name: 'Premium Mining',
      minInvestment: 5000,
      maxInvestment: 19999,
      dailyReturn: '1.6%',
      maturityDays: 60,
      totalReturn: '96%',
      referralBonus: '10%'
    },
    {
      id: 'vip',
      name: 'VIP Mining',
      minInvestment: 20000,
      maxInvestment: 100000,
      dailyReturn: '2.0%',
      maturityDays: 90,
      totalReturn: '180%',
      referralBonus: '15%'
    }
  ];

  const userStats: MiningStats = {
    totalInvested: '$2,500.00',
    dailyEarnings: '$30.00',
    totalEarnings: '$450.00',
    referralEarnings: '$125.00',
    activeReferrals: 8
  };

  const dailyReturns = [
    { date: '2024-01-15', amount: '$30.00', plan: 'Standard Mining', status: 'paid' },
    { date: '2024-01-14', amount: '$30.00', plan: 'Standard Mining', status: 'paid' },
    { date: '2024-01-13', amount: '$30.00', plan: 'Standard Mining', status: 'paid' },
    { date: '2024-01-12', amount: '$30.00', plan: 'Standard Mining', status: 'paid' },
    { date: '2024-01-11', amount: '$30.00', plan: 'Standard Mining', status: 'paid' },
  ];

  const handleInvest = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!selectedPlan || !investmentAmount) {
      alert('Please select a plan and enter an investment amount');
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (amount < selectedPlan.minInvestment || amount > selectedPlan.maxInvestment) {
      alert(`Investment amount must be between $${selectedPlan.minInvestment} and $${selectedPlan.maxInvestment}`);
      return;
    }

    // Simulate investment process
    alert(`Investment of $${amount} in ${selectedPlan.name} submitted successfully!`);
    setInvestmentAmount('');
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Pickaxe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-exchange-text-primary">
              Gold Mining Investment
            </h1>
          </div>
          <p className="text-xl text-exchange-text-secondary max-w-3xl mx-auto">
            Invest in our gold mining operations and earn guaranteed daily returns with our MLM referral system. 
            Start with as little as $100 and build your passive income stream.
          </p>
        </div>

        {user && (
          /* User Stats Dashboard */
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <DollarSign className="w-8 h-8 text-exchange-blue" />
                <div>
                  <div className="text-2xl font-bold text-exchange-text-primary">{userStats.totalInvested}</div>
                  <div className="text-sm text-exchange-text-secondary">Total Invested</div>
                </div>
              </div>
            </div>

            <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-8 h-8 text-exchange-green" />
                <div>
                  <div className="text-2xl font-bold text-exchange-text-primary">{userStats.dailyEarnings}</div>
                  <div className="text-sm text-exchange-text-secondary">Daily Earnings</div>
                </div>
              </div>
            </div>

            <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Award className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-exchange-text-primary">{userStats.totalEarnings}</div>
                  <div className="text-sm text-exchange-text-secondary">Total Earnings</div>
                </div>
              </div>
            </div>

            <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-exchange-text-primary">{userStats.activeReferrals}</div>
                  <div className="text-sm text-exchange-text-secondary">Active Referrals</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mining Plans */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-exchange-text-primary mb-8 text-center">
            Choose Your Mining Plan
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {miningPlans.map((plan) => (
              <div 
                key={plan.id}
                className={`bg-exchange-panel rounded-xl border p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedPlan?.id === plan.id 
                    ? 'border-yellow-500 bg-yellow-500/5' 
                    : 'border-exchange-border hover:border-yellow-500/50'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-exchange-text-primary mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-yellow-500 mb-1">{plan.dailyReturn}</div>
                  <div className="text-sm text-exchange-text-secondary">Daily Return</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-exchange-text-secondary">Min Investment:</span>
                    <span className="text-exchange-text-primary font-semibold">${plan.minInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-exchange-text-secondary">Max Investment:</span>
                    <span className="text-exchange-text-primary font-semibold">${plan.maxInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-exchange-text-secondary">Maturity:</span>
                    <span className="text-exchange-text-primary font-semibold">{plan.maturityDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-exchange-text-secondary">Total Return:</span>
                    <span className="text-exchange-green font-semibold">{plan.totalReturn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-exchange-text-secondary">Referral Bonus:</span>
                    <span className="text-exchange-blue font-semibold">{plan.referralBonus}</span>
                  </div>
                </div>

                {selectedPlan?.id === plan.id && (
                  <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="text-center text-yellow-600 font-semibold">Selected Plan</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Investment Form */}
        {selectedPlan && (
          <div className="bg-exchange-panel rounded-xl border border-exchange-border p-8 mb-12">
            <h3 className="text-2xl font-bold text-exchange-text-primary mb-6 text-center">
              Invest in {selectedPlan.name}
            </h3>
            
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <label className="block text-exchange-text-secondary mb-2">Investment Amount (USD)</label>
                <input
                  type="number"
                  min={selectedPlan.minInvestment}
                  max={selectedPlan.maxInvestment}
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder={`Min: $${selectedPlan.minInvestment} - Max: $${selectedPlan.maxInvestment.toLocaleString()}`}
                  className="w-full px-4 py-3 bg-exchange-accent border border-exchange-border rounded-lg text-exchange-text-primary placeholder:text-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {investmentAmount && (
                <div className="bg-exchange-accent rounded-lg p-4 mb-6">
                  <div className="text-sm text-exchange-text-secondary mb-2">Investment Summary:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Daily Return:</span>
                      <span className="text-exchange-green font-semibold">
                        ${(parseFloat(investmentAmount) * parseFloat(selectedPlan.dailyReturn.replace('%', '')) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Return:</span>
                      <span className="text-exchange-green font-semibold">
                        ${(parseFloat(investmentAmount) * parseFloat(selectedPlan.totalReturn.replace('%', '')) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleInvest}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-3 text-lg font-semibold"
              >
                {!user ? 'Login to Invest' : 'Start Mining'}
              </Button>
            </div>
          </div>
        )}

        {user && (
          /* Daily Returns Table */
          <div className="bg-exchange-panel rounded-xl border border-exchange-border overflow-hidden">
            <div className="p-6 border-b border-exchange-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-exchange-text-primary">Daily Returns History</h3>
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
                    <th className="text-left p-4 text-exchange-text-secondary font-medium">Date</th>
                    <th className="text-left p-4 text-exchange-text-secondary font-medium">Plan</th>
                    <th className="text-right p-4 text-exchange-text-secondary font-medium">Amount</th>
                    <th className="text-center p-4 text-exchange-text-secondary font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyReturns.map((return_, index) => (
                    <tr key={index} className="border-b border-exchange-border/30">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-exchange-text-secondary" />
                          <span className="text-exchange-text-primary">{return_.date}</span>
                        </div>
                      </td>
                      <td className="p-4 text-exchange-text-primary">{return_.plan}</td>
                      <td className="p-4 text-right">
                        <span className="text-exchange-green font-semibold">{return_.amount}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-3 py-1 bg-exchange-green/20 text-exchange-green rounded-full text-sm font-semibold">
                          Paid
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

export default GoldMiningPage;
