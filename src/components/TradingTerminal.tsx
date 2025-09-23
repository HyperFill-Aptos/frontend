import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Settings,
  Power,
  Terminal,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Brain,
  Zap,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  BookOpen
} from 'lucide-react';

import { useWallet } from '@/hooks/useWallet';
import { useTrading } from '@/hooks/useTrading';
import { ApprovalModal } from './ApprovalModal';
import { CONTRACTS } from '@/lib/contracts';

// API Configuration
const API_BASE_URL = import.meta.env?.VITE_ORDERBOOK_API_URL || 'http://localhost:8001';
const AGENT_API_URL = import.meta.env?.VITE_AGENT_API_URL || 'http://localhost:8000';

// API Functions
const api = {
  async registerOrder(orderData) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(orderData));

    const response = await fetch(`${API_BASE_URL}/api/register_order`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  },

  async getOrderbook(symbol) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify({ symbol }));

    const response = await fetch(`${API_BASE_URL}/api/orderbook`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  },

  async getOrder(orderId) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify({ orderId }));

    const response = await fetch(`${API_BASE_URL}/api/order`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  },

  async getBestOrder(baseAsset, quoteAsset, side) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify({ baseAsset, quoteAsset, side }));

    const response = await fetch(`${API_BASE_URL}/api/get_best_order`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  },

  async cancelOrder(orderId, side, baseAsset, quoteAsset) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify({ orderId, side, baseAsset, quoteAsset }));

    const response = await fetch(`${API_BASE_URL}/api/cancel_order`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  },

  async checkAvailableFunds(account, asset) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify({ account, asset }));

    const response = await fetch(`${API_BASE_URL}/api/check_available_funds`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  },

  async startAgent() {
    try {
      const response = await fetch(`${AGENT_API_URL}/start-bot`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Start agent fetch error:', error);
      throw error;
    }
  },

  async checkSettlementHealth() {
    const response = await fetch(`${API_BASE_URL}/api/settlement_health`);
    return await response.json();
  }
};
// UI Components
const Button = ({ children, variant = 'default', size = 'default', className = '', disabled = false, onClick, ...props }) => {
  const variants = {
    default: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    terminal: 'bg-aptos-blue/20 hover:bg-aptos-blue/30 text-aptos-blue font-mono border border-aptos-blue/30'
  };

  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8'
  };

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-black/50 border border-aptos-blue/20 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`p-3 border-b border-aptos-blue/20 bg-black/30 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-sm font-mono text-aptos-blue ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-3 ${className}`}>{children}</div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-aptos-blue/20 text-aptos-blue border border-aptos-blue/30',
    success: 'bg-aptos-success/20 text-aptos-success',
    destructive: 'bg-aptos-error/20 text-aptos-error',
    secondary: 'bg-aptos-navy-light text-aptos-blue-light/60',
    outline: 'border border-aptos-blue/20 text-aptos-blue-light'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-mono ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Input = ({ className = '', ...props }) => (
  <input
    className={`flex h-9 w-full border border-aptos-blue/10 bg-black/50 px-3 py-1 text-sm font-mono text-aptos-blue-light transition-colors placeholder:text-aptos-blue-light/30 focus:border-aptos-blue/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Label = ({ children, className = '', ...props }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);

// Trading Components
const OrderBookPanel = ({ symbol, orderbook, onRefresh, loading }) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-mono">ORDER_BOOK</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="font-mono text-xs">
            APT/USDT
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="p-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          {/* Asks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-red-400">ASKS</span>
              <span className="text-xs font-mono text-muted-foreground">PRICE/SIZE/TOTAL</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {orderbook?.asks?.length > 0 ? (
                orderbook.asks.map((ask, index) => (
                  <div key={index} className="flex justify-between text-xs font-mono">
                    <span className="text-red-400">{ask.price.toFixed(4)}</span>
                    <span className="text-foreground">{ask.amount.toFixed(2)}</span>
                    <span className="text-muted-foreground">{ask.total.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground font-mono">No asks</div>
              )}
            </div>
          </div>

          {/* Spread */}
          <div className="border-t border-b border-border py-2">
            <div className="text-center">
              <span className="text-xs font-mono text-muted-foreground">
                SPREAD: {orderbook?.asks?.[0] && orderbook?.bids?.[0]
                  ? (orderbook.asks[0].price - orderbook.bids[0].price).toFixed(4)
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          {/* Bids */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-aptos-success/80">BIDS</span>
              <span className="text-xs font-mono text-aptos-blue-light/50">PRICE / SIZE</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {orderbook?.bids?.length > 0 ? (
                orderbook.bids.map((bid, index) => (
                  <div key={index} className="flex justify-between text-xs font-mono">
                    <span className="text-aptos-blue-light">{bid.price.toFixed(4)}</span>
                    <span className="text-foreground">{bid.amount.toFixed(2)}</span>
                    <span className="text-muted-foreground">{bid.total.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground font-mono">No bids</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TradingPanel = ({ account, onOrderSubmit, loading }) => {
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState('buy');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [baseAsset, setBaseAsset] = useState('APT');
  const [quoteAsset, setQuoteAsset] = useState('USDT');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!price || !quantity || !account) return;

    const getTokenAddress = (symbol) => {
      if (symbol === 'APT') return CONTRACTS.APT_ADDRESS;
      if (symbol === 'USDT') return CONTRACTS.USDT_ADDRESS;
      return symbol;
    };

    onOrderSubmit({
      account,
      baseAsset: getTokenAddress(baseAsset),
      quoteAsset: getTokenAddress(quoteAsset),
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      side: side === 'buy' ? 'bid' : 'ask',
      privateKey: '0x' + '0'.repeat(64)
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-mono">PLACE_ORDER</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={side === 'buy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSide('buy')}
              className={side === 'buy' ? 'bg-aptos-success/20 hover:bg-aptos-success/30 text-aptos-success border-aptos-success/30' : 'text-aptos-blue-light/60'}
            >
              <span className="text-white">BUY</span>
            </Button>
            <Button
              type="button"
              variant={side === 'sell' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSide('sell')}
              className={side === 'sell' ? 'bg-aptos-error/20 hover:bg-aptos-error/30 text-aptos-error border-aptos-error/30' : 'text-aptos-blue-light/60'}
            >
              <span className="text-white">SELL</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base-asset" className="font-mono text-xs">BASE</Label>
              <select
                id="base-asset"
                value={baseAsset}
                onChange={(e) => setBaseAsset(e.target.value)}
                className="flex h-9 w-full border border-aptos-blue/10 bg-black/50 px-3 py-1 text-sm font-mono text-aptos-blue-light focus:border-aptos-blue/30 focus:outline-none"
              >
                <option value="APT">APT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <div>
              <Label htmlFor="quote-asset" className="font-mono text-xs">QUOTE</Label>
              <select
                id="quote-asset"
                value={quoteAsset}
                onChange={(e) => setQuoteAsset(e.target.value)}
                className="flex h-9 w-full border border-aptos-blue/10 bg-black/50 px-3 py-1 text-sm font-mono text-aptos-blue-light focus:border-aptos-blue/30 focus:outline-none"
              >
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="price" className="font-mono text-xs">PRICE</Label>
            <Input
              id="price"
              type="number"
              step="0.0001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.0000"
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="quantity" className="font-mono text-xs">QUANTITY</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className="font-mono"
            />
          </div>

          {price && quantity && (
            <div className="text-xs font-mono text-muted-foreground">
              Total: {(parseFloat(price) * parseFloat(quantity)).toFixed(4)} {quoteAsset}
            </div>
          )}

          <Button
            type="submit"
            className="w-full font-mono"
            disabled={loading || !account || !price || !quantity}
            variant={side === 'buy' ? 'default' : 'destructive'}
            onClick={() => {}}
          >
            {loading ? 'SUBMITTING...' : `${side.toUpperCase()} ${baseAsset}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const AgentStatusPanel = ({ onStartAgent, agentRunning, agentLoading }) => {
  const agents = [
    { name: 'Buffett', status: agentRunning ? 'ACTIVE' : 'STANDBY', pnl: '+12.3%', trades: 47 },
    { name: 'Lynch', status: agentRunning ? 'ACTIVE' : 'STANDBY', pnl: '+8.9%', trades: 23 },
    { name: 'Dalio', status: agentRunning ? 'ACTIVE' : 'STANDBY', pnl: '+15.7%', trades: 31 },
    { name: 'Belfort', status: agentRunning ? 'ACTIVE' : 'STANDBY', pnl: '+22.1%', trades: 89 }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-mono">
          AI_AGENTS
        </CardTitle>
        <Button
          variant={agentRunning ? "destructive" : "terminal"}
          size="sm"
          onClick={onStartAgent}
          disabled={agentLoading}
          className="font-mono text-xs"
        >
          {agentLoading ? (
            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
          ) : agentRunning ? (
            <Pause className="h-3 w-3 mr-1" />
          ) : (
            <Play className="h-3 w-3 mr-1" />
          )}
          {agentLoading ? 'INIT...' : agentRunning ? 'STOP' : 'START'}
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {agents.map((agent, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 ${agent.status === 'ACTIVE' ? 'bg-aptos-success animate-pulse' : 'bg-aptos-blue-light/30'}`}></div>
                <span className="text-sm font-mono text-white">{agent.name}</span>
                <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-xs">
                  {agent.status}
                </Badge>
              </div>
              <div className="text-xs font-mono text-right">
                <div className={`${agent.pnl.startsWith('+') ? 'text-aptos-blue-light' : 'text-red-400'}`}>
                  {agent.pnl}
                </div>
                <div className="text-green-400">{agent.trades} trades</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const TerminalLog = ({ logs }) => {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-mono">
          TERMINAL_LOG
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div ref={logRef} className="h-48 overflow-y-auto bg-black/60 border border-aptos-blue/10 p-2 font-mono text-xs">
          {logs.map((log, index) => (
            <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-aptos-blue-light' : 'text-foreground'}`}>
              <span className="text-muted-foreground">[{log.timestamp}]</span> {log.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const MarketStats = ({ symbol, orderbook }) => {
  const stats = {
    lastPrice: orderbook?.asks?.[0]?.price || orderbook?.bids?.[0]?.price || 0,
    change24h: '+5.23%',
    volume24h: '2.4M',
    high24h: '0.3456',
    low24h: '0.3123'
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-mono">
          MARKET_STATS
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-aptos-blue-light/50 font-mono">LAST_PRICE</div>
            <div className="text-lg font-mono text-aptos-blue-light">{stats.lastPrice.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-xs text-aptos-blue-light/50 font-mono">24H_CHANGE</div>
            <div className="text-lg font-mono text-aptos-success">{stats.change24h}</div>
          </div>
          <div>
            <div className="text-xs text-aptos-blue-light/50 font-mono">24H_VOLUME</div>
            <div className="text-lg font-mono text-aptos-blue-light">{stats.volume24h}</div>
          </div>
          <div>
            <div className="text-xs text-aptos-blue-light/50 font-mono">24H_RANGE</div>
            <div className="text-sm font-mono text-aptos-blue-light">{stats.low24h} - {stats.high24h}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Trading Terminal Component
export function TradingTerminal() {
  const {
    account,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    isOnAptosTestnet,
    switchToAptosTestnet
  } = useWallet();

  const { checkOrderApprovals } = useTrading();

  const [orderbook, setOrderbook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [logs, setLogs] = useState([
    { timestamp: new Date().toLocaleTimeString(), message: 'System initialized', type: 'info' },
    { timestamp: new Date().toLocaleTimeString(), message: 'Waiting for wallet connection...', type: 'info' }
  ]);

  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [tokenApprovals, setTokenApprovals] = useState([]);
  const [pendingOrder, setPendingOrder] = useState(null);

  const currentSymbol = `${CONTRACTS.APT_ADDRESS}_${CONTRACTS.USDT_ADDRESS}`;

  const addLog = (message, type = 'info') => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  const loadOrderbook = async () => {
    setLoading(true);
    try {
      const response = await api.getOrderbook(currentSymbol);
      if (response.status_code === 1) {
        setOrderbook(response.orderbook);
        addLog(`Orderbook loaded: ${response.orderbook.asks?.length || 0} asks, ${response.orderbook.bids?.length || 0} bids`);
      } else {
        addLog('Failed to load orderbook', 'error');
      }
    } catch (error) {
      addLog(`Orderbook error: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const submitOrderToAPI = async (orderData) => {
    try {
      addLog(`Submitting ${orderData.side} order: ${orderData.quantity} tokens @ ${orderData.price}`);
      const response = await api.registerOrder(orderData);
      
      if (response.status_code === 1) {
        addLog(`Order submitted successfully. ID: ${response.order.orderId}`, 'success');
        if (response.order.trades?.length > 0) {
          addLog(`Order matched! ${response.order.trades.length} trades executed`, 'success');
        }
        await loadOrderbook();
      } else {
        addLog(`Order failed: ${response.message}`, 'error');
        if (response.errors) {
          addLog(`Validation errors: ${JSON.stringify(response.errors)}`, 'error');
        }
      }
    } catch (error) {
      addLog(`Order error: ${error.message}`, 'error');
      console.error('Full error:', error);
    }
  };

  const handleOrderSubmit = async (orderData) => {
    if (!isConnected || !account) {
      addLog('Please connect your wallet first', 'error');
      return;
    }

    setLoading(true);
    try {
      addLog('Checking token approvals...');
      const approvalCheck = await checkOrderApprovals({
        side: orderData.side,
        quantity: orderData.quantity.toString(),
        price: orderData.price.toString(),
        baseAsset: orderData.baseAsset,
        quoteAsset: orderData.quoteAsset
      });

      if (approvalCheck.needsApproval) {
        addLog('Token approval required', 'info');
        setTokenApprovals(approvalCheck.tokenApprovals);
        setPendingOrder(orderData);
        setApprovalModalOpen(true);
      } else {
        addLog('Token approvals verified', 'success');
        await submitOrderToAPI(orderData);
      }
    } catch (error) {
      addLog(`Approval check failed: ${error.message}`, 'error');
      console.error('Approval check error:', error);
    }
    setLoading(false);
  };

  const handleApprovalComplete = async () => {
    setApprovalModalOpen(false);
    if (pendingOrder) {
      addLog('Approvals completed, submitting order...', 'success');
      setLoading(true);
      await submitOrderToAPI(pendingOrder);
      setPendingOrder(null);
      setLoading(false);
    }
  };

  const handleApprovalCancel = () => {
    setApprovalModalOpen(false);
    setPendingOrder(null);
    addLog('Order cancelled by user', 'info');
  };
  
  const handleStartAgent = async () => {
    setAgentLoading(true);
    try {
      if (agentRunning) {
        setAgentRunning(false);
        addLog('AI agents stopped', 'info');
      } else {
        addLog('Starting AI agents...');
        
        // Debug simple
        console.log('Agent API URL:', AGENT_API_URL);
        addLog(`Calling: ${AGENT_API_URL}/start-bot`);
        
        const response = await api.startAgent();

        addLog(`DEBUG - Response received: ${JSON.stringify(response)}`);
        
        console.log('Agent response:', response);
        addLog(`Response: ${JSON.stringify(response)}`);
        
        if (response && response.status === 'success') {
          setAgentRunning(true);
          addLog('AI agents activated', 'success');
        } else {
          addLog(`Agent start failed: ${response?.message || 'No response'}`, 'error');
        }
      }
    } catch (error) {
      console.error('Agent error:', error);
      addLog(`Agent error: ${error.message}`, 'error');
    }
    setAgentLoading(false);
  };
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Auto-refresh orderbook
  useEffect(() => {
    if (isConnected) {
      loadOrderbook();
      const interval = setInterval(loadOrderbook, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Add connection logs
  useEffect(() => {
    if (isConnected) {
      addLog(`Wallet connected: ${formatAddress(account)}`, 'success');
    }
  }, [isConnected, account]);

  return (
    <div className="min-h-screen bg-black text-aptos-blue-light p-4 font-sans max-w-7xl mx-auto">
      {/* Terminal Header */}
      <div className="bg-black/80 border border-aptos-blue/20 rounded-t-xl p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-aptos-error/80"></div>
            <div className="w-3 h-3 rounded-full bg-aptos-warning/80"></div>
            <div className="w-3 h-3 rounded-full bg-aptos-success/80"></div>
          </div>
          <span className="text-sm font-medium text-aptos-blue tracking-wider">HyperMove Terminal</span>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => addLog('Settings panel opened')}>
            <Settings className="h-4 w-4" />
          </Button>

          {/* Network Warning */}
          {isConnected && !isOnAptosTestnet && (
            <Button
              onClick={switchToAptosTestnet}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2 font-mono text-xs"
            >
              <AlertTriangle className="h-4 w-4" />
              WRONG_NETWORK
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-aptos-blue-light">
              {isConnected ? `Connected: ${formatAddress(account)}` : "Wallet Disconnected"}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-aptos-blue-light">
            <Power className="h-4 w-4" />
            <span className="text-sm font-mono">
              {isConnected && isOnAptosTestnet ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="bg-black/90 border border-t-0 border-aptos-blue/20 rounded-b-xl p-6 min-h-[calc(100vh-100px)]">
        {/* ASCII Header */}
        <div className="text-aptos-blue/70 font-mono text-xs mb-6 leading-tight">
          <pre>{`
██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ ███╗   ███╗ ██████╗ ██╗   ██╗███████╗
██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗████╗ ████║██╔═══██╗██║   ██║██╔════╝
███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝██╔████╔██║██║   ██║██║   ██║█████╗
██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║╚██╗ ██╔╝██╔══╝
██║  ██║   ██║   ██║     ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝ ╚████╔╝ ███████╗
╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝

          `}</pre>
          <div className="mt-2 space-y-1">
            <div><span className="text-red-400">[SYSTEM]</span> <span className="text-white">HyperMove Autonomous Trading Terminal v2.1.0</span></div>
            <div><span className="text-red-400">[SYSTEM]</span> <span className="text-aptos-blue">Connected to Aptos Network (testnet)</span></div>
            <div><span className="text-red-400">[SYSTEM]</span> <span className="text-green-400">AI Trading Collective: Buffett, Belfort, Lynch & Dalio</span></div>
            <div><span className="text-red-400">[SYSTEM]</span> <span className="text-aptos-blue-light">Aptos' becoming the Global Trading Engine</span></div>
            <div><span className="text-red-400">[SYSTEM]</span> <span className="text-gray-300">"Wanna see how finance works in a decentralized world?" - The HyperMove Team</span></div>
          </div>
        </div>


        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-400/20 rounded font-mono text-xs">
            <span className="text-red-400">[ERROR]</span>
            <span className="text-gray-400"> No wallet connection detected. Execute </span>
            <span className="text-aptos-blue">connect-wallet</span>
            <span className="text-gray-400"> to establish connection.</span>
          </div>
        )}

        {/* Terminal Prompt */}
        <div className="mb-4 text-sm font-mono">
          <span className="text-aptos-blue font-medium">hypermove@aptos</span>
          <span className="text-gray-400">:</span>
          <span className="text-red-400">~/vault</span>
          <span className="text-gray-400">$ </span>
          <span className="text-aptos-blue-light">status --agents --detailed</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Left Column - AI Agents */}
          <div className="col-span-6">
            <AgentStatusPanel
              onStartAgent={handleStartAgent}
              agentRunning={agentRunning}
              agentLoading={agentLoading}
            />
          </div>

          {/* Right Column - Trading Panel */}
          <div className="col-span-6">
            <TradingPanel
              account={account}
              onOrderSubmit={handleOrderSubmit}
              loading={loading}
            />
          </div>
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Left - Order Book */}
          <div className="col-span-6">
            <OrderBookPanel
              symbol={currentSymbol}
              orderbook={orderbook}
              onRefresh={loadOrderbook}
              loading={loading}
            />
          </div>

          {/* Right - Market Stats */}
          <div className="col-span-6">
            <MarketStats
              symbol={currentSymbol}
              orderbook={orderbook}
            />
          </div>
        </div>

        {/* Bottom Row - Terminal Log */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-12">
            <TerminalLog logs={logs} />
          </div>
        </div>

        {/* Bottom Terminal Commands */}
        <div className="border-t border-aptos-blue/20 pt-4">
          <div className="flex items-center space-x-4 mb-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-mono hover:bg-aptos-blue/10 text-aptos-blue"
              onClick={loadOrderbook}
              disabled={loading}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              ./refresh-orderbook
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-mono hover:bg-aptos-blue/10 text-aptos-blue"
              onClick={() => addLog('Config panel opened')}
            >
              <Settings className="h-3 w-3 mr-1" />
              ./config
            </Button>
            <div className="flex items-center space-x-2 text-aptos-blue-light text-xs font-mono">
              <Power className="h-3 w-3" />
              <span>DAEMON {isConnected && isOnAptosTestnet ? 'RUNNING' : 'STANDBY'}</span>
            </div>
          </div>

          <div className="text-xs font-mono text-aptos-blue-light">
            <span className="text-aptos-blue font-medium">hypermove@aptos</span>
            <span className="text-gray-400">:</span>
            <span className="text-red-400">~/vault</span>
            <span className="text-gray-400">$ </span>
            <span className="animate-pulse">_</span>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs font-mono mt-2 px-2 py-1 bg-black/80 border border-aptos-blue/20">
        <div className="flex items-center space-x-4">
          <span className={isConnected && isOnAptosTestnet ? "text-aptos-blue-light" : "text-red-400"}>●</span>
          <span className="text-aptos-blue-light">{isOnAptosTestnet ? "APTOS TESTNET" : "DISCONNECTED"}</span>
          <span className="text-gray-400">|</span>
          <span className="text-aptos-blue-light">STATUS: {isConnected ? (isOnAptosTestnet ? "ACTIVE" : "WRONG_NET") : "OFFLINE"}</span>
          <span className="text-gray-400">|</span>
          <span className="text-aptos-blue-light">WALLET: {isConnected ? "CONNECTED" : "NONE"}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-aptos-blue-light">LATENCY: {isConnected ? "47ms" : "∞"}</span>
          <span className="text-gray-400">|</span>
          <span className="text-aptos-blue-light">AGENTS: {agentRunning ? "4/4" : "0/4"}</span>
          <span className="text-gray-400">|</span>
          <span className="text-aptos-blue-light">ORDERS: {orderbook ? (orderbook.asks?.length || 0) + (orderbook.bids?.length || 0) : 0}</span>
        </div>
      </div>

      <ApprovalModal
        isOpen={approvalModalOpen}
        tokenApprovals={tokenApprovals}
        onApprovalComplete={handleApprovalComplete}
        onCancel={handleApprovalCancel}
      />
    </div>
  );
}