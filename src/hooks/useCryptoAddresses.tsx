
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CryptoAddress {
  id: string;
  currency: string;
  network: string;
  wallet_address: string;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const useCryptoAddresses = (activeOnly: boolean = true) => {
  const [addresses, setAddresses] = useState<CryptoAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('crypto_addresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching crypto addresses:', fetchError);
        setError(fetchError.message);
        toast.error('Failed to load deposit addresses');
        return;
      }

      console.log('Fetched crypto addresses:', data);
      setAddresses(data || []);
    } catch (error) {
      console.error('Error in fetchAddresses:', error);
      setError('Failed to load deposit addresses');
      toast.error('Failed to load deposit addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();

    // Set up real-time subscription for crypto addresses
    const channel = supabase
      .channel('crypto-addresses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_addresses'
        },
        () => {
          console.log('Crypto addresses changed, refetching...');
          fetchAddresses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOnly]);

  return {
    addresses,
    loading,
    error,
    refetch: fetchAddresses
  };
};
