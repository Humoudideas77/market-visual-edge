
import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface WalletBalance {
  currency: string;
  available: number;
  locked: number;
  total: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell';
  currency: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  reference?: string;
}

interface WalletContextType {
  balances: WalletBalance[];
  transactions: Transaction[];
  loading: boolean;
  depositFunds: (currency: string, amount: number) => Promise<boolean>;
  getBalance: (currency: string) => WalletBalance | null;
  executeTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => Promise<boolean>;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize balances from database
  const initializeBalances = async () => {
    if (!user) return;

    const defaultBalances: WalletBalance[] = [
      { currency: 'USDT', available: 0, locked: 0, total: 0 },
      { currency: 'BTC', available: 0, locked: 0, total: 0 },
      { currency: 'ETH', available: 0, locked: 0, total: 0 },
      { currency: 'BNB', available: 0, locked: 0, total: 0 },
      { currency: 'SOL', available: 0, locked: 0, total: 0 },
      { currency: 'XRP', available: 0, locked: 0, total: 0 },
      { currency: 'LTC', available: 0, locked: 0, total: 0 },
      { currency: 'BCH', available: 0, locked: 0, total: 0 },
      { currency: 'ADA', available: 0, locked: 0, total: 0 },
      { currency: 'DOT', available: 0, locked: 0, total: 0 },
      { currency: 'LINK', available: 0, locked: 0, total: 0 },
      { currency: 'DOGE', available: 0, locked: 0, total: 0 },
      { currency: 'AVAX', available: 0, locked: 0, total: 0 },
    ];
    
    try {
      // Fetch wallet balances from database using any type to bypass TypeScript issues
      const { data: walletBalances } = await (supabase as any)
        .from('wallet_balances')
        .select('*')
        .eq('user_id', user.id);

      if (walletBalances && walletBalances.length > 0) {
        // Update default balances with database values
        const updatedBalances = defaultBalances.map(defaultBalance => {
          const dbBalance = walletBalances.find((wb: any) => wb.currency === defaultBalance.currency);
          if (dbBalance) {
            return {
              currency: dbBalance.currency,
              available: Number(dbBalance.available_balance),
              locked: Number(dbBalance.locked_balance),
              total: Number(dbBalance.total_balance),
            };
          }
          return defaultBalance;
        });
        setBalances(updatedBalances);
      } else {
        // Initialize with USDT starter balance if no records exist
        const starterBalance = [...defaultBalances];
        starterBalance[0] = { currency: 'USDT', available: 10000, locked: 0, total: 10000 };
        
        // Insert starter balances into database
        await (supabase as any).from('wallet_balances').insert(
          starterBalance.map(balance => ({
            user_id: user.id,
            currency: balance.currency,
            available_balance: balance.available,
            locked_balance: balance.locked,
            total_balance: balance.total,
          }))
        );
        
        setBalances(starterBalance);
      }
    } catch (error) {
      console.error('Error initializing balances:', error);
      setBalances(defaultBalances);
    }
    
    setLoading(false);
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to wallet balance changes
    const walletChannel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_balances',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Wallet balance changed:', payload);
          refreshBalances();
        }
      )
      .subscribe();

    // Subscribe to deposit approvals
    const depositChannel = supabase
      .channel('deposit-approvals')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deposit_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Deposit status changed:', payload);
          if (payload.new.status === 'approved') {
            refreshBalances();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(depositChannel);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      initializeBalances();
    }
  }, [user]);

  const refreshBalances = async () => {
    if (!user) return;

    try {
      const { data: walletBalances } = await (supabase as any)
        .from('wallet_balances')
        .select('*')
        .eq('user_id', user.id);

      if (walletBalances) {
        const updatedBalances = balances.map(balance => {
          const dbBalance = walletBalances.find((wb: any) => wb.currency === balance.currency);
          if (dbBalance) {
            return {
              currency: dbBalance.currency,
              available: Number(dbBalance.available_balance),
              locked: Number(dbBalance.locked_balance),
              total: Number(dbBalance.total_balance),
            };
          }
          return balance;
        });
        setBalances(updatedBalances);
      }
    } catch (error) {
      console.error('Error refreshing balances:', error);
    }
  };

  const depositFunds = async (currency: string, amount: number): Promise<boolean> => {
    if (!user || amount <= 0) return false;

    const transaction: Transaction = {
      id: `dep_${Date.now()}`,
      type: 'deposit',
      currency,
      amount,
      status: 'pending',
      timestamp: new Date(),
    };

    try {
      // This is for demo/test deposits only - real deposits go through the EnhancedDepositModal
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update database using RPC call
      await (supabase as any).rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_currency: currency,
        p_amount: amount,
        p_operation: 'add'
      });

      await refreshBalances();
      saveTransaction({ ...transaction, status: 'completed' });
      return true;
    } catch (error) {
      console.error('Deposit error:', error);
      saveTransaction({ ...transaction, status: 'failed' });
      return false;
    }
  };

  const saveTransaction = (transaction: Transaction) => {
    if (user) {
      const newTransactions = [transaction, ...transactions].slice(0, 100);
      setTransactions(newTransactions);
      localStorage.setItem(`wallet_transactions_${user.id}`, JSON.stringify(newTransactions));
    }
  };

  const getBalance = (currency: string): WalletBalance | null => {
    return balances.find(balance => balance.currency === currency) || null;
  };

  const executeTransaction = async (transactionData: Omit<Transaction, 'id' | 'timestamp' | 'status'>): Promise<boolean> => {
    if (!user) return false;

    const transaction: Transaction = {
      ...transactionData,
      id: `txn_${Date.now()}`,
      status: 'pending',
      timestamp: new Date(),
    };

    try {
      const operation = transactionData.type === 'trade_sell' ? 'subtract' : 'add';
      
      await (supabase as any).rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_currency: transactionData.currency,
        p_amount: transactionData.amount,
        p_operation: operation
      });

      await refreshBalances();
      saveTransaction({ ...transaction, status: 'completed' });
      return true;
    } catch (error) {
      console.error('Transaction error:', error);
      saveTransaction({ ...transaction, status: 'failed' });
      return false;
    }
  };

  return (
    <WalletContext.Provider value={{
      balances,
      transactions,
      loading,
      depositFunds,
      getBalance,
      executeTransaction,
      refreshBalances,
    }}>
      {children}
    </WalletContext.Provider>
  );
};
