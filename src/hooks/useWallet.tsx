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

const DEFAULT_CURRENCIES = [
  'USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'DOGE', 'AVAX'
];

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

  const createDefaultBalances = (): WalletBalance[] => {
    return DEFAULT_CURRENCIES.map(currency => ({
      currency,
      available: 0, // Changed from 10000 to 0 for all currencies
      locked: 0,
      total: 0, // Changed from 10000 to 0 for all currencies
    }));
  };

  const fetchBalancesFromDB = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching balances:', error);
      return [];
    }
  };

  const initializeBalances = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const dbBalances = await fetchBalancesFromDB();
      const defaultBalances = createDefaultBalances();

      if (dbBalances.length === 0) {
        // Initialize with default balances (all zeros now)
        const { error } = await supabase.from('wallet_balances').insert(
          defaultBalances.map(balance => ({
            user_id: user.id,
            currency: balance.currency,
            available_balance: balance.available,
            locked_balance: balance.locked,
            total_balance: balance.total,
          }))
        );

        if (error) throw error;
        setBalances(defaultBalances);
      } else {
        // Update balances with database values
        const updatedBalances = defaultBalances.map(defaultBalance => {
          const dbBalance = dbBalances.find(db => db.currency === defaultBalance.currency);
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
      }
    } catch (error) {
      console.error('Error initializing balances:', error);
      setBalances(createDefaultBalances());
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
    if (!user) return;

    try {
      const dbBalances = await fetchBalancesFromDB();
      const updatedBalances = balances.map(balance => {
        const dbBalance = dbBalances.find(db => db.currency === balance.currency);
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
    } catch (error) {
      console.error('Error refreshing balances:', error);
    }
  };

  const depositFunds = async (currency: string, amount: number): Promise<boolean> => {
    if (!user || amount <= 0) return false;

    try {
      await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_currency: currency,
        p_amount: amount,
        p_operation: 'add'
      });

      await refreshBalances();
      return true;
    } catch (error) {
      console.error('Deposit error:', error);
      return false;
    }
  };

  const executeTransaction = async (transactionData: Omit<Transaction, 'id' | 'timestamp' | 'status'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const operation = transactionData.type === 'trade_sell' ? 'subtract' : 'add';
      
      await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_currency: transactionData.currency,
        p_amount: transactionData.amount,
        p_operation: operation
      });

      await refreshBalances();
      return true;
    } catch (error) {
      console.error('Transaction error:', error);
      return false;
    }
  };

  const getBalance = (currency: string): WalletBalance | null => {
    return balances.find(balance => balance.currency === currency) || null;
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

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
        () => {
          console.log('Wallet balance changed, refreshing...');
          refreshBalances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      initializeBalances();
    } else {
      setBalances([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

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
