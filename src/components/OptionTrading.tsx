
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3 } from 'lucide-react';
import OptionTable from './OptionTable';
import PerpetualTradingView from './PerpetualTradingView';

interface OptionTradingProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}

const OptionTrading = ({ selectedPair, onPairChange }: OptionTradingProps) => {
  const [activeTab, setActiveTab] = useState('option-table');

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-exchange-blue" />
          <h2 className="text-2xl font-bold text-exchange-text-primary">Option Trading</h2>
          <div className="bg-exchange-blue/20 text-exchange-blue px-3 py-1 rounded text-sm font-medium">
            {selectedPair}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-exchange-accent/30">
          <TabsTrigger 
            value="option-table" 
            className="data-[state=active]:bg-exchange-blue data-[state=active]:text-white"
          >
            <Activity className="w-4 h-4 mr-2" />
            Option Table
          </TabsTrigger>
          <TabsTrigger 
            value="perpetual" 
            className="data-[state=active]:bg-exchange-blue data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Perpetual Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="option-table" className="mt-4">
          <OptionTable selectedPair={selectedPair} />
        </TabsContent>

        <TabsContent value="perpetual" className="mt-4">
          <PerpetualTradingView 
            selectedPair={selectedPair}
            onPairChange={onPairChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptionTrading;
