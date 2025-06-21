
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '../components/Header';
import MarketTicker from '../components/MarketTicker';
import TradingInterface from '../components/TradingInterface';
import MarketsOverview from '../components/MarketsOverview';

const Index = () => {
  const [activeView, setActiveView] = useState<'markets' | 'trading'>('markets');

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      <MarketTicker />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-exchange-blue/10 to-exchange-green/10 border-b border-exchange-border">
        <div className="px-6 py-12 text-center">
          <h1 className="text-4xl font-bold text-exchange-text-primary mb-4">
            Professional Cryptocurrency Trading Platform
          </h1>
          <p className="text-xl text-exchange-text-secondary mb-8 max-w-2xl mx-auto">
            Trade Bitcoin, Ethereum and 1000+ cryptocurrencies with advanced tools, 
            real-time market data, and bank-level security.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link to="/auth">
              <Button className="bg-exchange-blue hover:bg-exchange-blue/90 px-8 py-3 text-lg">
                Get Started
              </Button>
            </Link>
            <Link to="/trading">
              <Button variant="outline" className="px-8 py-3 text-lg border-exchange-border">
                Start Trading
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-exchange-border">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveView('markets')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeView === 'markets'
                  ? 'border-exchange-blue text-exchange-blue'
                  : 'border-transparent text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              Markets Overview
            </button>
            <button
              onClick={() => setActiveView('trading')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeView === 'trading'
                  ? 'border-exchange-blue text-exchange-blue'
                  : 'border-transparent text-exchange-text-secondary hover:text-exchange-text-primary'
              }`}
            >
              Spot Trading
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeView === 'markets' && <MarketsOverview />}
        {activeView === 'trading' && <TradingInterface />}
      </div>

      {/* Footer */}
      <footer className="bg-exchange-panel border-t border-exchange-border mt-12">
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-exchange-blue to-exchange-green rounded"></div>
                <span className="text-lg font-bold text-exchange-text-primary">MEXC Pro</span>
              </div>
              <p className="text-exchange-text-secondary text-sm">
                The world's leading cryptocurrency exchange platform with advanced trading features.
              </p>
            </div>
            
            <div>
              <h3 className="text-exchange-text-primary font-semibold mb-3">Products</h3>
              <ul className="space-y-2 text-sm text-exchange-text-secondary">
                <li><Link to="/trading" className="hover:text-exchange-blue">Spot Trading</Link></li>
                <li><a href="#" className="hover:text-exchange-blue">Futures Trading</a></li>
                <li><a href="#" className="hover:text-exchange-blue">Copy Trading</a></li>
                <li><a href="#" className="hover:text-exchange-blue">Launchpad</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-exchange-text-primary font-semibold mb-3">Security</h3>
              <ul className="space-y-2 text-sm text-exchange-text-secondary">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-exchange-green rounded-full"></div>
                  <span>2FA Authentication</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-exchange-green rounded-full"></div>
                  <span>Cold Wallet Storage</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-exchange-green rounded-full"></div>
                  <span>SSL Encryption</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-exchange-text-primary font-semibold mb-3">Account</h3>
              <ul className="space-y-2 text-sm text-exchange-text-secondary">
                <li><Link to="/auth" className="hover:text-exchange-blue">Sign In</Link></li>
                <li><Link to="/auth" className="hover:text-exchange-blue">Create Account</Link></li>
                <li><a href="#" className="hover:text-exchange-blue">Help Center</a></li>
                <li><a href="#" className="hover:text-exchange-blue">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-exchange-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-exchange-text-secondary text-sm">
              © 2024 MEXC Pro. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 text-xs text-exchange-text-secondary">
                <div className="w-3 h-3 bg-exchange-green rounded-full animate-pulse-green"></div>
                <span>99.9% Uptime</span>
              </div>
              <div className="text-xs text-exchange-text-secondary">
                SOC 2 Certified
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
