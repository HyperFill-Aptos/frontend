import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useVault } from '@/hooks/useVault';

export const VaultDashboard = () => {
  const { account, isConnected } = useWallet();
  const { stats, loading, refreshing, deposit, withdraw, approveAPT, requestMockTokens, refreshStats } = useVault();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRequestingTokens, setIsRequestingTokens] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    if (stats && parseFloat(depositAmount) < parseFloat(stats.minDeposit)) {
      toast({
        title: "Amount too small", 
        description: `Minimum deposit is ${stats.minDeposit} tokens`,
        variant: "destructive",
      });
      return;
    }

    if (stats && parseFloat(depositAmount) > parseFloat(stats.mockTokenBalance)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough mock tokens",
        variant: "destructive",
      });
      return;
    }

    setIsDepositing(true);
    try {
      const result = await deposit(depositAmount);
      
      if (result.success) {
        toast({
          title: "Deposit successful!",
          description: `Deposited ${depositAmount} tokens and received ${result.shares} shares`,
        });
        setDepositAmount('');
      } else {
        toast({
          title: "Deposit failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Deposit failed", 
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!stats || parseFloat(stats.userShares) === 0) {
      toast({
        title: "No shares to withdraw",
        description: "You don't have any shares in the vault",
        variant: "destructive",
      });
      return;
    }

    setIsWithdrawing(true);
    try {
      const result = await withdraw();
      
      if (result.success) {
        toast({
          title: "Withdrawal successful!",
          description: `Withdrew ${result.assets} tokens`,
        });
      } else {
        toast({
          title: "Withdrawal failed",
          description: result.error || "Unknown error", 
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Withdrawal failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleApprove = async () => {
    if (!depositAmount) return;
    
    try {
      const success = await approveAPT(depositAmount);
      if (success) {
        toast({
          title: "Approval successful",
          description: `Approved ${depositAmount} APT for spending`,
        });
      }
    } catch (error) {
      toast({
        title: "Approval failed",
        description: "Failed to approve APT",
        variant: "destructive",
      });
    }
  };

  const handleRequestTokens = async () => {
    setIsRequestingTokens(true);
    try {
      const result = await requestMockTokens("1000");
      
      if (result.success) {
        toast({
          title: "Tokens received!",
          description: "Successfully received 1000 mock tokens from faucet",
        });
      } else {
        toast({
          title: "Faucet failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Faucet failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRequestingTokens(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-black border border-red-400/30 p-6 font-mono">
        <div className="text-center space-y-4">
          <div className="text-red-400 font-terminal text-sm">[WALLET_DISCONNECTED]</div>
          <div className="text-muted-foreground text-xs">access denied - authentication required</div>
          <div className="text-xs text-red-400">connect wallet to access vault functions</div>
        </div>
      </div>
    );
  }

  if (false) { // Network check not needed for Aptos
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle>Wrong Network</CardTitle>
            <CardDescription>
              Please switch to APT Testnet to use the vault
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-black border border-red-400/30 p-4 font-mono">
        <div className="text-red-400 font-terminal text-sm mb-3">[VAULT_STATS]</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-muted/20 border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">mock_token_balance:</div>
            <div className="text-sm font-mono text-foreground">
              {stats ? parseFloat(stats.mockTokenBalance).toFixed(4) : '0.0000'}
            </div>
          </div>

          <div className="bg-muted/20 border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">vault_shares:</div>
            <div className="text-sm font-mono text-foreground">
              {stats ? parseFloat(stats.userShares).toFixed(4) : '0.0000'}
            </div>
          </div>

          <div className="bg-muted/20 border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">share_price:</div>
            <div className="text-sm font-mono text-foreground">
              {stats ? stats.sharePrice : '1.0000'}
            </div>
          </div>

          <div className="bg-muted/20 border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">total_assets:</div>
            <div className="text-sm font-mono text-foreground">
              {stats ? parseFloat(stats.totalAssets).toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="bg-muted/20 border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">user_profits:</div>
            <div className="text-sm font-mono text-foreground">
              {stats ? parseFloat(stats.userProfits).toFixed(4) : '0.0000'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-black border border-red-400/30 p-4 font-mono">
          <div className="flex items-center justify-between mb-3">
            <div className="text-red-400 font-terminal text-sm">[DEPOSIT_TOKENS]</div>
            <div className="flex items-center gap-2">
              {stats?.isPaused && (
                <Badge variant="destructive" className="text-xs font-mono">PAUSED</Badge>
              )}
              <Button
                onClick={handleRequestTokens}
                disabled={isRequestingTokens || loading}
                variant="outline"
                size="sm"
                className="text-xs font-mono border-green-400/30 hover:bg-green-400/10"
              >
                {isRequestingTokens ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    requesting...
                  </>
                ) : (
                  'faucet_1000'
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">amount_tokens:</div>
              <Input
                type="number"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={isDepositing || loading || stats?.isPaused}
                className="bg-muted/20 border-border/50 font-mono text-sm"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>balance: {stats ? parseFloat(stats.mockTokenBalance).toFixed(4) : '0.0000'}</span>
                <span>min: {stats ? parseFloat(stats.minDeposit).toFixed(2) : '1.00'}</span>
              </div>
            </div>

            {stats && depositAmount && parseFloat(depositAmount) > parseFloat(stats.aptAllowance) && (
              <div className="p-2 bg-amber-950/30 border border-amber-400/30">
                <div className="text-xs text-amber-400 mb-2">
                  approval_required: {depositAmount} APT
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApprove}
                  disabled={loading}
                  className="text-xs font-mono"
                >
                  approve_apt
                </Button>
              </div>
            )}

            <Button
              onClick={handleDeposit}
              disabled={isDepositing || loading || !depositAmount || stats?.isPaused}
              className="w-full font-mono text-sm"
            >
              {isDepositing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  depositing...
                </>
              ) : (
                'execute_deposit'
              )}
            </Button>
          </div>
        </div>

        <div className="bg-black border border-red-400/30 p-4 font-mono">
          <div className="text-red-400 font-terminal text-sm mb-3">[WITHDRAW_ALL]</div>

          <div className="space-y-3">
            <div className="bg-muted/20 border border-border/50 p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">your_shares:</span>
                <span className="text-foreground font-mono">
                  {stats ? parseFloat(stats.userShares).toFixed(4) : '0.0000'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">estimated_tokens:</span>
                <span className="text-foreground font-mono">
                  {stats ? (parseFloat(stats.userShares) * parseFloat(stats.sharePrice)).toFixed(4) : '0.0000'}
                </span>
              </div>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing || loading || !stats || parseFloat(stats.userShares) === 0}
              variant="destructive"
              className="w-full font-mono text-sm"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  withdrawing...
                </>
              ) : (
                'execute_withdrawal'
              )}
            </Button>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-black border border-red-400/30 p-4 font-mono">
          <div className="text-red-400 font-terminal text-sm mb-3">[PORTFOLIO_ALLOCATION]</div>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">APT/USDC:</span>
                <span className="text-green-400">45%</span>
              </div>
              <div className="w-full bg-muted/20 h-2 border border-border/50">
                <div className="bg-green-400 h-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">BTC/APT:</span>
                <span className="text-blue-400">30%</span>
              </div>
              <div className="w-full bg-muted/20 h-2 border border-border/50">
                <div className="bg-blue-400 h-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ETH/APT:</span>
                <span className="text-purple-400">25%</span>
              </div>
              <div className="w-full bg-muted/20 h-2 border border-border/50">
                <div className="bg-purple-400 h-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black border border-red-400/30 p-4 font-mono">
          <div className="text-red-400 font-terminal text-sm mb-3">[RISK_METRICS]</div>
          <div className="space-y-3">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-2">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#333"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray={`${74.3 * 2.51} 251.2`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-400">74%</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">win_rate</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/20 border border-border/50 p-2 text-center">
                <div className="text-green-400">2.18</div>
                <div className="text-muted-foreground">profit_factor</div>
              </div>
              <div className="bg-muted/20 border border-border/50 p-2 text-center">
                <div className="text-red-400">-8.2%</div>
                <div className="text-muted-foreground">max_drawdown</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black border border-red-400/30 p-4 font-mono">
        <div className="text-red-400 font-terminal text-sm mb-3">[LIVE_TRADING_HEATMAP]</div>
        <div className="grid grid-cols-8 gap-1 h-32">
          {Array.from({ length: 64 }, (_, i) => {
            const intensity = Math.random();
            const color = intensity > 0.7 ? 'bg-green-400' :
                         intensity > 0.4 ? 'bg-yellow-400' :
                         intensity > 0.2 ? 'bg-orange-400' : 'bg-red-400';
            return (
              <div
                key={i}
                className={`${color} opacity-${Math.floor(intensity * 100)} border border-border/30`}
                title={`Activity: ${Math.floor(intensity * 100)}%`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>low activity</span>
          <span>trading intensity</span>
          <span>high activity</span>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={refreshStats}
          disabled={refreshing}
          className="font-mono text-sm border-red-400/30 hover:bg-red-400/10"
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-3 w-3" />
              refresh_data
            </>
          )}
        </Button>
      </div>
    </div>
  );
};