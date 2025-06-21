
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Shield, Users, Zap } from 'lucide-react';

const LandingHero = () => {
  return (
    <section className="bg-gradient-to-br from-exchange-bg via-exchange-panel to-exchange-accent min-h-screen flex items-center">
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-exchange-text-primary leading-tight">
                Advanced <span className="text-exchange-blue">Cryptocurrency</span>
                <br />
                Trading Platform
              </h1>
              <p className="text-xl text-exchange-text-secondary leading-relaxed max-w-2xl">
                Experience professional-grade trading with advanced charts, real-time market data, 
                secure custody, and innovative features like gold mining and contract trading.
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-exchange-green/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-exchange-green" />
                </div>
                <span className="text-exchange-text-primary font-medium">Advanced Trading</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-exchange-blue/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-exchange-blue" />
                </div>
                <span className="text-exchange-text-primary font-medium">Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-exchange-red/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-exchange-red" />
                </div>
                <span className="text-exchange-text-primary font-medium">Gold Mining MLM</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <span className="text-exchange-text-primary font-medium">Instant Execution</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button className="bg-exchange-blue hover:bg-exchange-blue/90 px-8 py-4 text-lg font-semibold">
                  Start Trading Now
                </Button>
              </Link>
              <Link to="/exchange">
                <Button variant="outline" className="px-8 py-4 text-lg font-semibold border-exchange-border hover:bg-exchange-accent">
                  Explore Markets
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-exchange-text-primary">10M+</div>
                <div className="text-sm text-exchange-text-secondary">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-exchange-text-primary">$50B+</div>
                <div className="text-sm text-exchange-text-secondary">Trading Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-exchange-text-primary">99.9%</div>
                <div className="text-sm text-exchange-text-secondary">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            <div className="bg-exchange-panel rounded-2xl p-8 border border-exchange-border backdrop-blur-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-exchange-text-primary">Live Market Data</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-exchange-green rounded-full animate-pulse"></div>
                    <span className="text-sm text-exchange-text-secondary">Live</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-exchange-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">₿</span>
                      </div>
                      <div>
                        <div className="font-medium text-exchange-text-primary">BTC/USDT</div>
                        <div className="text-sm text-exchange-text-secondary">Bitcoin</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-exchange-text-primary">$43,250.00</div>
                      <div className="text-sm text-exchange-green">+2.98%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-exchange-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Ξ</span>
                      </div>
                      <div>
                        <div className="font-medium text-exchange-text-primary">ETH/USDT</div>
                        <div className="text-sm text-exchange-text-secondary">Ethereum</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-exchange-text-primary">$2,650.50</div>
                      <div className="text-sm text-exchange-green">+3.32%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-exchange-blue to-exchange-green rounded-2xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-exchange-green to-exchange-blue rounded-xl opacity-20 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
