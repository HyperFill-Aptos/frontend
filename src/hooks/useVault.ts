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
      console.log('Fetching vault stats for account:', account);
      console.log('Using vault address:', CONTRACTS.VAULT_ADDRESS);
      console.log('Using mock token address:', CONTRACTS.MOCK_TOKEN_ADDRESS);
      
      // First, let's check what modules are deployed at this address
      try {
        const accountModules = await aptosClient.getAccountModules({
          accountAddress: CONTRACTS.VAULT_ADDRESS,
        });
        console.log('Modules deployed at vault address:', accountModules.map(m => m.abi?.name));
        
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
            typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
          }
        });
        console.log('Contract owner test result:', testResult);
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
            functionArguments: [CONTRACTS.VAULT_ADDRESS],
            typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
          }
        }),
        // Get user's share balance
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_USER_SHARE_BALANCE}`,
            functionArguments: [CONTRACTS.VAULT_ADDRESS, account],
            typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
          }
        }),
        // Get available assets for trading
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_AVAILABLE_ASSETS}`,
            functionArguments: [CONTRACTS.VAULT_ADDRESS],
            typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
          }
        }),
        // Get minimum deposit requirement
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_MIN_DEPOSIT}`,
            functionArguments: [CONTRACTS.VAULT_ADDRESS],
            typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
          }
        }),
        // Check if vault is paused
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.IS_PAUSED}`,
            functionArguments: [CONTRACTS.VAULT_ADDRESS],
            typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
          }
        }),
        // Get user's profits
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_USER_PROFITS}`,
            functionArguments: [CONTRACTS.VAULT_ADDRESS, account],
            typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
          }
        }),
        // Get user's total deposited amount
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.GET_USER_TOTAL_DEPOSITED}`,
            functionArguments: [CONTRACTS.VAULT_ADDRESS, account],
            typeArguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
          }
        }),
        // Get user's mock token balance
        aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::mock_token::${MOCK_TOKEN_FUNCTIONS.GET_BALANCE}`,
            functionArguments: [account],
            typeArguments: [],
          }
        }).catch(() => [0]),
        // Get APT balance
        aptosClient.getAccountResource({
          accountAddress: account,
          resourceType: `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
        }).catch(() => ({ coin: { value: '0' } })),
      ]);
      
      console.log('Results:', {
        vaultStateResult: vaultStateResult.status === 'fulfilled' ? vaultStateResult.value : vaultStateResult.reason,
        userSharesResult: userSharesResult.status === 'fulfilled' ? userSharesResult.value : userSharesResult.reason,
        mockTokenBalanceResult: mockTokenBalanceResult.status === 'fulfilled' ? mockTokenBalanceResult.value : mockTokenBalanceResult.reason,
      });

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
      const aptBalance = aptBalanceResult.status === 'fulfilled' ? (aptBalanceResult.value?.coin?.value || 0) : 0;
      
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

      const amountInOctas = Math.floor(parseFloat(amount) * 100000000);

      const payload = {
        function: `${CONTRACTS.VAULT_ADDRESS}::mock_token::${MOCK_TOKEN_FUNCTIONS.FAUCET}`,
        type_arguments: [],
        arguments: [amountInOctas.toString()],
      };

      console.log('Faucet payload:', payload);
      const response = await signAndSubmitTransaction(payload);
      console.log('Faucet response:', response);

      if (!response || (!response.hash && !response.transactionHash)) {
        throw new Error('Transaction failed - no hash returned');
      }

      const txHash = response.hash || response.transactionHash;
      await aptosClient.waitForTransaction(txHash);

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

      // Check if user needs to register for the mock token first
      try {
        const isRegistered = await aptosClient.view({
          payload: {
            function: `${CONTRACTS.VAULT_ADDRESS}::mock_token::${MOCK_TOKEN_FUNCTIONS.IS_REGISTERED}`,
            functionArguments: [account],
            typeArguments: [],
          }
        });
        
        if (!isRegistered[0]) {
          // Register for the token first
          const registerPayload = {
            function: `${CONTRACTS.VAULT_ADDRESS}::mock_token::${MOCK_TOKEN_FUNCTIONS.REGISTER}`,
            type_arguments: [],
            arguments: [],
          };
          
          console.log('Registering for token first:', registerPayload);
          const registerResponse = await signAndSubmitTransaction(registerPayload);
          console.log('Registration response:', registerResponse);
          
          const registerHash = registerResponse.hash || registerResponse.transactionHash;
          await aptosClient.waitForTransaction(registerHash);
        }
      } catch (regError) {
        console.log('Token registration check failed, proceeding with deposit:', regError);
      }

      const amountInOctas = Math.floor(parseFloat(amount) * 100000000);

      // Fixed payload format for Martian wallet compatibility
      const payload = {
        function: `${CONTRACTS.VAULT_ADDRESS}::vault::${VAULT_FUNCTIONS.DEPOSIT_LIQUIDITY}`,
        type_arguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
        arguments: [CONTRACTS.VAULT_ADDRESS, amountInOctas.toString()],
      };

      console.log('Deposit payload:', payload);
      const response = await signAndSubmitTransaction(payload);
      console.log('Deposit response:', response);

      if (!response || (!response.hash && !response.transactionHash)) {
        throw new Error('Transaction failed - no hash returned');
      }

      const txHash = response.hash || response.transactionHash;
      await aptosClient.waitForTransaction(txHash);

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
        type_arguments: [`${CONTRACTS.VAULT_ADDRESS}::mock_token::MockToken`],
        arguments: [CONTRACTS.VAULT_ADDRESS],
      };

      console.log('Withdraw payload:', payload);
      const response = await signAndSubmitTransaction(payload);
      console.log('Withdraw response:', response);

      if (!response || (!response.hash && !response.transactionHash)) {
        throw new Error('Transaction failed - no hash returned');
      }

      const txHash = response.hash || response.transactionHash;
      await aptosClient.waitForTransaction(txHash);

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