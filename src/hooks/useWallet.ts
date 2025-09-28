import { useState, useEffect, useCallback } from 'react';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export interface WalletState {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  walletType: 'aptos' | 'metamask' | 'martian' | null;
}

declare global {
  interface Window {
    ethereum?: any;
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

  const [metamaskAccount, setMetamaskAccount] = useState<string | null>(null);
  const [metamaskConnected, setMetamaskConnected] = useState(false);
  const [metamaskConnecting, setMetamaskConnecting] = useState(false);
  const [martianAccount, setMartianAccount] = useState<string | null>(null);
  const [martianConnected, setMartianConnected] = useState(false);
  const [martianConnecting, setMartianConnecting] = useState(false);
  const [walletType, setWalletType] = useState<'aptos' | 'metamask' | 'martian' | null>(null);

  const [client] = useState(() => {
    const config = new AptosConfig({ network: Network.TESTNET });
    return new Aptos(config);
  });

  // Check MetaMask connection on load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setMetamaskAccount(accounts[0]);
            setMetamaskConnected(true);
            setWalletType('metamask');
          }
        })
        .catch(console.error);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setMetamaskAccount(accounts[0]);
          setMetamaskConnected(true);
          setWalletType('metamask');
        } else {
          setMetamaskAccount(null);
          setMetamaskConnected(false);
          if (walletType === 'metamask') {
            setWalletType(null);
          }
        }
      });
    }
  }, []);

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
      setMetamaskConnected(false);
      setMetamaskAccount(null);
      setMartianConnected(false);
      setMartianAccount(null);
    } else if (!aptosConnected && walletType === 'aptos') {
      setWalletType(null);
    }
  }, [aptosConnected, aptosAccount]);

  const connectAptos = useCallback(async () => {
    try {
      setMetamaskConnected(false);
      setMetamaskAccount(null);
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
      setMetamaskConnected(false);
      setMetamaskAccount(null);

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

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setMetamaskConnecting(true);
      // Disconnect other wallets if MetaMask connects
      if (aptosConnected) {
        await aptosDisconnect();
      }
      setMartianConnected(false);
      setMartianAccount(null);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setMetamaskAccount(accounts[0]);
        setMetamaskConnected(true);
        setWalletType('metamask');
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      throw new Error('Failed to connect MetaMask');
    } finally {
      setMetamaskConnecting(false);
    }
  }, [aptosConnected, aptosDisconnect]);

  const disconnect = useCallback(async () => {
    try {
      if (walletType === 'aptos') {
        await aptosDisconnect();
      } else if (walletType === 'metamask') {
        setMetamaskAccount(null);
        setMetamaskConnected(false);
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
        const response = await window.martian.signAndSubmitTransaction(transaction);
        return response;
      } catch (error: any) {
        console.error('Martian transaction error:', error);
        throw new Error('Transaction failed');
      }
    } else if (walletType === 'metamask' && window.ethereum) {
      try {
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transaction],
        });
        return { hash: txHash };
      } catch (error: any) {
        console.error('MetaMask transaction error:', error);
        throw new Error('Transaction failed');
      }
    } else {
      throw new Error('No wallet connected');
    }
  }, [walletType, currentWallet, aptosAccount, martianAccount]);

  const isOnAptosTestnet = (walletType === 'aptos' && (network?.name === Network.TESTNET || network?.name === 'testnet')) || 
                         (walletType === 'martian');
  const isOnEthereumNetwork = walletType === 'metamask';

  const switchToAptosTestnet = useCallback(async () => {
    if (walletType === 'metamask') {
      // Switch to Aptos instead
      await connectAptos();
    } else {
      console.log('Network switch requested - Aptos wallet will handle this');
    }
  }, [walletType, connectAptos]);

  // Determine current connection state
  const isConnected = (walletType === 'aptos' && aptosConnected) || 
                     (walletType === 'metamask' && metamaskConnected) || 
                     (walletType === 'martian' && martianConnected);
  const isConnecting = (walletType === 'aptos' && aptosConnecting) || 
                      (walletType === 'metamask' && metamaskConnecting) || 
                      (walletType === 'martian' && martianConnecting);
  const account = walletType === 'aptos' ? aptosAccount?.address : 
                 walletType === 'metamask' ? metamaskAccount : 
                 walletType === 'martian' ? martianAccount : null;

  return {
    account: account || null,
    isConnected,
    isConnecting,
    publicKey: aptosAccount?.publicKey || null,
    walletType,
    connectAptos,
    connectMetaMask,
    connectMartian,
    disconnect,
    signAndSubmitTransaction,
    client,
    network: network?.name || 'unknown',
    isOnAptosTestnet: isOnAptosTestnet || isOnEthereumNetwork, // Show as valid for both
    switchToAptosTestnet,
    // Legacy compatibility
    connect: connectAptos,
    isOnSeiTestnet: isOnAptosTestnet || isOnEthereumNetwork,
    switchToSeiTestnet: switchToAptosTestnet,
  };
};