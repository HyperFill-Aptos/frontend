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
    wallets,
    signAndSubmitTransaction: adapterSignAndSubmitTransaction,
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
          console.debug('Martian wallet not connected:', error);
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
      // Prefer Petra explicitly when no selector UI is present
      const petra = wallets?.find((w: any) =>
        typeof w?.name === 'string' && w.name.toLowerCase().includes('petra')
      );
      if (petra?.name) {
        await aptosConnect(petra.name as any);
      } else {
        await aptosConnect();
      }
    } catch (error: any) {
      console.error('Aptos wallet connection error:', error);
      throw new Error('Failed to connect Aptos wallet');
    }
  }, [aptosConnect, wallets]);

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
    console.log('=== TRANSACTION DEBUG ===');
    console.log('Wallet type:', walletType);
    console.log('Current wallet:', currentWallet?.name);
    console.log('Transaction payload:', transaction);
    console.log('Martian available:', !!window.martian);
    console.log('Martian account:', martianAccount);
    console.log('========================');

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
          console.log('Aptos wallet response (wallet instance):', response);
          return response;
        } else if ((window as any).aptos && typeof (window as any).aptos.signAndSubmitTransaction === 'function') {
          // Fallback to window.aptos if available
          const response = await (window as any).aptos.signAndSubmitTransaction(input);
          console.log('Aptos wallet response (window.aptos):', response);
          return response;
        } else {
          throw new Error('No signAndSubmitTransaction method found for Aptos wallet');
        }
      } catch (error: any) {
        console.error('Aptos wallet error:', error);
        throw new Error(`Transaction failed: ${error.message || error.toString()}`);
      }
    } else if (window.martian && martianAccount) {
      try {
        console.log('Using correct Martian wallet integration');
        console.log('Transaction function:', transaction.function);
        console.log('Full transaction object:', transaction);
        
        // Create the payload in the exact format from Martian docs
        const payload = {
          type: "entry_function_payload",
          function: transaction.function,
          type_arguments: transaction.type_arguments || [],
          arguments: transaction.arguments || [],
        };
        
        console.log('=== PAYLOAD DEBUG ===');
        console.log('Function:', transaction.function);
        console.log('Type arguments:', transaction.type_arguments);
        console.log('Arguments:', transaction.arguments);
        console.log('Final payload:', payload);
        console.log('Sender account:', martianAccount);
        console.log('=====================');
        
        // Try both approaches - first the combined method, then fallback to two-step
        let txnHash;
        
        try {
          // Method 1: Combined generateSignAndSubmitTransaction
          const options = {
            max_gas_amount: "100000",
            gas_unit_price: "100",
          };
          
          console.log('Trying generateSignAndSubmitTransaction...');
          console.log('Parameters:', { payload, options });
          
          // Martian's generateSignAndSubmitTransaction expects (payload, options)
          txnHash = await window.martian.generateSignAndSubmitTransaction(payload, options);
          console.log('Combined method success:', txnHash);
          
        } catch (combinedError) {
          console.log('Combined method failed, trying two-step approach:', combinedError);
          
          // Method 2: Two-step process
          console.log('Trying generateTransaction + signAndSubmitTransaction...');
          // Martian's generateTransaction expects (payload)
          const generatedTxn = await window.martian.generateTransaction(payload);
          console.log('Generated transaction:', generatedTxn);
          
          txnHash = await window.martian.signAndSubmitTransaction(generatedTxn);
          console.log('Two-step method success:', txnHash);
        }
        
        // Return in the expected format
        return {
          hash: txnHash,
          transactionHash: txnHash
        };
        
      } catch (error: any) {
        console.error('Martian transaction error:', error);
        console.error('Error type:', typeof error);
        console.error('Error details:', error.message, error.toString());
        console.error('Full error object:', error);
        
        // Network error specifically
        if (error.message && error.message.includes('Network Error')) {
          throw new Error('Network Error: Contract may not be deployed on this network, or RPC endpoint is unreachable.');
        }
        
        // Check for common errors
        if (error.message && error.message.includes('insufficient')) {
          throw new Error('Insufficient token balance. Please get tokens from faucet first.');
        }
        
        if (error.message && error.message.includes('not registered')) {
          throw new Error('Token not registered. Please try the faucet first to register the token.');
        }
        
        if (error.message && error.message.includes('not found')) {
          throw new Error('Contract or function not found. Please check if contracts are deployed.');
        }
        
        throw new Error(`Martian transaction failed: ${error.message || error.toString()}`);
      }
    } else {
      console.error('No wallet connected or available');
      throw new Error('No wallet connected');
    }
  }, [currentWallet, aptosAccount, walletType, martianAccount]);

  const isOnAptosTestnet = (walletType === 'aptos' && (network?.name === Network.TESTNET || network?.name === 'testnet')) || 
                         (walletType === 'martian');

  const switchToAptosTestnet = useCallback(async () => {
    console.log('Network switch requested - Aptos wallet will handle this');
  }, []);

  // Determine current connection state
  const isConnected = (walletType === 'aptos' && aptosConnected) || 
                     (walletType === 'martian' && martianConnected);
  const isConnecting = (walletType === 'aptos' && !!aptosConnecting) || 
                      (walletType === 'martian' && martianConnecting);
  const account = walletType === 'aptos'
    ? ((aptosAccount as any)?.address?.toString
        ? (aptosAccount as any).address.toString()
        : (aptosAccount as any)?.address)
    : 
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