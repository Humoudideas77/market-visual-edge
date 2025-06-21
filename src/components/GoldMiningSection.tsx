
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pickaxe, TrendingUp, Users, DollarSign } from 'lucide-react';

const GoldMiningSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Pickaxe className="w-6 h-6 text-yellow-500" />
                </div>
                <h2 className="text-4xl font-bold text-exchange-text-primary">
                  Gold Mining Program
                </h2>
              </div>
              <p className="text-xl text-exchange-text-secondary">
                Invest in our revolutionary gold mining operation and earn daily returns through 
                our MLM-structured mining shares program with referral bonuses.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-exchange-panel rounded-xl p-6 border border-yellow-500/20">
                <div className="flex items-center space-x-3 mb-3">
                  <TrendingUp className="w-8 h-8 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-exchange-text-primary">12%</div>
                    <div className="text-sm text-exchange-text-secondary">Annual ROI</div>
                  </div>
                </div>
              </div>

              <div className="bg-exchange-panel rounded-xl p-6 border border-orange-500/20">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="w-8 h-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold text-exchange-text-primary">5%</div>
                    <div className="text-sm text-exchange-text-secondary">Referral Bonus</div>
                  </div>
                </div>
              </div>

              <div className="bg-exchange-panel rounded-xl p-6 border border-green-500/20">
                <div className="flex items-center space-x-3 mb-3">
                  <DollarSign className="w-8 h-8 text-exchange-green" />
                  <div>
                    <div className="text-2xl font-bold text-exchange-text-primary">$100</div>
                    <div className="text-sm text-exchange-text-secondary">Min Investment</div>
                  </div>
                </div>
              </div>

              <div className="bg-exchange-panel rounded-xl p-6 border border-blue-500/20">
                <div className="flex items-center space-x-3 mb-3">
                  <Pickaxe className="w-8 h-8 text-exchange-blue" />
                  <div>
                    <div className="text-2xl font-bold text-exchange-text-primary">Daily</div>
                    <div className="text-sm text-exchange-text-secondary">Payouts</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-exchange-panel rounded-xl p-6 border border-exchange-border">
                <h3 className="text-lg font-semibold text-exchange-text-primary mb-4">How It Works</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <span className="text-exchange-text-secondary">Purchase mining shares starting from $100</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <span className="text-exchange-text-secondary">Earn daily returns from gold mining operations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                    <span className="text-exchange-text-secondary">Refer friends and earn 5% commission on their investments</span>
                  </div>
                </div>
              </div>

              <Link to="/gold-mining">
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 text-lg font-semibold w-full">
                  Start Mining Gold Today
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-exchange-panel rounded-2xl p-8 border border-yellow-500/20">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-exchange-text-primary mb-4">Live Mining Stats</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-exchange-accent rounded-lg">
                    <div>
                      <div className="text-sm text-exchange-text-secondary">Total Gold Mined</div>
                      <div className="text-lg font-bold text-yellow-500">1,247.8 oz</div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Pickaxe className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-exchange-accent rounded-lg">
                    <div>
                      <div className="text-sm text-exchange-text-secondary">Active Miners</div>
                      <div className="text-lg font-bold text-exchange-text-primary">15,429</div>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-exchange-blue" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-exchange-accent rounded-lg">
                    <div>
                      <div className="text-sm text-exchange-text-secondary">Daily Payouts</div>
                      <div className="text-lg font-bold text-exchange-green">$247,891</div>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-exchange-green" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
                  <div className="text-center">
                    <div className="text-sm text-exchange-text-secondary mb-2">Next Payout In</div>
                    <div className="text-2xl font-bold text-yellow-500">04:23:17</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoldMiningSection;
