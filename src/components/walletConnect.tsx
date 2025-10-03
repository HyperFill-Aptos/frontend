import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

export const WalletConnect = () => {
  const {
    account,
    isConnected,
    isConnecting,
    walletType,
    connectAptos,
    disconnect
  } = useWallet();

  const formatAddress = (value: unknown) => {
    const address = typeof value === 'string'
      ? value
      : (value && typeof (value as any).address === 'string')
        ? (value as any).address
        : '';
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleWalletSelect = async () => {
    try {
      await connectAptos();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  if (isConnected && account) {
    const accountAddress = typeof account === 'string'
      ? account
      : (account as any)?.address ?? '';

    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="default"
          className="px-3 py-1"
        >
          Petra
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
    <Button
      onClick={handleWalletSelect}
      disabled={isConnecting}
      className="flex items-center gap-2"
    >
      <Wallet className="h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect Petra Wallet"}
    </Button>
  );
};