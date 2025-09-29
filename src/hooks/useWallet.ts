import { useState, useEffect, useCallback } from 'react';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export interface WalletState {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  walletType: 'aptos' | 'martian' | null;
}

declare global {
  interface Window {
    martian?: any;
  }
}

export const useWallet = () => {
  const {
    connect: aptosConnect,
    disconnect: aptosDisconnect,
    account: aptosAccount,
    connected: aptosConnected,
    connecting: aptosConnecting,
    wallet: currentWallet,
    network,
  } = useAptosWallet();

  const [martianAccount, setMartianAccount] = useState<string | null>(null);
  const [martianConnected, setMartianConnected] = useState(false);
  const [martianConnecting, setMartianConnecting] = useState(false);
  const [walletType, setWalletType] = useState<'aptos' | 'martian' | null>(null);

  const [client] = useState(() => {
    const config = new AptosConfig({ network: Network.TESTNET });
    return new Aptos(config);
  });


  // Check Martian wallet connection on load
  useEffect(() => {
    const checkMartianConnection = async () => {
      if (typeof window !== 'undefined' && window.martian) {
        try {
          const account = await window.martian.account();
          if (account) {
            setMartianAccount(account.address);
            setMartianConnected(true);
            setWalletType('martian');
          }
        } catch (error) {
          console.log('Martian wallet not connected:', error);
        }

        // Listen for account changes
        window.martian.onAccountChange((account: any) => {
          if (account) {
            setMartianAccount(account.address);
            setMartianConnected(true);
            setWalletType('martian');
          } else {
            setMartianAccount(null);
            setMartianConnected(false);
            if (walletType === 'martian') {
              setWalletType(null);
            }
          }
        });
      }
    };

    checkMartianConnection();
  }, []);

  // Update wallet type when Aptos connects
  useEffect(() => {
    if (aptosConnected && aptosAccount) {
      setWalletType('aptos');
      // Disconnect other wallets if Aptos connects
      setMartianConnected(false);
      setMartianAccount(null);
    } else if (!aptosConnected && walletType === 'aptos') {
      setWalletType(null);
    }
  }, [aptosConnected, aptosAccount]);

  const connectAptos = useCallback(async () => {
    try {
      setMartianConnected(false);
      setMartianAccount(null);
      await aptosConnect();
    } catch (error: any) {
      console.error('Aptos wallet connection error:', error);
      throw new Error('Failed to connect Aptos wallet');
    }
  }, [aptosConnect]);

  const connectMartian = useCallback(async () => {
    if (!window.martian) {
      window.open('https://martianwallet.xyz/', '_blank');
      return;
    }

    try {
      setMartianConnecting(true);
      // Disconnect other wallets if Martian connects
      if (aptosConnected) {
        await aptosDisconnect();
      }

      const account = await window.martian.connect();
      
      if (account) {
        setMartianAccount(account.address);
        setMartianConnected(true);
        setWalletType('martian');
      }
    } catch (error: any) {
      console.error('Martian wallet connection error:', error);
      throw new Error('Failed to connect Martian wallet');
    } finally {
      setMartianConnecting(false);
    }
  }, [aptosConnected, aptosDisconnect]);


  const disconnect = useCallback(async () => {
    try {
      if (walletType === 'aptos') {
        await aptosDisconnect();
      } else if (walletType === 'martian') {
        if (window.martian && window.martian.disconnect) {
          await window.martian.disconnect();
        }
        setMartianAccount(null);
        setMartianConnected(false);
      }
      setWalletType(null);
    } catch (error: any) {
      console.error('Wallet disconnect error:', error);
    }
  }, [walletType, aptosDisconnect]);

  const signAndSubmitTransaction = useCallback(async (transaction: any) => {
    if (walletType === 'aptos' && currentWallet && aptosAccount) {
      try {
        const response = await currentWallet.signAndSubmitTransaction(transaction);
        return response;
      } catch (error: any) {
        console.error('Aptos transaction error:', error);
        throw new Error('Transaction failed');
      }
    } else if (walletType === 'martian' && window.martian && martianAccount) {
      try {
        console.log('Martian transaction payload:', transaction);
        
        // For Martian wallet, we need to use a simpler format
        // Some versions expect just the core transaction properties
        const martianPayload = {
          function: transaction.function,
          type_arguments: transaction.type_arguments || [],
          arguments: transaction.arguments || [],
        };
        
        console.log('Formatted Martian payload:', martianPayload);
        
        // Use the connect method to get account first, then submit transaction
        const account = await window.martian.account();
        console.log('Martian account:', account);
        
        // Try submitting with the formatted payload
        const response = await window.martian.signAndSubmitTransaction(martianPayload);
        console.log('Martian transaction response:', response);
        return response;
        
      } catch (error: any) {
        console.error('Martian transaction error:', error);
        
        // If it's the serializedTxnRequest.split error, provide specific guidance
        if (error.toString().includes('split')) {
          throw new Error('Martian wallet compatibility issue. Please try: 1) Update Martian wallet, 2) Refresh the page, or 3) Use Petra wallet instead.');
        }
        
        throw new Error(`Transaction failed: ${error.message || error.toString()}`);
      }
    } else {
      throw new Error('No wallet connected');
    }
  }, [walletType, currentWallet, aptosAccount, martianAccount]);

  const isOnAptosTestnet = (walletType === 'aptos' && (network?.name === Network.TESTNET || network?.name === 'testnet')) || 
                         (walletType === 'martian');

  const switchToAptosTestnet = useCallback(async () => {
    console.log('Network switch requested - Aptos wallet will handle this');
  }, []);

  // Determine current connection state
  const isConnected = (walletType === 'aptos' && aptosConnected) || 
                     (walletType === 'martian' && martianConnected);
  const isConnecting = (walletType === 'aptos' && aptosConnecting) || 
                      (walletType === 'martian' && martianConnecting);
  const account = walletType === 'aptos' ? aptosAccount?.address : 
                 walletType === 'martian' ? martianAccount : null;

  return {
    account: account || null,
    isConnected,
    isConnecting,
    publicKey: aptosAccount?.publicKey || null,
    walletType,
    connectAptos,
    connectMartian,
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