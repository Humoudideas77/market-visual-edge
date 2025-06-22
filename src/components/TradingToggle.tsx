
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Lock } from 'lucide-react';
import { toast } from 'sonner';

const TradingToggle = () => {
  const { user } = useAuth();
  const [tradingEnabled, setTradingEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTradingStatus();
    }
  }, [user]);

  const fetchTradingStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('trading_enabled')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setTradingEnabled(data?.trading_enabled ?? true);
    } catch (error) {
      console.error('Error fetching trading status:', error);
    }
  };

  const toggleTrading = async (enabled: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ trading_enabled: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setTradingEnabled(enabled);
      toast.success(enabled ? 'Trading enabled' : 'Trading disabled');
    } catch (error) {
      console.error('Error updating trading status:', error);
      toast.error('Failed to update trading status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-exchange-card-bg border-exchange-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-exchange-text-primary flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5" />
          Trading Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-exchange-text-primary font-medium">
              Enable Trading
            </Label>
            <p className="text-sm text-exchange-text-secondary">
              Toggle your trading access on/off for security
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!tradingEnabled && <Lock className="w-4 h-4 text-red-400" />}
            <Switch
              checked={tradingEnabled}
              onCheckedChange={toggleTrading}
              disabled={loading}
              className="data-[state=checked]:bg-exchange-green"
            />
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-exchange-bg rounded-lg">
          <p className="text-xs text-exchange-text-secondary">
            {tradingEnabled 
              ? '🟢 Trading is currently enabled. You can place orders and execute trades.'
              : '🔴 Trading is currently disabled. Enable to start trading.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingToggle;
