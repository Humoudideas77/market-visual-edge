
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pickaxe, TrendingUp, Users, DollarSign, Shield, Award } from 'lucide-react';

const GoldMiningSection = () => {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-6 sm:space-y-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Pickaxe className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Gold Mining Program
                </h2>
              </div>
              <p className="text-lg sm:text-xl text-gray-700">
                Invest in our revolutionary gold mining operation and earn guaranteed daily returns. 
                Start with just $200 and build your passive income stream with our secure mining plans.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl p-4 sm:p-6 border border-red-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">3.5%</div>
                    <div className="text-xs sm:text-sm text-gray-600">Max Daily ROI</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 border border-orange-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">15%</div>
                    <div className="text-xs sm:text-sm text-gray-600">Referral Bonus</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 border border-green-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">$200</div>
                    <div className="text-xs sm:text-sm text-gray-600">Min Investment</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 border border-blue-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">Secure</div>
                    <div className="text-xs sm:text-sm text-gray-600">Investment</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-red-600" />
                  Secure Investment Process
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <span className="text-gray-700">Deposit USDT funds into your secure wallet</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <span className="text-gray-700">Choose from 4 mining plans starting at $200</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                    <span className="text-gray-700">Activate plan and earn guaranteed daily returns</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                    <span className="text-gray-700">Track your ROI and earnings in real-time</span>
                  </div>
                </div>
              </div>

              <Link to="/gold-mining">
                <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold w-full">
                  Start Mining Gold Today
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-red-200 shadow-lg">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Live Mining Stats</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <div className="text-sm text-gray-600">Total Gold Mined</div>
                      <div className="text-lg font-bold text-red-600">2,847.3 oz</div>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Pickaxe className="w-6 h-6 text-red-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <div className="text-sm text-gray-600">Active Miners</div>
                      <div className="text-lg font-bold text-gray-900">18,429</div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <div className="text-sm text-gray-600">Daily Payouts</div>
                      <div className="text-lg font-bold text-green-600">$347,891</div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Next Payout In</div>
                    <div className="text-2xl font-bold text-red-600">02:47:23</div>
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
