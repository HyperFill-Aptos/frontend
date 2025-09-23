import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, AlertTriangle, ChevronDown } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useState } from 'react';

export const WalletConnect = () => {
  const {
    account,
    isConnected,
    isConnecting,
    isOnAptosTestnet,
    walletType,
    connectAptos,
    connectMetaMask,
    disconnect,
    switchToAptosTestnet
  } = useWallet();

  const [showWalletOptions, setShowWalletOptions] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleWalletSelect = async (selectedWalletType: string) => {
    setShowWalletOptions(false);
    try {
      if (selectedWalletType === 'aptos') {
        await connectAptos();
      } else if (selectedWalletType === 'metamask') {
        await connectMetaMask();
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  if (isConnected && account) {
    const accountAddress = typeof account === 'string' ? account : account;

    return (
      <div className="flex items-center gap-2">
        {walletType === 'metamask' && (
          <Button
            onClick={switchToAptosTestnet}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Switch to Aptos
          </Button>
        )}

        <Badge
          variant={walletType === 'aptos' ? "default" : "secondary"}
          className="px-3 py-1"
        >
          {walletType === 'aptos' ? "Aptos" : "MetaMask"}
        </Badge>

        <Badge variant="outline" className="px-3 py-1">
          {formatAddress(accountAddress)}
        </Badge>

        <Button
          onClick={disconnect}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowWalletOptions(!showWalletOptions)}
        disabled={isConnecting}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
        <ChevronDown className="h-4 w-4" />
      </Button>

      {showWalletOptions && (
        <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[200px] z-50">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleWalletSelect('aptos')}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-aptos-blue rounded-full"></div>
                Aptos Wallets
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleWalletSelect('metamask')}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
                MetaMask
              </div>
            </Button>
          </div>
        </div>
      )}

      {showWalletOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowWalletOptions(false)}
        />
      )}
    </div>
  );
};