
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, X, Clock, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { useRealtimeTrades } from '@/hooks/useRealtimeTrades';

interface TradeToClose {
  id: string;
  user_email: string;
  pair: string;
  side: string;
  size: number;
  pnl: number;
  margin: number;
  current_price: number;
}

const RealtimeTradesPanel = () => {
  const { activeTrades, isLoading, error, refetch } = useRealtimeTrades();
  const [selectedTrade, setSelectedTrade] = useState<TradeToClose | null>(null);
  const queryClient = useQueryClient();

  // Mutation to close a trade
  const closeTradesMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      const trade = activeTrades.find(t => t.id === tradeId);
      if (!trade) {
        throw new Error('Trade not found');
      }

      console.log('SuperAdmin closing trade:', tradeId);

      // Update position status
      const { error: updateError } = await supabase
        .from('perpetual_positions')
        .update({
          status: 'closed',
          exit_price: trade.current_price,
          closed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (updateError) {
        console.error('Error updating trade:', updateError);
        throw updateError;
      }

      // Record PnL
      const { error: pnlError } = await supabase.rpc('record_trade_pnl', {
        p_user_id: trade.user_id,
        p_trade_pair: trade.pair,
        p_trade_side: trade.side,
        p_entry_price: trade.entry_price,
        p_exit_price: trade.current_price || trade.entry_price,
        p_trade_size: trade.size,
        p_currency: 'USDT'
      });

      if (pnlError) {
        console.error('Error recording PnL:', pnlError);
      }

      // Return margin + PnL to user balance
      const totalReturn = trade.margin + (trade.pnl || 0);
      
      if (totalReturn > 0) {
        const { error: balanceError } = await supabase.rpc('update_wallet_balance', {
          p_user_id: trade.user_id,
          p_currency: 'USDT',
          p_amount: totalReturn,
          p_operation: 'add'
        });

        if (balanceError) {
          console.error('Error updating balance:', balanceError);
        }
      }

      return { tradeId, pnl: trade.pnl, userEmail: trade.user_email };
    },
    onSuccess: (data) => {
      toast.success(`✅ Trade closed by SuperAdmin! User: ${data.userEmail}, P&L: ${data.pnl && data.pnl >= 0 ? '+' : ''}$${data.pnl?.toFixed(2)} USDT`);
      queryClient.invalidateQueries({ queryKey: ['admin-active-trades'] });
      setSelectedTrade(null);
      refetch();
    },
    onError: (error) => {
      console.error('Close trade error:', error);
      toast.error(`Failed to close trade: ${error.message}`);
    },
  });

  const handleCloseTrade = (trade: any) => {
    setSelectedTrade({
      id: trade.id,
      user_email: trade.user_email,
      pair: trade.pair,
      side: trade.side,
      size: trade.size,
      pnl: trade.pnl || 0,
      margin: trade.margin,
      current_price: trade.current_price || trade.entry_price
    });
  };

  const confirmCloseTrade = () => {
    if (selectedTrade) {
      closeTradesMutation.mutate(selectedTrade.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading real-time trades...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Trades</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={refetch}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-6 h-6 text-red-600" />
              <span>Real-Time Active Trades</span>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                LIVE
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-white">
                {activeTrades.length} Active Positions
              </Badge>
              <Button
                onClick={refetch}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardContent className="p-0">
          {activeTrades.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>User</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Leverage</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Liquidation</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTrades.map((trade) => (
                    <TableRow key={trade.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-sm">
                          {trade.user_email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {trade.user_id.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {trade.pair}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={trade.side === 'long' ? 'default' : 'destructive'}
                          className="uppercase flex items-center space-x-1"
                        >
                          {trade.side === 'long' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{trade.side}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {trade.size.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono">
                        ${trade.entry_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono">
                        <div className={`${
                          (trade.current_price || 0) >= trade.entry_price ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${trade.current_price?.toFixed(2) || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        {trade.leverage}x
                      </TableCell>
                      <TableCell className="font-mono">
                        ${trade.margin.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className={`font-mono font-semibold ${
                          (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(trade.pnl || 0) >= 0 ? '+' : ''}${trade.pnl?.toFixed(2) || '0.00'}
                          <div className="text-xs">
                            ({(trade.pnl_percentage || 0) >= 0 ? '+' : ''}{trade.pnl_percentage?.toFixed(2) || '0.00'}%)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        ${trade.liquidation_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {Math.floor((Date.now() - new Date(trade.created_at).getTime()) / (1000 * 60))}m
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleCloseTrade(trade)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={closeTradesMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Close
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Trades</h3>
              <p className="text-gray-500">There are currently no active perpetual trades on the platform.</p>
              <Button 
                onClick={refetch}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Close User Trade</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>SuperAdmin Action:</strong> You are about to forcibly close this user's trade. This action cannot be undone and will immediately settle the position.
              {selectedTrade && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-2 border border-red-200">
                  <div><strong>User:</strong> {selectedTrade.user_email}</div>
                  <div><strong>Pair:</strong> {selectedTrade.pair}</div>
                  <div><strong>Side:</strong> {selectedTrade.side.toUpperCase()}</div>
                  <div><strong>Size:</strong> {selectedTrade.size.toFixed(4)}</div>
                  <div><strong>Current P&L:</strong> 
                    <span className={`ml-2 font-semibold ${
                      selectedTrade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="text-sm text-red-600 mt-2">
                    ⚠️ The user will be immediately settled and their position closed.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCloseTrade}
              disabled={closeTradesMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {closeTradesMutation.isPending ? 'Closing Trade...' : 'Force Close Trade'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RealtimeTradesPanel;
