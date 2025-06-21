
import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';
import { supabase } from '@/integrations/supabase/client';

interface MiningInvestment {
  id: string;
  user_id: string;
  plan_name: string;
  investment_amount: number;
  daily_return_rate: number;
  maturity_days: number;
  start_date: string;
  status: 'active' | 'completed' | 'cancelled';
  total_earned: number;
  last_payout_date: string | null;
  next_payout_date: string;
  created_at: string;
}

interface MiningPayout {
  id: string;
  investment_id: string;
  amount: number;
  payout_date: string;
  status: 'completed' | 'pending';
  created_at: string;
}

interface MiningContextType {
  investments: MiningInvestment[];
  payouts: MiningPayout[];
  loading: boolean;
  createInvestment: (planName: string, amount: number, dailyRate: number, maturityDays: number) => Promise<boolean>;
  processPayouts: () => Promise<void>;
  getNextPayoutTime: (investment: MiningInvestment) => Date;
  getTotalEarnings: () => number;
  refreshData: () => Promise<void>;
}

const MiningContext = createContext<MiningContextType | null>(null);

export const useMiningInvestments = () => {
  const context = useContext(MiningContext);
  if (!context) {
    throw new Error('useMiningInvestments must be used within a MiningProvider');
  }
  return context;
};

export const MiningProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { executeTransaction } = useWallet();
  const [investments, setInvestments] = useState<MiningInvestment[]>([]);
  const [payouts, setPayouts] = useState<MiningPayout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mining_investments' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments((data as MiningInvestment[]) || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };

  const fetchPayouts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mining_payouts' as any)
        .select(`
          *,
          mining_investments!inner(user_id)
        `)
        .eq('mining_investments.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts((data as MiningPayout[]) || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchInvestments(), fetchPayouts()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const createInvestment = async (planName: string, amount: number, dailyRate: number, maturityDays: number): Promise<boolean> => {
    if (!user) return false;

    try {
      // Deduct from wallet first
      const success = await executeTransaction({
        type: 'trade_sell',
        currency: 'USDT',
        amount: amount
      });

      if (!success) return false;

      const now = new Date();
      const nextPayout = new Date(now);
      nextPayout.setDate(nextPayout.getDate() + 1);

      const { error } = await supabase
        .from('mining_investments' as any)
        .insert({
          user_id: user.id,
          plan_name: planName,
          investment_amount: amount,
          daily_return_rate: dailyRate,
          maturity_days: maturityDays,
          start_date: now.toISOString(),
          next_payout_date: nextPayout.toISOString(),
          status: 'active'
        });

      if (error) throw error;

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error creating investment:', error);
      return false;
    }
  };

  const processPayouts = async () => {
    if (!user) return;

    const now = new Date();
    const activeInvestments = investments.filter(inv => 
      inv.status === 'active' && 
      new Date(inv.next_payout_date) <= now
    );

    for (const investment of activeInvestments) {
      try {
        const payoutAmount = (investment.investment_amount * investment.daily_return_rate) / 100;
        
        // Create payout record
        const { error: payoutError } = await supabase
          .from('mining_payouts' as any)
          .insert({
            investment_id: investment.id,
            amount: payoutAmount,
            payout_date: now.toISOString(),
            status: 'completed'
          });

        if (payoutError) throw payoutError;

        // Update investment
        const nextPayout = new Date(now);
        nextPayout.setDate(nextPayout.getDate() + 1);
        
        const startDate = new Date(investment.start_date);
        const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const newTotalEarned = investment.total_earned + payoutAmount;
        
        const updateData: any = {
          total_earned: newTotalEarned,
          last_payout_date: now.toISOString(),
          next_payout_date: nextPayout.toISOString()
        };

        // Check if investment should be completed
        if (daysPassed >= investment.maturity_days) {
          updateData.status = 'completed';
          // Return principal
          await executeTransaction({
            type: 'trade_buy',
            currency: 'USDT',
            amount: investment.investment_amount
          });
        }

        const { error: updateError } = await supabase
          .from('mining_investments' as any)
          .update(updateData)
          .eq('id', investment.id);

        if (updateError) throw updateError;

        // Add earnings to wallet
        await executeTransaction({
          type: 'trade_buy',
          currency: 'USDT',
          amount: payoutAmount
        });

      } catch (error) {
        console.error(`Error processing payout for investment ${investment.id}:`, error);
      }
    }

    await refreshData();
  };

  const getNextPayoutTime = (investment: MiningInvestment): Date => {
    return new Date(investment.next_payout_date);
  };

  const getTotalEarnings = (): number => {
    return investments.reduce((total, inv) => total + inv.total_earned, 0);
  };

  // Auto-process payouts every minute
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      processPayouts();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, investments]);

  return (
    <MiningContext.Provider value={{
      investments,
      payouts,
      loading,
      createInvestment,
      processPayouts,
      getNextPayoutTime,
      getTotalEarnings,
      refreshData
    }}>
      {children}
    </MiningContext.Provider>
  );
};
