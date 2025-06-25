
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Header from '../components/Header';
import MarketTicker from '../components/MarketTicker';
import LandingHero from '../components/LandingHero';
import TradingFeatures from '../components/TradingFeatures';
import SecuritySection from '../components/SecuritySection';
import GoldMiningSection from '../components/GoldMiningSection';
import TradingInterface from '../components/TradingInterface';
import MarketsOverview from '../components/MarketsOverview';
import ContactForm from '../components/ContactForm';
import MecBot from '../components/MecBot';

const Index = () => {
  const [activeView, setActiveView] = useState<'markets' | 'trading'>('markets');
  const { user } = useAuth();

  console.log('Index page render - user:', !!user, 'activeView:', activeView);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <Header />
      <MarketTicker />
      
      {/* Landing Hero Section */}
      <LandingHero />
      
      {/* Trading Features Section */}
      <TradingFeatures />
      
      {/* Security Section */}
      <SecuritySection />
      
      {/* Gold Mining Section */}
      <GoldMiningSection />
      
      {/* Contact Form Section */}
      <section className="py-6 sm:py-8 lg:py-16 bg-gray-50 contact-form-section w-full overflow-x-hidden">
        <div className="container-responsive max-w-6xl">
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight px-2">
              Contact <span className="text-red-600">MexcCrypto</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-3">
              Have questions about trading, need technical support, or want to learn more about our platform? 
              We're here to help you succeed in your crypto journey.
            </p>
          </div>
          <div className="max-w-2xl mx-auto px-2 sm:px-0">
            <ContactForm />
          </div>
        </div>
      </section>
      
      {/* Navigation Tabs - Only show trading interface if authenticated */}
      <div className="border-b border-gray-200 bg-white w-full overflow-x-hidden">
        <div className="container-responsive max-w-6xl">
          <nav className="flex space-x-2 sm:space-x-4 lg:space-x-6 overflow-x-auto pb-0">
            <button
              onClick={() => setActiveView('markets')}
              className={`py-2 sm:py-3 lg:py-4 px-2 sm:px-3 lg:px-4 border-b-2 font-semibold text-xs sm:text-sm lg:text-base transition-colors whitespace-nowrap ${
                activeView === 'markets'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Markets Overview
            </button>
            {user && (
              <button
                onClick={() => setActiveView('trading')}
                className={`py-2 sm:py-3 lg:py-4 px-2 sm:px-3 lg:px-4 border-b-2 font-semibold text-xs sm:text-sm lg:text-base transition-colors whitespace-nowrap ${
                  activeView === 'trading'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
                >
                Spot Trading
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in w-full overflow-x-hidden">
        {activeView === 'markets' && <MarketsOverview />}
        {activeView === 'trading' && user && <TradingInterface />}
        {activeView === 'trading' && !user && (
          <div className="container-responsive max-w-6xl py-6 sm:py-8 lg:py-10 text-center">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 lg:p-10 shadow-sm max-w-2xl mx-auto">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                Authentication Required
              </h3>
              <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
                Please sign in to access the trading interface and start trading.
              </p>
              <Link to="/auth">
                <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
                  Sign In to Trade
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-6 sm:mt-8 lg:mt-12 w-full overflow-x-hidden">
        <div className="container-responsive max-w-6xl py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3 sm:mb-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-red-600 to-red-700 rounded"></div>
                <span className="text-base sm:text-lg font-bold text-white">MexcCrypto</span>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                The world's leading cryptocurrency exchange platform with advanced trading features.
              </p>
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Products</h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                <li><Link to="/exchange" className="hover:text-white transition-colors">Exchange</Link></li>
                {user ? (
                  <>
                    <li><Link to="/contracts" className="hover:text-white transition-colors">Contracts Trading</Link></li>
                    <li><Link to="/gold-mining" className="hover:text-white transition-colors">Gold Mining</Link></li>
                    <li><Link to="/launchpad" className="hover:text-white transition-colors">Launchpad</Link></li>
                  </>
                ) : (
                  <>
                    <li><span className="text-gray-500">Contracts Trading</span></li>
                    <li><span className="text-gray-500">Gold Mining</span></li>
                    <li><span className="text-gray-500">Launchpad</span></li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Security</h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                <li className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                  <span>2FA Authentication</span>
                </li>
                <li className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                  <span>Cold Wallet Storage</span>
                </li>
                <li className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                  <span>SSL Encryption</span>
                </li>
              </ul>
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Account</h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                {user ? (
                  <>
                    <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                    <li><Link to="/my-assets" className="hover:text-white transition-colors">My Assets</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/auth" className="hover:text-white transition-colors">Sign In</Link></li>
                    <li><Link to="/auth" className="hover:text-white transition-colors">Create Account</Link></li>
                  </>
                )}
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-4 sm:pt-6 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <div className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
              © 2024 MexcCrypto. All rights reserved.
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse-green"></div>
                <span>99.9% Uptime</span>
              </div>
              <div className="text-xs text-gray-400">
                SOC 2 Certified
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* MecBot Integration */}
      <MecBot />
    </div>
  );
};

export default Index;

