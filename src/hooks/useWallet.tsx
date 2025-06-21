
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

  // Initialize default balances
  useEffect(() => {
    if (user) {
      const defaultBalances: WalletBalance[] = [
        { currency: 'USDT', available: 10000, locked: 0, total: 10000 },
        { currency: 'BTC', available: 0, locked: 0, total: 0 },
        { currency: 'ETH', available: 0, locked: 0, total: 0 },
        { currency: 'BNB', available: 0, locked: 0, total: 0 },
      ];
      
      const savedBalances = localStorage.getItem(`wallet_balances_${user.id}`);
      if (savedBalances) {
        setBalances(JSON.parse(savedBalances));
      } else {
        setBalances(defaultBalances);
        localStorage.setItem(`wallet_balances_${user.id}`, JSON.stringify(defaultBalances));
      }
      
      const savedTransactions = localStorage.getItem(`wallet_transactions_${user.id}`);
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        })));
      }
      
      setLoading(false);
    }
  }, [user]);

  const saveBalances = (newBalances: WalletBalance[]) => {
    if (user) {
      setBalances(newBalances);
      localStorage.setItem(`wallet_balances_${user.id}`, JSON.stringify(newBalances));
    }
  };

  const saveTransaction = (transaction: Transaction) => {
    if (user) {
      const newTransactions = [transaction, ...transactions].slice(0, 100);
      setTransactions(newTransactions);
      localStorage.setItem(`wallet_transactions_${user.id}`, JSON.stringify(newTransactions));
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
      // Simulate deposit processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBalances = balances.map(balance => {
        if (balance.currency === currency) {
          return {
            ...balance,
            available: balance.available + amount,
            total: balance.total + amount,
          };
        }
        return balance;
      });

      // Add new currency if it doesn't exist
      if (!newBalances.find(b => b.currency === currency)) {
        newBalances.push({
          currency,
          available: amount,
          locked: 0,
          total: amount,
        });
      }

      saveBalances(newBalances);
      saveTransaction({ ...transaction, status: 'completed' });
      return true;
    } catch (error) {
      saveTransaction({ ...transaction, status: 'failed' });
      return false;
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
      const newBalances = [...balances];
      const balanceIndex = newBalances.findIndex(b => b.currency === transactionData.currency);
      
      if (balanceIndex === -1) return false;

      if (transactionData.type === 'trade_sell') {
        // Check if we have enough balance
        if (newBalances[balanceIndex].available < transactionData.amount) {
          return false;
        }
        newBalances[balanceIndex].available -= transactionData.amount;
        newBalances[balanceIndex].total -= transactionData.amount;
      } else if (transactionData.type === 'trade_buy') {
        newBalances[balanceIndex].available += transactionData.amount;
        newBalances[balanceIndex].total += transactionData.amount;
      }

      saveBalances(newBalances);
      saveTransaction({ ...transaction, status: 'completed' });
      return true;
    } catch (error) {
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
    }}>
      {children}
    </WalletContext.Provider>
  );
};
