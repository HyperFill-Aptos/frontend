import { TradingTerminal } from "../components/TradingTerminal";
import { WalletConnect } from "../components/walletConnect";
import { VaultDashboard } from "../components/VaultDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-black font-sans tracking-widest bg-gradient-to-r from-aptos-blue to-aptos-accent bg-clip-text text-transparent">HyperMove</h1>
          <WalletConnect />
        </div>
      </header>

      <main className="container mx-auto py-6">
        <Tabs defaultValue="vault" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vault">Vault Dashboard</TabsTrigger>
            <TabsTrigger value="trading">Trading Terminal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vault" className="space-y-4">
            <VaultDashboard />
          </TabsContent>
          
          <TabsContent value="trading" className="space-y-4">
            <TradingTerminal />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
