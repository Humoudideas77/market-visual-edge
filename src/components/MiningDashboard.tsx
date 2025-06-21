
import React from 'react';
import { useMiningInvestments } from '@/hooks/useMiningInvestments';
import CountdownTimer from './CountdownTimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pickaxe, TrendingUp, DollarSign, Calendar, RefreshCw } from 'lucide-react';

const MiningDashboard = () => {
  const { investments, payouts, loading, getTotalEarnings, processPayouts, refreshData } = useMiningInvestments();

  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investment_amount, 0);
  const totalEarnings = getTotalEarnings();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 flex items-center text-base">
              <Pickaxe className="w-4 h-4 mr-2 text-red-600" />
              Active Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {activeInvestments.length}
            </div>
            <div className="text-sm text-gray-600">
              Total Invested: ${totalInvested.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 flex items-center text-base">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-1">
              ${totalEarnings.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              All time earnings
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 flex items-center text-base">
              <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
              Daily Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              ${activeInvestments.reduce((sum, inv) => sum + (inv.investment_amount * inv.daily_return_rate / 100), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              Expected daily return
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 flex items-center">
                <Pickaxe className="w-5 h-5 mr-2 text-red-600" />
                Active Mining Operations
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  processPayouts();
                  refreshData();
                }}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeInvestments.map((investment) => (
                <div key={investment.id} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Plan</div>
                      <div className="font-semibold text-gray-900">{investment.plan_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Investment</div>
                      <div className="font-semibold text-gray-900">${investment.investment_amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Daily Return</div>
                      <div className="font-semibold text-green-600">
                        ${((investment.investment_amount * investment.daily_return_rate) / 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Next Payout</div>
                      <CountdownTimer
                        targetDate={new Date(investment.next_payout_date)}
                        onComplete={() => {
                          processPayouts();
                          refreshData();
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Days Active: {Math.floor((new Date().getTime() - new Date(investment.start_date).getTime()) / (1000 * 60 * 60 * 24))} / {investment.maturity_days}
                      </span>
                      <span className="font-semibold text-green-600">
                        Earned: ${investment.total_earned.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payouts */}
      {payouts.length > 0 && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Recent Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 text-gray-700 font-medium text-sm">Date</th>
                    <th className="text-left p-3 text-gray-700 font-medium text-sm">Amount</th>
                    <th className="text-center p-3 text-gray-700 font-medium text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.slice(0, 10).map((payout) => (
                    <tr key={payout.id} className="border-b border-gray-100">
                      <td className="p-3 text-gray-900 text-sm">
                        {new Date(payout.payout_date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="text-green-600 font-semibold">
                          +${payout.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                          {payout.status}
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

      {/* No Active Investments Message */}
      {activeInvestments.length === 0 && (
        <Card className="bg-gray-50 border border-gray-200">
          <CardContent className="text-center py-8">
            <Pickaxe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Mining Operations</h3>
            <p className="text-gray-600 mb-4">Start your first mining investment to begin earning daily returns.</p>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Browse Mining Plans
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MiningDashboard;
