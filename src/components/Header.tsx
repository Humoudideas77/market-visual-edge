
import React from 'react';
import { Bell, Settings, User, ChevronDown, Globe } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-exchange-panel border-b border-exchange-border px-6 py-4 flex items-center justify-between">
      {/* Logo and Main Navigation */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-exchange-blue to-exchange-green rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MX</span>
          </div>
          <span className="text-xl font-bold text-exchange-text-primary">MEXC Pro</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="/" className="text-exchange-text-primary hover:text-exchange-blue transition-colors">Markets</a>
          <a href="/trading" className="text-exchange-text-primary hover:text-exchange-blue transition-colors">Trade</a>
          <a href="/futures" className="text-exchange-text-secondary hover:text-exchange-blue transition-colors">Futures</a>
          <a href="/copy-trading" className="text-exchange-text-secondary hover:text-exchange-blue transition-colors">Copy Trading</a>
          <a href="/launchpad" className="text-exchange-text-secondary hover:text-exchange-blue transition-colors">Launchpad</a>
          <a href="/earn" className="text-exchange-text-secondary hover:text-exchange-blue transition-colors">Earn</a>
        </nav>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center space-x-4">
        {/* Language Selector */}
        <div className="flex items-center space-x-1 text-exchange-text-secondary hover:text-exchange-text-primary cursor-pointer">
          <Globe className="w-4 h-4" />
          <span className="text-sm">EN</span>
          <ChevronDown className="w-3 h-3" />
        </div>

        {/* Notifications */}
        <div className="relative">
          <Bell className="w-5 h-5 text-exchange-text-secondary hover:text-exchange-text-primary cursor-pointer" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-exchange-red rounded-full"></div>
        </div>

        {/* Settings */}
        <Settings className="w-5 h-5 text-exchange-text-secondary hover:text-exchange-text-primary cursor-pointer" />

        {/* User Profile */}
        <div className="flex items-center space-x-2 bg-exchange-accent px-3 py-2 rounded-lg cursor-pointer hover:bg-exchange-accent/80">
          <User className="w-4 h-4 text-exchange-text-primary" />
          <span className="text-sm text-exchange-text-primary">Profile</span>
          <ChevronDown className="w-3 h-3 text-exchange-text-secondary" />
        </div>

        {/* Login/Register Buttons */}
        <div className="hidden lg:flex items-center space-x-2">
          <button className="px-4 py-2 text-exchange-text-primary border border-exchange-border rounded-md hover:bg-exchange-accent transition-colors">
            Log In
          </button>
          <button className="px-4 py-2 bg-exchange-blue text-white rounded-md hover:bg-exchange-blue/90 transition-colors">
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
