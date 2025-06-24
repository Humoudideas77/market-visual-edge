
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import MarketTicker from '../components/MarketTicker';
import TradingInterface from '../components/TradingInterface';
import { SUPPORTED_PAIRS } from '@/hooks/useCryptoPrices';

const TradingPage = () => {
  const { baseAsset, quoteAsset } = useParams();
  
  console.log('TradingPage - URL parameters:', { baseAsset, quoteAsset });

  // Construct pair from URL parameters or use default
  let validPair = 'BTC/USDT';
  
  if (baseAsset && quoteAsset) {
    const constructedPair = `${baseAsset.toUpperCase()}/${quoteAsset.toUpperCase()}`;
    if (SUPPORTED_PAIRS.includes(constructedPair)) {
      validPair = constructedPair;
    }
  }
  
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
