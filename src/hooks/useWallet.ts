import { useState, useEffect, useCallback } from 'react';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export interface WalletState {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  walletType: 'aptos' | null;
}

declare global {}

export const useWallet = () => {
  const {
    connect: aptosConnect,
    disconnect: aptosDisconnect,
    account: aptosAccount,
    connected: aptosConnected,
    wallet: currentWallet,
    wallets,
    signAndSubmitTransaction: adapterSignAndSubmitTransaction,
    network,
  } = useAptosWallet();

  const [walletType, setWalletType] = useState<'aptos' | null>(null);
  const [connecting, setConnecting] = useState(false);

  const [client] = useState(() => {
    const config = new AptosConfig({ network: Network.TESTNET });
    return new Aptos(config);
  });
  // Petra/Aptos adapter only: nothing to initialize for other wallets

  // Update wallet type when Aptos connects
  useEffect(() => {
    if (aptosConnected && aptosAccount) {
      setWalletType('aptos');
    } else if (!aptosConnected && walletType === 'aptos') {
      setWalletType(null);
    }
  }, [aptosConnected, aptosAccount]);

  const connectAptos = useCallback(async () => {
    try {
      setConnecting(true);
      // Prefer Petra explicitly when no selector UI is present
      const petra = wallets?.find((w: any) =>
        typeof w?.name === 'string' && w.name.toLowerCase().includes('petra')
      );
      const targetName = petra?.name || wallets?.[0]?.name;
      if (!targetName) throw new Error('No compatible wallet found');
      await aptosConnect(targetName as any);
    } catch (error: any) {
      console.error('Aptos wallet connection error:', error);
      throw new Error('Failed to connect Aptos wallet');
    } finally {
      setConnecting(false);
    }
  }, [aptosConnect, wallets]);


  const disconnect = useCallback(async () => {
    try {
      if (walletType === 'aptos') {
        await aptosDisconnect();
      }
      setWalletType(null);
    } catch (error: any) {
      console.error('Wallet disconnect error:', error);
    }
  }, [walletType, aptosDisconnect]);

  const signAndSubmitTransaction = useCallback(async (transaction: any) => {


    if (currentWallet && aptosAccount && walletType === 'aptos') {
      try {
        // Normalize sender address to string
        const sender = (aptosAccount as any)?.address?.toString
          ? (aptosAccount as any).address.toString()
          : (aptosAccount as any)?.address;

        // Map raw payload to adapter InputTransactionData shape
        const input = transaction?.function
          ? {
              sender,
              data: {
                type: 'entry_function_payload',
                function: transaction.function,
                typeArguments: transaction.type_arguments || transaction.typeArguments || [],
                functionArguments: transaction.arguments || transaction.functionArguments || [],
              },
            }
          : transaction;

        // Prefer adapter hook API for consistent payload mapping
        if (typeof adapterSignAndSubmitTransaction === 'function') {
          const response = await adapterSignAndSubmitTransaction(input as any);
          console.log('Aptos wallet response:', response);
          return response;
        } else if (typeof (currentWallet as any).signAndSubmitTransaction === 'function') {
          const response = await (currentWallet as any).signAndSubmitTransaction(input);
          return response;
        } else if ((window as any).aptos && typeof (window as any).aptos.signAndSubmitTransaction === 'function') {
          // Fallback to window.aptos if available
          const response = await (window as any).aptos.signAndSubmitTransaction(input);
          return response;
        } else {
          throw new Error('No signAndSubmitTransaction method found for Aptos wallet');
        }
      } catch (error: any) {
        console.error('Aptos wallet error:', error);
        throw new Error(`Transaction failed: ${error.message || error.toString()}`);
      }
    } else {
      console.error('No wallet connected or available');
      throw new Error('No wallet connected');
    }
  }, [currentWallet, aptosAccount, walletType]);

  const isOnAptosTestnet = walletType === 'aptos' && String(network?.name).toLowerCase() === 'testnet';

  const switchToAptosTestnet = useCallback(async () => {
    console.log('Network switch requested - Aptos wallet will handle this');
  }, []);

  // Determine current connection state
  const isConnected = (walletType === 'aptos' && aptosConnected);
  const isConnecting = (walletType === 'aptos' && !!connecting);
  const account = ((aptosAccount as any)?.address?.toString
        ? (aptosAccount as any).address.toString()
        : (aptosAccount as any)?.address) || null;

  return {
    account: account || null,
    isConnected,
    isConnecting,
    publicKey: aptosAccount?.publicKey || null,
    walletType,
    connectAptos,
    disconnect,
    signAndSubmitTransaction,
    client,
    network: network?.name || 'unknown',
    isOnAptosTestnet,
    switchToAptosTestnet,
    // Legacy compatibility
    connect: connectAptos,
    isOnSeiTestnet: isOnAptosTestnet,
    switchToSeiTestnet: switchToAptosTestnet,
  };
};