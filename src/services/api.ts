interface MarketData {
  asset: string;
  price: number;
  change24h: number;
  volume24h: number;
}

interface OrderbookData {
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
}

interface AgentStatus {
  id: string;
  name: string;
  status: "online" | "offline" | "processing" | "analyzing" | "executing";
  lastActivity: string;
  currentTask: string;
  performance: string;
}

interface VaultStats {
  totalValueLocked: number;
  yourShares: number;
  shareValue: number;
  apy: number;
  performanceFee: number;
  managementFee: number;
}

class HyperMoveAPI {
  private baseUrl: string;
  private executiveUrl: string;
  private analyzerUrl: string;
  private pricingUrl: string;

  constructor() {
    this.baseUrl = "http://localhost:8000";
    this.executiveUrl = "http://localhost:1000";
    this.analyzerUrl = "http://localhost:2000";
    this.pricingUrl = "http://localhost:3000";
  }

  async getMarketData(): Promise<MarketData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market/data`);
      if (!response.ok) throw new Error('Failed to fetch market data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  }

  async getOrderbook(asset: string): Promise<OrderbookData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/orderbook/${asset}`);
      if (!response.ok) throw new Error('Failed to fetch orderbook');
      return await response.json();
    } catch (error) {
      console.error('Error fetching orderbook:', error);
      return { bids: [], asks: [] };
    }
  }

  async getAgentStatus(): Promise<AgentStatus[]> {
    const agents = [
      { id: "analyst", url: this.analyzerUrl, name: "analyst_agent" },
      { id: "pricing", url: this.pricingUrl, name: "pricing_agent" },
      { id: "executive", url: this.executiveUrl, name: "executive_agent" }
    ];

    const statuses = await Promise.all(
      agents.map(async (agent) => {
        try {
          const response = await fetch(`${agent.url}/status`);
          if (!response.ok) throw new Error(`Failed to fetch ${agent.name} status`);
          const data = await response.json();
          return {
            id: agent.id,
            name: agent.name,
            status: data.isActive ? (data.currentAction ? "executing" : "online") : "offline",
            lastActivity: data.lastUpdate || new Date().toISOString(),
            currentTask: data.currentAction || data.lastAnalysis || "Monitoring markets",
            performance: data.performance || data.successRate || "N/A"
          };
        } catch (error) {
          console.error(`Error fetching ${agent.name} status:`, error);
          return {
            id: agent.id,
            name: agent.name,
            status: "offline" as const,
            lastActivity: new Date().toISOString(),
            currentTask: "Connection failed",
            performance: "N/A"
          };
        }
      })
    );

    return statuses;
  }

  async getVaultStats(): Promise<VaultStats> {
    try {
      const response = await fetch(`${this.baseUrl}/api/vault/stats`);
      if (!response.ok) throw new Error('Failed to fetch vault stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching vault stats:', error);
      return {
        totalValueLocked: 0,
        yourShares: 0,
        shareValue: 1.0,
        apy: 0,
        performanceFee: 10,
        managementFee: 2
      };
    }
  }

  async placeLimitOrder(asset: string, side: 'buy' | 'sell', price: number, size: number) {
    try {
      const response = await fetch(`${this.executiveUrl}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset,
          side,
          price: price.toString(),
          size,
          orderType: 'limit'
        })
      });
      
      if (!response.ok) throw new Error('Failed to place order');
      return await response.json();
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  async deposit(amount: number) {
    try {
      const response = await fetch(`${this.baseUrl}/api/vault/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      if (!response.ok) throw new Error('Failed to deposit');
      return await response.json();
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  }

  async withdraw(shares: number) {
    try {
      const response = await fetch(`${this.baseUrl}/api/vault/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shares })
      });
      
      if (!response.ok) throw new Error('Failed to withdraw');
      return await response.json();
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }
}

export const hyperMoveAPI = new HyperMoveAPI();
export type { MarketData, OrderbookData, AgentStatus, VaultStats };