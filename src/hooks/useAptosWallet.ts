import { useWallet as useAptosWalletAdapter } from '@aptos-labs/wallet-adapter-react';
import { useCallback, useEffect, useState } from 'react';
import { Network } from '@aptos-labs/ts-sdk';

export const useAptosWallet = () => {
  const {
    connected,
    account,
    network,
    wallet,
    wallets,
    connect,
    disconnect,
    signAndSubmitTransaction,
    signTransaction,
    signMessage,
  } = useAptosWalletAdapter();

  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string>('0');

  const connectWallet = useCallback(async (walletName?: string) => {
    try {
      setIsConnecting(true);
      if (walletName) {
        const selectedWallet = wallets.find(w => w.name === walletName);
        if (selectedWallet) {
          await connect(selectedWallet.name);
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [connect, wallets]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setBalance('0');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, [disconnect]);

  const getBalance = useCallback(async () => {
    if (!account?.address) return '0';

    try {
      const response = await fetch(
        `https://fullnode.${network?.name || 'testnet'}.aptoslabs.com/v1/accounts/${account.address}/resources`
      );
      const resources = await response.json();

      const accountResource = resources.find(
        (r: any) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (accountResource) {
        const aptBalance = accountResource.data.coin.value;
        return (parseInt(aptBalance) / 100000000).toString(); // Convert from Octas
      }
      return '0';
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return '0';
    }
  }, [account?.address, network]);

  useEffect(() => {
    if (connected && account) {
      getBalance().then(setBalance);
    }
  }, [connected, account, getBalance]);

  const sendTransaction = useCallback(async (payload: any) => {
    if (!account) throw new Error('Wallet not connected');

    try {
      const response = await signAndSubmitTransaction(payload);
      return response;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }, [account, signAndSubmitTransaction]);

  return {
    // Connection state
    connected,
    isConnecting,
    account: account?.address,
    network: network?.name || Network.TESTNET,

    // Wallet info
    wallet,
    wallets,
    balance,

    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    signAndSubmitTransaction: sendTransaction,
    signTransaction,
    signMessage,
    refreshBalance: getBalance,
  };
};