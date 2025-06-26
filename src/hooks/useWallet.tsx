
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
      available: 0,
      locked: 0,
      total: 0,
    }));
  };

  const fetchBalancesFromDB = async () => {
    if (!user) return [];

    try {
      console.log('Fetching wallet balances for user:', user.id);
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching balances:', error);
        return [];
      }
      console.log('Fetched balances:', data);
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
      console.log('Initializing wallet balances for user:', user.id);
      const dbBalances = await fetchBalancesFromDB();
      const defaultBalances = createDefaultBalances();

      if (dbBalances.length === 0) {
        console.log('No existing balances found, creating default balances');
        // Try to initialize with zero balances for all currencies
        try {
          const { error } = await supabase.from('wallet_balances').insert(
            defaultBalances.map(balance => ({
              user_id: user.id,
              currency: balance.currency,
              available_balance: 0,
              locked_balance: 0,
              total_balance: 0,
            }))
          );

          if (error) {
            console.error('Error creating default balances:', error);
            // If we can't create balances in DB, use local state
            setBalances(defaultBalances);
          } else {
            console.log('Successfully created default balances');
            setBalances(defaultBalances);
          }
        } catch (insertError) {
          console.error('Failed to insert default balances:', insertError);
          setBalances(defaultBalances);
        }
      } else {
        console.log('Found existing balances, updating local state');
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
      // Fallback to default balances if everything fails
      setBalances(createDefaultBalances());
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
    if (!user) return;

    try {
      console.log('Refreshing wallet balances');
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
      console.log('Balances refreshed successfully');
    } catch (error) {
      console.error('Error refreshing balances:', error);
    }
  };

  const depositFunds = async (currency: string, amount: number): Promise<boolean> => {
    if (!user || amount <= 0) return false;

    try {
      console.log('Depositing funds:', { currency, amount, userId: user.id });
      
      // Try to use the database function
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_currency: currency,
        p_amount: amount,
        p_operation: 'add'
      });

      if (error) {
        console.error('Database deposit error, updating local state:', error);
        // Fallback to local state update
        setBalances(prev => prev.map(balance => 
          balance.currency === currency 
            ? {
                ...balance,
                available: balance.available + amount,
                total: balance.total + amount
              }
            : balance
        ));
      }

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
      
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_currency: transactionData.currency,
        p_amount: transactionData.amount,
        p_operation: operation
      });

      if (error) {
        console.error('Transaction error:', error);
        return false;
      }

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
