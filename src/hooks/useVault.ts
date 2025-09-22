import { useState, useCallback, useEffect } from 'react';
import { useWallet } from './useWallet';
import { CONTRACTS } from '@/lib/contracts';

export interface VaultStats {
  userShares: string;
  userBalance: string;
  totalAssets: string;
  totalSupply: string;
  sharePrice: string;
  availableAssets: string;
  minDeposit: string;
  isPaused: boolean;
  wseiBalance: string;
  wseiAllowance: string;
}

export interface DepositResult {
  success: boolean;
  txHash?: string;
  shares?: string;
  error?: string;
}

export interface WithdrawResult {
  success: boolean;
  txHash?: string;
  assets?: string;
  error?: string;
}

export const useVault = () => {
  const { account, isConnected, signAndSubmitTransaction, client } = useWallet();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!account || !client) return;

    setRefreshing(true);
    try {
      const [
        userSharesResult,
        totalAssetsResult,
        totalSharesResult,
        sharePriceResult,
        availableAssetsResult,
        minDepositResult,
        isPausedResult,
        aptBalanceResult,
      ] = await Promise.all([
        client.view({
          function: `${CONTRACTS.VAULT_ADDRESS}::hyperfill_vault::get_user_shares`,
          arguments: [CONTRACTS.VAULT_ADDRESS, account],
          type_arguments: [],
        }),
        client.view({
          function: `${CONTRACTS.VAULT_ADDRESS}::hyperfill_vault::get_total_assets`,
          arguments: [CONTRACTS.VAULT_ADDRESS],
          type_arguments: [],
        }),
        client.view({
          function: `${CONTRACTS.VAULT_ADDRESS}::hyperfill_vault::get_total_shares`,
          arguments: [CONTRACTS.VAULT_ADDRESS],
          type_arguments: [],
        }),
        client.view({
          function: `${CONTRACTS.VAULT_ADDRESS}::hyperfill_vault::get_share_price`,
          arguments: [CONTRACTS.VAULT_ADDRESS],
          type_arguments: [],
        }),
        client.view({
          function: `${CONTRACTS.VAULT_ADDRESS}::hyperfill_vault::get_available_assets`,
          arguments: [CONTRACTS.VAULT_ADDRESS],
          type_arguments: [],
        }),
        client.view({
          function: `${CONTRACTS.VAULT_ADDRESS}::hyperfill_vault::get_min_deposit`,
          arguments: [CONTRACTS.VAULT_ADDRESS],
          type_arguments: [],
        }),
        client.view({
          function: `${CONTRACTS.VAULT_ADDRESS}::hyperfill_vault::is_paused`,
          arguments: [CONTRACTS.VAULT_ADDRESS],
          type_arguments: [],
        }),
        client.getAccountResource({
          accountAddress: account,
          resourceType: `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
        }),
      ]);

      const formatApt = (value: any) => {
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        return (numValue / 100000000).toFixed(4);
      };

      setStats({
        userShares: formatApt(userSharesResult[0] || 0),
        userBalance: formatApt(userSharesResult[0] || 0),
        totalAssets: formatApt(totalAssetsResult[0] || 0),
        totalSupply: formatApt(totalSharesResult[0] || 0),
        sharePrice: formatApt(sharePriceResult[0] || 1000000000000000000),
        availableAssets: formatApt(availableAssetsResult[0] || 0),
        minDeposit: formatApt(minDepositResult[0] || 100000000),
        isPaused: isPausedResult[0] || false,
        wseiBalance: formatApt(aptBalanceResult.coin.value || 0),
        wseiAllowance: '999999',
      });
    } catch (error) {
      console.error('Error fetching vault stats:', error);
    } finally {
      setRefreshing(false);
    }
  }, [account, client]);

  const approveWSEI = useCallback(async (amount: string): Promise<boolean> => {
    return true;
  }, []);

  const deposit = useCallback(async (amount: string): Promise<DepositResult> => {
    if (!account || !signAndSubmitTransaction) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);

      const amountInOctas = Math.floor(parseFloat(amount) * 100000000);

      const payload = {
        function: `${CONTRACTS.VAULT_ADDRESS}::hyperfill_vault::deposit_liquidity`,
        type_arguments: [],
        arguments: [CONTRACTS.VAULT_ADDRESS, amountInOctas.toString()],
      };

      const response = await signAndSubmitTransaction(payload);

      if (!response || !response.hash) {
        throw new Error('Transaction failed');
      }

      await client?.waitForTransaction(response.hash);

      await fetchStats();

      return {
        success: true,
        txHash: response.hash,
        shares: amount,
      };
    } catch (error: any) {
      console.error('Error depositing:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction, client, fetchStats]);

  const withdraw = useCallback(async (): Promise<WithdrawResult> => {
    if (!account || !signAndSubmitTransaction) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);

      const payload = {
        function: `${CONTRACTS.VAULT_ADDRESS}::hyperfill_vault::withdraw_profits`,
        type_arguments: [],
        arguments: [CONTRACTS.VAULT_ADDRESS],
      };

      const response = await signAndSubmitTransaction(payload);

      if (!response || !response.hash) {
        throw new Error('Transaction failed');
      }

      await client?.waitForTransaction(response.hash);

      await fetchStats();

      return {
        success: true,
        txHash: response.hash,
        assets: stats?.userShares || '0',
      };
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction, client, stats, fetchStats]);

  useEffect(() => {
    if (isConnected && account) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [isConnected, account, fetchStats]);

  return {
    stats,
    loading,
    refreshing,
    deposit,
    withdraw,
    approveWSEI,
    refreshStats: fetchStats,
  };
};