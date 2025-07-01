
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, RefreshCw, Activity, AlertTriangle, DollarSign } from 'lucide-react';
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
  user_id: string;
}

interface ManualPnLDialog {
  trade: TradeToClose;
  isOpen: boolean;
}

const RealtimeTradesPanel = () => {
  const { activeTrades, isLoading, error, refetch } = useRealtimeTrades();
  const [selectedTrade, setSelectedTrade] = useState<TradeToClose | null>(null);
  const [manualPnLDialog, setManualPnLDialog] = useState<ManualPnLDialog>({ trade: null as any, isOpen: false });
  const [manualPnL, setManualPnL] = useState<string>('');
  const queryClient = useQueryClient();

  // Mutation to set fixed P&L for a trade without closing it
  const setFixedPnLMutation = useMutation({
    mutationFn: async ({ tradeId, fixedPnL }: { tradeId: string; fixedPnL: number }) => {
      const trade = activeTrades.find(t => t.id === tradeId);
      if (!trade) {
        throw new Error('Trade not found');
      }

      console.log('SuperAdmin setting fixed P&L for trade:', tradeId, fixedPnL);

      // Update position with fixed P&L
      const { error: updateError } = await supabase
        .from('perpetual_positions')
        .update({
          fixed_pnl: fixedPnL
        })
        .eq('id', tradeId);

      if (updateError) {
        console.error('Error setting fixed P&L:', updateError);
        throw updateError;
      }

      return { tradeId, fixedPnL, userEmail: trade.user_email };
    },
    onSuccess: (data) => {
      const pnlText = data.fixedPnL >= 0 ? `+$${data.fixedPnL.toFixed(2)}` : `-$${Math.abs(data.fixedPnL).toFixed(2)}`;
      toast.success(`✅ Fixed P&L set by SuperAdmin! User: ${data.userEmail}, Fixed P&L: ${pnlText} USDT`);
      queryClient.invalidateQueries({ queryKey: ['admin-active-trades'] });
      setManualPnLDialog({ trade: null as any, isOpen: false });
      setManualPnL('');
      refetch();
    },
    onError: (error) => {
      console.error('Set fixed P&L error:', error);
      toast.error(`Failed to set fixed P&L: ${error.message}`);
    },
  });

  // Mutation to close a trade with fixed P&L
  const closeTradesMutation = useMutation({
    mutationFn: async ({ tradeId }: { tradeId: string }) => {
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

      // Use fixed P&L if it exists, otherwise use calculated P&L
      const finalPnL = trade.fixed_pnl !== undefined && trade.fixed_pnl !== null ? trade.fixed_pnl : (trade.pnl || 0);

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

      // Return margin + final PnL to user balance
      const totalReturn = trade.margin + finalPnL;
      
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

      return { tradeId, pnl: finalPnL, userEmail: trade.user_email, isFixed: trade.fixed_pnl !== undefined && trade.fixed_pnl !== null };
    },
    onSuccess: (data) => {
      const pnlText = data.pnl >= 0 ? `+$${data.pnl.toFixed(2)}` : `-$${Math.abs(data.pnl).toFixed(2)}`;
      const fixedNote = data.isFixed ? ' (Fixed P&L Applied)' : '';
      toast.success(`✅ Trade closed by SuperAdmin! User: ${data.userEmail}, P&L: ${pnlText} USDT${fixedNote}`);
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
      current_price: trade.current_price || trade.entry_price,
      user_id: trade.user_id
    });
  };

  const confirmCloseTrade = () => {
    if (selectedTrade) {
      closeTradesMutation.mutate({ tradeId: selectedTrade.id });
    }
  };

  const handleSetFixedPnL = (trade: any) => {
    setManualPnLDialog({
      trade: {
        id: trade.id,
        user_email: trade.user_email,
        pair: trade.pair,
        side: trade.side,
        size: trade.size,
        pnl: trade.pnl || 0,
        margin: trade.margin,
        current_price: trade.current_price || trade.entry_price,
        user_id: trade.user_id
      },
      isOpen: true
    });
    setManualPnL((trade.fixed_pnl !== undefined && trade.fixed_pnl !== null ? trade.fixed_pnl : trade.pnl || 0).toFixed(2));
  };

  const confirmSetFixedPnL = () => {
    if (manualPnLDialog.trade && manualPnL !== '') {
      const fixedPnL = parseFloat(manualPnL);
      if (isNaN(fixedPnL)) {
        toast.error('Please enter a valid P&L amount');
        return;
      }
      setFixedPnLMutation.mutate({ 
        tradeId: manualPnLDialog.trade.id, 
        fixedPnL: fixedPnL 
      });
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
                          (trade.fixed_pnl !== undefined && trade.fixed_pnl !== null 
                            ? trade.fixed_pnl 
                            : trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(trade.fixed_pnl !== undefined && trade.fixed_pnl !== null 
                            ? trade.fixed_pnl 
                            : trade.pnl || 0) >= 0 ? '+' : ''}${(trade.fixed_pnl !== undefined && trade.fixed_pnl !== null 
                              ? trade.fixed_pnl 
                              : trade.pnl || 0).toFixed(2)}
                          <div className="text-xs">
                            {trade.fixed_pnl !== undefined && trade.fixed_pnl !== null ? (
                              <span className="text-blue-600 font-semibold">FIXED</span>
                            ) : (
                              <>({(trade.pnl_percentage || 0) >= 0 ? '+' : ''}{trade.pnl_percentage?.toFixed(2) || '0.00'}%)</>
                            )}
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
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => handleSetFixedPnL(trade)}
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            disabled={setFixedPnLMutation.isPending}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Set P&L
                          </Button>
                        </div>
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

      {/* Close Trade Confirmation Dialog */}
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
                  <div><strong>Final P&L:</strong> 
                    <span className={`ml-2 font-semibold ${
                      selectedTrade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)} USDT
                    </span>
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
              {closeTradesMutation.isPending ? 'Closing Trade...' : 'Close Trade'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Fixed P&L Dialog */}
      <Dialog open={manualPnLDialog.isOpen} onOpenChange={() => setManualPnLDialog({ trade: null as any, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>💰 Set Fixed P&L</DialogTitle>
            <DialogDescription>
              <strong>SuperAdmin Override:</strong> Set a fixed profit/loss amount for this user's trade. This will be shown to the user when they close the trade.
            </DialogDescription>
          </DialogHeader>
          
          {manualPnLDialog.trade && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>User:</strong> {manualPnLDialog.trade.user_email}</div>
                  <div><strong>Pair:</strong> {manualPnLDialog.trade.pair}</div>
                  <div><strong>Side:</strong> {manualPnLDialog.trade.side.toUpperCase()}</div>
                  <div><strong>Size:</strong> {manualPnLDialog.trade.size.toFixed(4)}</div>
                  <div><strong>Margin:</strong> ${manualPnLDialog.trade.margin.toFixed(2)}</div>
                  <div><strong>Current P&L:</strong> 
                    <span className={`ml-1 ${
                      manualPnLDialog.trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {manualPnLDialog.trade.pnl >= 0 ? '+' : ''}${manualPnLDialog.trade.pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fixed-pnl">Fixed P&L Amount (USDT)</Label>
                <Input
                  id="fixed-pnl"
                  type="number"
                  step="0.01"
                  value={manualPnL}
                  onChange={(e) => setManualPnL(e.target.value)}
                  placeholder="Enter fixed P&L amount (can be negative)"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  This fixed amount will be shown to the user when they close the trade.
                </p>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>Note:</strong> This sets a fixed P&L that will override any calculated values when the user closes their trade.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setManualPnLDialog({ trade: null as any, isOpen: false })}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSetFixedPnL}
              disabled={setFixedPnLMutation.isPending || !manualPnL}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {setFixedPnLMutation.isPending ? 'Setting Fixed P&L...' : 'Set Fixed P&L'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RealtimeTradesPanel;
