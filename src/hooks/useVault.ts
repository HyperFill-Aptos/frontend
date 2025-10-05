import { useState, useCallback, useEffect } from 'react';
import { useWallet } from './useWallet';
import { CONTRACTS, VAULT_FUNCTIONS, MOCK_TOKEN_FUNCTIONS } from '@/lib/contracts';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export interface VaultStats {
  userShares: string;
  userBalance: string;
  totalAssets: string;
  totalSupply: string;
  sharePrice: string;
  availableAssets: string;
  minDeposit: string;
  isPaused: boolean;
  mockTokenBalance: string;
  aptBalance: string;
  aptAllowance: string;
  userProfits: string;
  userTotalDeposited: string;
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
  const { account, isConnected, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Create dedicated Aptos client for vault operations
  const [aptosClient] = useState(() => {
    const config = new AptosConfig({ network: Network.TESTNET });
    return new Aptos(config);
  });

  const fetchStats = useCallback(async () => {
    if (!account || !aptosClient) return;

    setRefreshing(true);
    try {

      
      // First, let's check what modules are deployed at this address
      try {
        const accountModules = await aptosClient.getAccountModules({
          accountAddress: CONTRACTS.VAULT_ADDRESS,
        });
        
        if (accountModules.length === 0) {
          console.error('No modules found at this address. Contracts may not be deployed.');
          setStats({
            userShares: '0.0000',
            userBalance: '0.0000', 
            totalAssets: '0.0000',
            totalSupply: '0.0000',
            sharePrice: '1.0000',
            availableAssets: '0.0000',
            minDeposit: '1.0000',
            isPaused: false,
            mockTokenBalance: '0.0000',
            aptBalance: '0.0000',
            aptAllowance: '999999',
            userProfits: '0.0000',
            userTotalDeposited: '0.0000',
          });
          return;
        }
        
        // Try a simple view function to test contract accessibility
        const testResult = await aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::get_owner`,
            functionArguments: [CONTRACTS.VAULT_ADDRESS],
            typeArguments: [`${CONTRACTS.APT_ADDRESS}`],
          }
        });
      } catch (testError) {
        console.error('Contract access error:', testError);
        // Continue with mock data for testing
        setStats({
          userShares: '0.0000',
          userBalance: '0.0000', 
          totalAssets: '0.0000',
          totalSupply: '0.0000',
          sharePrice: '1.0000',
          availableAssets: '0.0000',
          minDeposit: '1.0000',
          isPaused: false,
          mockTokenBalance: '0.0000',
          aptBalance: '0.0000',
          aptAllowance: '999999',
          userProfits: '0.0000',
          userTotalDeposited: '0.0000',
        });
        return;
      }
      
      const [
        vaultStateResult,
        userSharesResult,
        availableAssetsResult,
        minDepositResult,
        isPausedResult,
        userProfitsResult,
        userTotalDepositedResult,
        mockTokenBalanceResult,
        aptBalanceResult,
      ] = await Promise.allSettled([
        // Get comprehensive vault state (vault_balance, total_assets, total_supply, share_price, accumulated_fees)
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_VAULT_STATE}`,
            functionArguments: [account],
            typeArguments: [`${CONTRACTS.APT_ADDRESS}`],
          }
        }),
        // Get user's share balance
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_USER_SHARE_BALANCE}`,
            functionArguments: [account, account],
            typeArguments: [`${CONTRACTS.APT_ADDRESS}`],
          }
        }),
        // Get available assets for trading
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_AVAILABLE_ASSETS}`,
            functionArguments: [account],
            typeArguments: [`${CONTRACTS.APT_ADDRESS}`],
          }
        }),
        // Get minimum deposit requirement
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_MIN_DEPOSIT}`,
            functionArguments: [account],
            typeArguments: [`${CONTRACTS.APT_ADDRESS}`],
          }
        }),
        // Check if vault is paused
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.IS_PAUSED}`,
            functionArguments: [account],
            typeArguments: [`${CONTRACTS.APT_ADDRESS}`],
          }
        }),
        // Get user's profits
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_USER_PROFITS}`,
            functionArguments: [account, account],
            typeArguments: [`${CONTRACTS.APT_ADDRESS}`],
          }
        }),
        // Get user's total deposited amount
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_USER_TOTAL_DEPOSITED}`,
            functionArguments: [account, account],
            typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
          }
        }),
        // Get user's mock token balance
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::APTToken::${MOCK_TOKEN_FUNCTIONS.GET_BALANCE}`,
            functionArguments: [account],
            typeArguments: [],
          }
        }).catch(() => [0]),
        // Get APT balance
        (async () => {
          try {
            const resources: any[] = await aptosClient.getAccountResources({
              accountAddress: account,
            });
            const aptType = `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`;
            const store = resources.find((r: any) => r.type === aptType);
            return store || { data: { coin: { value: '0' } } };
          } catch {
            return { data: { coin: { value: '0' } } };
          }
        })(),
      ]);
      
      

      const formatToken = (value: any) => {
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        // Assuming 8 decimals for mock token (same as APT)
        return (numValue / 100000000).toFixed(4);
      };

      const formatSharePrice = (value: any) => {
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        // Share price is scaled by 1e6 in the contract
        return (numValue / 1000000).toFixed(4);
      };

      // Extract vault state values safely
      const vaultData = vaultStateResult.status === 'fulfilled' ? vaultStateResult.value : null;
      const [, totalAssets, totalSupply, sharePrice] = vaultData || [0, 0, 0, 1000000, 0];

      // Extract results safely
      const userShares = userSharesResult.status === 'fulfilled' ? (userSharesResult.value?.[0] || 0) : 0;
      const availableAssets = availableAssetsResult.status === 'fulfilled' ? (availableAssetsResult.value?.[0] || 0) : 0;
      const minDeposit = minDepositResult.status === 'fulfilled' ? (minDepositResult.value?.[0] || 100000000) : 100000000;
      const isPaused = isPausedResult.status === 'fulfilled' ? Boolean(isPausedResult.value?.[0]) : false;
      const userProfits = userProfitsResult.status === 'fulfilled' ? (userProfitsResult.value?.[0] || 0) : 0;
      const userTotalDeposited = userTotalDepositedResult.status === 'fulfilled' ? (userTotalDepositedResult.value?.[0] || 0) : 0;
      const mockTokenBalance = mockTokenBalanceResult.status === 'fulfilled' ? (mockTokenBalanceResult.value || 0) : 0;
      const aptBalance = aptBalanceResult.status === 'fulfilled' ? (aptBalanceResult.value?.data?.coin?.value || 0) : 0;
      
      setStats({
        userShares: formatToken(userShares),
        userBalance: formatToken(userShares),
        totalAssets: formatToken(totalAssets || 0),
        totalSupply: formatToken(totalSupply || 0),
        sharePrice: formatSharePrice(sharePrice || 1000000),
        availableAssets: formatToken(availableAssets),
        minDeposit: formatToken(minDeposit),
        isPaused,
        mockTokenBalance: formatToken(mockTokenBalance),
        aptBalance: formatToken(aptBalance),
        aptAllowance: '999999',
        userProfits: formatToken(userProfits),
        userTotalDeposited: formatToken(userTotalDeposited),
      });
    } catch (error) {
      console.error('Error fetching vault stats:', error);
    } finally {
      setRefreshing(false);
    }
  }, [account, aptosClient]);

  const approveAPT = useCallback(async (_amount: string): Promise<boolean> => {
    // For Aptos, we don't need explicit approval like ERC20
    // The transaction will handle token transfer directly
    return true;
  }, []);

  const requestMockTokens = useCallback(async (amount: string = "1000"): Promise<DepositResult> => {
    if (!account || !signAndSubmitTransaction) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);

      const decimals = 8; // APTToken uses 8 decimals
      const amountInOctas = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals)).toString();

      const payload = {
        function: `${CONTRACTS.VAULT_ADDRESS}::APTToken::${MOCK_TOKEN_FUNCTIONS.FAUCET}`,
        type_arguments: [],
        arguments: [amountInOctas],
      };

      const response = await signAndSubmitTransaction(payload);

      const txHash = (response as any)?.hash || (response as any)?.transactionHash || (typeof response === 'string' ? response : undefined);
      if (!txHash) {
        console.error('Unexpected faucet response shape:', response);
        throw new Error('Transaction failed - no hash returned');
      }

      await aptosClient.waitForTransaction({ transactionHash: txHash });

      // Refresh stats after successful transaction
      setTimeout(() => fetchStats(), 2000);

      return {
        success: true,
        txHash: txHash,
        shares: amount,
      };
    } catch (error: any) {
      console.error('Error requesting mock tokens:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction, aptosClient, fetchStats]);

  const deposit = useCallback(async (amount: string): Promise<DepositResult> => {
    if (!account || !signAndSubmitTransaction) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);

      // Ensure user's vault resource exists; if not, initialize it
      try {
        const resources: any[] = await aptosClient.getAccountResources({ accountAddress: account });
        const vaultType = `${CONTRACTS.VAULT_ADDRESS}::vault::HyperMoveVault<${CONTRACTS.APT_ADDRESS}>`;
        const hasVault = resources.some((r: any) => r.type === vaultType);
        if (!hasVault) {
          const initPayload = {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::initialize`,
            type_arguments: [`${CONTRACTS.APT_ADDRESS}`],
            arguments: ["0"], // use contract default min_deposit
          };
          const initResp = await signAndSubmitTransaction(initPayload);
          const initHash = (initResp as any)?.hash || (initResp as any)?.transactionHash;
          if (initHash) {
            await aptosClient.waitForTransaction({ transactionHash: initHash });
          }
        }
      } catch (initErr) {
        console.log('Vault initialization check/attempt result:', initErr);
      }

      // Ensure sender is registered for MockToken before deposit (best-effort)
      try {
        const registerPayload = {
          function: `${CONTRACTS.VAULT_ADDRESS}::APTToken::${MOCK_TOKEN_FUNCTIONS.REGISTER}`,
          type_arguments: [],
          arguments: [],
        };
        const registerResponse = await signAndSubmitTransaction(registerPayload);
        const registerHash = (registerResponse as any)?.hash || (registerResponse as any)?.transactionHash;
        if (registerHash) {
          await aptosClient.waitForTransaction({ transactionHash: registerHash });
        }
      } catch (regError) {
        console.log('Registration likely already done or not required:', regError);
      }

      const decimals = 8;
      const amountInOctas = BigInt(Math.round(parseFloat(amount) * 10 ** decimals)).toString();

      // Preflight checks to avoid generic simulation errors
      try {
        const [minDep, paused, balance] = await Promise.all([
          aptosClient.view({
            payload: {
              function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_MIN_DEPOSIT}`,
              functionArguments: [account],
              typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::APTToken::AptToken`],
            }
          }).catch(() => [0]),
          aptosClient.view({
            payload: {
              function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.IS_PAUSED}`,
              functionArguments: [account],
              typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::APTToken::AptToken`],
            }
          }).catch(() => [false]),
          aptosClient.view({
            payload: {
              function: `${CONTRACTS.VAULT_ADDRESS}::APTToken::${MOCK_TOKEN_FUNCTIONS.GET_BALANCE}`,
              functionArguments: [account],
              typeArguments: [],
            }
          }).catch(() => [0]),
          // APTToken balance (new)
          aptosClient.view({
            payload: {
              function: `${CONTRACTS.VAULT_ADDRESS}::APTToken::${MOCK_TOKEN_FUNCTIONS.GET_BALANCE}`,
              functionArguments: [account],
              typeArguments: [],
            }
          }).catch(() => [0]),
        ]);

        const minDepositU64 = BigInt((minDep as any)?.[0] ?? 0);
        const isPaused = Boolean((paused as any)?.[0]);
        const userBal = BigInt((balance as any)?.[0] ?? 0);

        if (isPaused) {
          throw new Error('Vault is paused');
        }
        if (BigInt(amountInOctas) < minDepositU64) {
          throw new Error(`Amount below min deposit (${(Number(minDepositU64) / 1e8).toFixed(2)})`);
        }
        if (BigInt(amountInOctas) > userBal) {
          throw new Error('Insufficient token balance');
        }
      } catch (preErr: any) {
        return {
          success: false,
          error: preErr.message || 'Preflight failed',
        };
      }

      // Fixed payload format for Martian wallet compatibility
      const payload = {
        function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.DEPOSIT_LIQUIDITY}`,
        type_arguments: [`${CONTRACTS.APT_ADDRESS}`],
        // deposit_liquidity expects only the amount (u64)
        arguments: [amountInOctas],
      };

      const response = await signAndSubmitTransaction(payload);

      const txHash = (response as any)?.hash || (response as any)?.transactionHash || (typeof response === 'string' ? response : undefined);
      if (!txHash) {
        console.error('Unexpected deposit response shape:', response);
        throw new Error('Transaction failed - no hash returned');
      }

      await aptosClient.waitForTransaction({ transactionHash: txHash });

      // Refresh stats after successful transaction
      setTimeout(() => fetchStats(), 2000);

      return {
        success: true,
        txHash: txHash,
        shares: amount,
      };
    } catch (error: any) {
      console.error('Error depositing:', error);
      
      // Check for common Aptos errors
      if (error.message && error.message.includes('INSUFFICIENT_BALANCE')) {
        return {
          success: false,
          error: 'Insufficient token balance. Please get tokens from faucet first.'
        };
      }
      
      if (error.message && error.message.includes('not registered')) {
        return {
          success: false,
          error: 'Token not registered. Please try again - registration will happen automatically.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction, aptosClient, fetchStats]);

  const withdraw = useCallback(async (): Promise<WithdrawResult> => {
    if (!account || !signAndSubmitTransaction) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);

      const payload = {
        function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.WITHDRAW_PROFITS}`,
        type_arguments: [`${CONTRACTS.APT_ADDRESS}`],
        arguments: [],
      };

      const response = await signAndSubmitTransaction(payload);

      const txHash = (response as any)?.hash || (response as any)?.transactionHash || (typeof response === 'string' ? response : undefined);
      if (!txHash) {
        console.error('Unexpected withdraw response shape:', response);
        throw new Error('Transaction failed - no hash returned');
      }

      await aptosClient.waitForTransaction({ transactionHash: txHash });

      // Refresh stats after successful transaction
      setTimeout(() => fetchStats(), 2000);

      return {
        success: true,
        txHash: txHash,
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
  }, [account, signAndSubmitTransaction, aptosClient, stats, fetchStats]);

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
    approveAPT,
    requestMockTokens,
    refreshStats: fetchStats,
  };
};