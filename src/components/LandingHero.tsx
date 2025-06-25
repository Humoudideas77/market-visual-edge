
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Shield, Users, Zap } from 'lucide-react';

const LandingHero = () => {
  return (
    <section className="bg-gradient-to-br from-exchange-bg via-exchange-panel to-exchange-accent w-full min-h-[80vh] flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-exchange-text-primary leading-tight">
                Advanced <span className="text-exchange-blue">Cryptocurrency</span>
                <br className="hidden sm:block" />
                Trading Platform
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-exchange-text-secondary leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Experience professional-grade trading with advanced charts, real-time market data, 
                secure custody, and innovative features like gold mining and contract trading.
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto lg:max-w-none lg:mx-0">
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-exchange-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-exchange-green" />
                </div>
                <span className="text-sm sm:text-base text-exchange-text-primary font-medium">Advanced Trading</span>
              </div>
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-exchange-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-exchange-blue" />
                </div>
                <span className="text-sm sm:text-base text-exchange-text-primary font-medium">Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-exchange-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-exchange-red" />
                </div>
                <span className="text-sm sm:text-base text-exchange-text-primary font-medium">Gold Mining MLM</span>
              </div>
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                </div>
                <span className="text-sm sm:text-base text-exchange-text-primary font-medium">Instant Execution</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button className="bg-exchange-blue hover:bg-exchange-blue/90 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold w-full sm:w-auto">
                  Start Trading Now
                </Button>
              </Link>
              <Link to="/exchange" className="w-full sm:w-auto">
                <Button variant="outline" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold border-exchange-border hover:bg-exchange-accent w-full sm:w-auto text-exchange-text-primary">
                  Explore Markets
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center lg:justify-start space-x-6 sm:space-x-8 pt-4">
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-exchange-text-primary">10M+</div>
                <div className="text-xs sm:text-sm text-exchange-text-secondary">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-exchange-text-primary">$50B+</div>
                <div className="text-xs sm:text-sm text-exchange-text-secondary">Trading Volume</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-exchange-text-primary">99.9%</div>
                <div className="text-xs sm:text-sm text-exchange-text-secondary">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative mt-8 lg:mt-0">
            <div className="bg-exchange-panel rounded-2xl p-4 sm:p-6 lg:p-8 border border-exchange-border backdrop-blur-sm">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-exchange-text-primary">Live Market Data</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-exchange-green rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm text-exchange-text-secondary">Live</span>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-exchange-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">₿</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-medium text-exchange-text-primary truncate">BTC/USDT</div>
                        <div className="text-xs sm:text-sm text-exchange-text-secondary truncate">Bitcoin</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-mono text-exchange-text-primary">$43,250.00</div>
                      <div className="text-xs sm:text-sm text-exchange-green">+2.98%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-exchange-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">Ξ</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-medium text-exchange-text-primary truncate">ETH/USDT</div>
                        <div className="text-xs sm:text-sm text-exchange-text-secondary truncate">Ethereum</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-mono text-exchange-text-primary">$2,650.50</div>
                      <div className="text-xs sm:text-sm text-exchange-green">+3.32%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-exchange-blue to-exchange-green rounded-2xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-exchange-green to-exchange-blue rounded-xl opacity-20 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
