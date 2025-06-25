
import React from 'react';
import { BarChart3, Lock, Globe, Smartphone, Zap, TrendingUp } from 'lucide-react';

const TradingFeatures = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Advanced Charting",
      description: "Professional trading tools with TradingView integration, technical indicators, and real-time market analysis.",
      color: "text-exchange-blue"
    },
    {
      icon: Lock,
      title: "Bank-Level Security",
      description: "Multi-layer security with cold storage, 2FA authentication, and SSL encryption to protect your assets.",
      color: "text-exchange-green"
    },
    {
      icon: Globe,
      title: "Global Markets",
      description: "Access to 1000+ cryptocurrencies and trading pairs with competitive fees and deep liquidity.",
      color: "text-exchange-red"
    },
    {
      icon: Smartphone,
      title: "Mobile Trading",
      description: "Trade on the go with our responsive web platform optimized for all devices and screen sizes.",
      color: "text-purple-500"
    },
    {
      icon: Zap,
      title: "Instant Execution",
      description: "Lightning-fast order execution with minimal slippage and real-time price feeds.",
      color: "text-yellow-500"
    },
    {
      icon: TrendingUp,
      title: "Copy Trading",
      description: "Follow and copy successful traders automatically to maximize your trading potential.",
      color: "text-orange-500"
    }
  ];

  return (
    <section className="py-20 bg-exchange-bg w-full">
      <div className="w-full px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-exchange-text-primary mb-4">
            Why Choose MEXC Pro?
          </h2>
          <p className="text-xl text-exchange-text-secondary max-w-3xl mx-auto">
            Experience the most advanced cryptocurrency trading platform with institutional-grade features 
            designed for both beginners and professional traders.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="bg-exchange-panel border border-exchange-border rounded-xl p-6 hover:border-exchange-blue/50 transition-all duration-300 group">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 rounded-lg bg-exchange-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-exchange-text-primary">{feature.title}</h3>
              </div>
              <p className="text-exchange-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TradingFeatures;
