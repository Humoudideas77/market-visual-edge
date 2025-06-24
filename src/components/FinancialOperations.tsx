
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, CreditCard, Shield } from 'lucide-react';
import DepositForm from './DepositForm';
import WithdrawalForm from './WithdrawalForm';
import KYCSection from './KYCSection';

const FinancialOperations = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-exchange-card-bg border-exchange-border">
        <CardHeader>
          <CardTitle className="text-exchange-text-primary">
            Financial Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-exchange-bg">
              <TabsTrigger value="deposit" className="data-[state=active]:bg-exchange-accent">
                <DollarSign className="w-4 h-4 mr-2" />
                Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="data-[state=active]:bg-exchange-accent">
                <CreditCard className="w-4 h-4 mr-2" />
                Withdraw
              </TabsTrigger>
              <TabsTrigger value="kyc" className="data-[state=active]:bg-exchange-accent">
                <Shield className="w-4 h-4 mr-2" />
                KYC
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="deposit" className="mt-6">
              <DepositForm />
            </TabsContent>
            
            <TabsContent value="withdraw" className="mt-6">
              <WithdrawalForm />
            </TabsContent>
            
            <TabsContent value="kyc" className="mt-6">
              <KYCSection />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialOperations;
