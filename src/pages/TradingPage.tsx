
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import MarketTicker from '../components/MarketTicker';
import TradingInterface from '../components/TradingInterface';

const TradingPage = () => {
  const { pair } = useParams();
  
  console.log('TradingPage - URL pair parameter:', pair);

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      <MarketTicker />
      <TradingInterface />
    </div>
  );
};

export default TradingPage;
