
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import MarketTicker from '../components/MarketTicker';
import TradingInterface from '../components/TradingInterface';
import { SUPPORTED_PAIRS } from '@/hooks/useCryptoPrices';

const TradingPage = () => {
  const { pair } = useParams();
  
  console.log('TradingPage - URL pair parameter:', pair);

  // Validate and set default pair if needed
  const validPair = pair && SUPPORTED_PAIRS.includes(pair) ? pair : 'BTC/USDT';
  
  console.log('TradingPage - Using valid pair:', validPair);

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      <MarketTicker />
      <TradingInterface initialPair={validPair} />
    </div>
  );
};

export default TradingPage;
