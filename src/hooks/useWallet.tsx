
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
  const { user, userRole } = useAuth();
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
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching balances:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching balances:', error);
      return [];
    }
  };

  const initializeBalances = async () => {
    if (!user || !userRole) {
      setLoading(false);
      return;
    }

    // Skip wallet initialization for superadmin
    if (userRole === 'superadmin') {
      console.log('Skipping wallet initialization for superadmin');
      setBalances(createDefaultBalances());
      setLoading(false);
      return;
    }

    try {
      const dbBalances = await fetchBalancesFromDB();
      console.log('Database balances for user:', user.id, dbBalances);
      
      if (dbBalances.length === 0) {
        // No balances exist, create them with zero values using the RPC function
        console.log('Creating default balances for regular user');
        
        // Use the secure RPC function to create balances
        for (const currency of DEFAULT_CURRENCIES) {
          try {
            await supabase.rpc('update_wallet_balance', {
              p_user_id: user.id,
              p_currency: currency,
              p_amount: 0,
              p_operation: 'add'
            });
          } catch (rpcError) {
            console.log('RPC error for currency', currency, ':', rpcError);
            // Continue with other currencies even if one fails
          }
        }

        // Fetch the created balances
        const newDbBalances = await fetchBalancesFromDB();
        const updatedBalances = DEFAULT_CURRENCIES.map(currency => {
          const dbBalance = newDbBalances.find(db => db.currency === currency);
          if (dbBalance) {
            return {
              currency: dbBalance.currency,
              available: Number(dbBalance.available_balance) || 0,
              locked: Number(dbBalance.locked_balance) || 0,
              total: Number(dbBalance.total_balance) || 0,
            };
          }
          return {
            currency,
            available: 0,
            locked: 0,
            total: 0,
          };
        });
        setBalances(updatedBalances);
      } else {
        // Use existing balances from database
        const updatedBalances = DEFAULT_CURRENCIES.map(currency => {
          const dbBalance = dbBalances.find(db => db.currency === currency);
          if (dbBalance) {
            return {
              currency: dbBalance.currency,
              available: Number(dbBalance.available_balance) || 0,
              locked: Number(dbBalance.locked_balance) || 0,
              total: Number(dbBalance.total_balance) || 0,
            };
          }
          return {
            currency,
            available: 0,
            locked: 0,
            total: 0,
          };
        });
        console.log('Updated balances from DB:', updatedBalances);
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
    if (!user || userRole === 'superadmin') return;

    try {
      const dbBalances = await fetchBalancesFromDB();
      const updatedBalances = DEFAULT_CURRENCIES.map(currency => {
        const dbBalance = dbBalances.find(db => db.currency === currency);
        if (dbBalance) {
          return {
            currency: dbBalance.currency,
            available: Number(dbBalance.available_balance) || 0,
            locked: Number(dbBalance.locked_balance) || 0,
            total: Number(dbBalance.total_balance) || 0,
          };
        }
        return {
          currency,
          available: 0,
          locked: 0,
          total: 0,
        };
      });
      setBalances(updatedBalances);
    } catch (error) {
      console.error('Error refreshing balances:', error);
    }
  };

  const depositFunds = async (currency: string, amount: number): Promise<boolean> => {
    if (!user || amount <= 0 || userRole === 'superadmin') return false;

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
    if (!user || userRole === 'superadmin') return false;

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

  // Set up real-time subscriptions only for regular users
  useEffect(() => {
    if (!user || userRole === 'superadmin') return;

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
  }, [user, userRole]);

  useEffect(() => {
    if (user && userRole !== null) {
      initializeBalances();
    } else {
      setBalances([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [user, userRole]);

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
