import { useState, useEffect, useCallback } from 'react';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export interface WalletState {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
}

export const useWallet = () => {
  const {
    connect: aptosConnect,
    disconnect: aptosDisconnect,
    account: aptosAccount,
    connected: aptosConnected,
    connecting: aptosConnecting,
    wallet: currentWallet,
  } = useAptosWallet();

  const [client] = useState(() => {
    const config = new AptosConfig({ network: Network.TESTNET });
    return new Aptos(config);
  });

  const connect = useCallback(async () => {
    try {
      await aptosConnect();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      throw new Error('Failed to connect wallet');
    }
  }, [aptosConnect]);

  const disconnect = useCallback(async () => {
    try {
      await aptosDisconnect();
    } catch (error: any) {
      console.error('Wallet disconnect error:', error);
    }
  }, [aptosDisconnect]);

  const signAndSubmitTransaction = useCallback(async (transaction: any) => {
    if (!currentWallet || !aptosAccount) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await currentWallet.signAndSubmitTransaction(transaction);
      return response;
    } catch (error: any) {
      console.error('Transaction error:', error);
      throw new Error('Transaction failed');
    }
  }, [currentWallet, aptosAccount]);

  return {
    account: aptosAccount?.address || null,
    isConnected: aptosConnected,
    isConnecting: aptosConnecting,
    publicKey: aptosAccount?.publicKey || null,
    connect,
    disconnect,
    signAndSubmitTransaction,
    client,
  };
};