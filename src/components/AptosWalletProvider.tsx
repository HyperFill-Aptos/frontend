import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { ReactNode } from 'react';

interface AptosWalletProviderProps {
  children: ReactNode;
}

export function AptosWalletProvider({ children }: AptosWalletProviderProps) {
  return (
    <AptosWalletAdapterProvider
      // plugins={[]}
      autoConnect={false}
      dappConfig={{
        network: Network.TESTNET,
        aptosConnectDappId: "hypermover-dapp",
      }}
      onError={(error) => {
        console.log('Wallet connection error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}