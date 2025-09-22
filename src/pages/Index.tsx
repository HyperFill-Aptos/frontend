// src/pages/Index.tsx - VERSION FINALE
import { TradingTerminal } from "../components/TradingTerminal";
import { WalletConnect } from "../components/walletConnect";
import { VaultDashboard } from "../components/VaultDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header avec wallet */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-semibold font-mono">HyperFill Vault</h1>
          <WalletConnect />
        </div>
      </header>
      
      {/* Contenu principal avec tabs */}
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
