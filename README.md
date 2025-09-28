 # HyperMover Frontend

 ```
██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ ███╗   ███╗ ██████╗ ██╗   ██╗███████╗██████╗
██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗████╗ ████║██╔═══██╗██║   ██║██╔════╝██╔══██╗
███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝██╔████╔██║██║   ██║██║   ██║█████╗  ██████╔╝
██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗
██║  ██║   ██║   ██║     ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║
╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝

            First AI Market Making Vault on Aptos Network

```


A DeFi vault management and trading terminal built with React and TypeScript. The application is an interface for managing vault deposits/withdrawals and trading operations on Aptos through an AI system with multiple agents.

## Why Terminal Frontend?

The decision to implement a terminal interface stems from several technical and user experience considerations. Trading terminals in traditional finance have proven to be highly efficient for financial data consumption. The terminal aesthetic has:

1. **Information Density**: Terminal interfaces can display more data in less space, crucial for trading operations where users need to process multiple data streams simultaneously.

2. **Reduced Cognitive Load**: The monospace font and structured layout create predictable visual patterns, users can quickly scan for anomalies or opportunities.

3. **Professional Credibility**: Terminal interfaces signal technical sophistication and serious trading capabilities, building trust with professional users.

4. **Performance Optimization**: Terminal layouts typically require fewer DOM manipulations and can be optimized for updates without visual flickering.

5. **Accessibility**: The high contrast and structured layout improve readability for users with visual impairments or those working in low- ight conditions.

## System Architecture

### Architecture Layer

HyperMover follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │VaultDashboard│ │TradingTerminal│ │   WalletConnect  │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │  useVault   │ │ useWallet   │ │   useToast          │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │  Ethers.js  │ │  HPF API   │ │   Local Storage     │     │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │   SEI Chain │ │  MetaMask   │ │   Vite Build        │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Architecture

The application implements a unidirectional data flow pattern:

1. **User**: User interacts with UI component
2. **Event**: Component calls hook method
3. **Hook**: Hook processes request and calls blockchain
4. **Blockchain**: Contract returns transaction result
5. **AI Update**: AI updates local state
6. **Re-render**: Component re-renders with new data

### Communication Pattern

Components communicate through a combination of props, context and hooks:

```typescript
// Parent component passes data down
<VaultDashboard />

// Child components use hooks for data access
const { stats, loading, deposit, withdraw } = useVault();

// Hooks manage state and provide methods
const useVault = () => {
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  const deposit = useCallback(async (amount: string) => {
    // Implementation
  }, []);
  
  return { stats, loading, deposit, withdraw };
};
```

## AI Trading System Architecture

### Trading System

HyperMover implements AI trading system with four specialized agents, each modeled after legendary traders:

#### 1. Buffett Agent (Analyst)
- **Role**: Market analysis & long-term value assessment
- **Status**: Continuously analyzing fundamentals across markets
- **Performance**: 94.2% accuracy in value identification
- **Personality**: Patient value investor who sees what others miss
- **Current Task**: Analyzing fundamentals across 12 markets

#### 2. Belfort Agent (Pricing)
- **Role**: Aggressive price optimization & profit maximization
- **Status**: Processing profit calculations and price targets
- **Performance**: 18.7% average profit per trade
- **Personality**: Wolf of Wall Street - ruthless profit hunter
- **Current Task**: Calculating maximum profit entry at $0.2448

#### 3. Lynch Agent (Executive)
- **Role**: Lightning-fast trade execution & market timing
- **Status**: Executing trades with minimal latency
- **Performance**: 47ms average execution latency
- **Personality**: Legendary stock picker with perfect timing
- **Current Task**: Executing BUY order: 150 SEI @ $0.2451

#### 4. Dalio Agent (Inventory)
- **Role**: Risk management & systematic portfolio balance
- **Status**: Monitoring portfolio risk and rebalancing
- **Performance**: 1.84 Sharpe ratio
- **Personality**: Principles-based risk master who protects capital
- **Current Task**: Portfolio balanced: 67% long, 33% reserves

### Agent Coordination System

The agents operate in a coordinated manner:
- **Communication**: Live agent chatter displayed in terminal log
- **Performance**: Continuous monitoring of success rates and decision accuracy
- **Synchronization**: Optimal coordination status with 89.3% success rate
- **Tracking**: 1,247 decisions made today with live updates

## Components Architecture

### VaultDashboard Component

The `VaultDashboard` component implements a state machine pattern for managing deposit and withdrawal operations. It uses React's `useState` and `useCallback` hooks to maintain local state while delegating blockchain operations to the `useVault` hook.

```typescript
const [depositAmount, setDepositAmount] = useState('');
const [isDepositing, setIsDepositing] = useState(false);
const [isWithdrawing, setIsWithdrawing] = useState(false);
```

The component implements input validation before blockchain calls, checking minimum deposit requirements and user balance constraints. This prevents unnecessary gas consumption and provides immediate user feedback.

Statistics are fetched through the `useVault` hook, which implements a polling mechanism to keep vault data current. The hook uses `useEffect` with cleanup functions to prevent memory leaks during component unmounting.

### TradingTerminal Component

The `TradingTerminal` component implements an architecture where each section (market stats, agent status, vault interface) operates independently. This modular design allows for easy feature additions and testing.

The terminal header includes network validation logic that automatically detects incorrect network configurations and provides one-click switching to SEI testnet. This prevents user frustration and reduces support requests.

```typescript
{isConnected && !isOnSeiTestnet && (
  <Button
    onClick={switchToSeiTestnet}
    variant="destructive"
    size="sm"
    className="flex items-center gap-2 font-mono text-xs"
  >
    <AlertTriangle className="h-4 w-4" />
    WRONG_NETWORK
  </Button>
)}
```

The ASCII art header serves both aesthetic and functional purposes. It provides visual branding while maintaining the terminal aesthetic, and the monospace font ensures consistent rendering across different screen sizes.

### WalletConnect Component

The `WalletConnect` component implements a state machine for wallet connection lifecycle management. It handles connection states, network validation, and user feedback through a combination of React state and blockchain event listeners.

Network switching logic automatically detects when users are on incorrect networks and provides contextual actions. The component uses the `useWallet` hook to maintain connection state across component re-renders.

### VaultInterface Component

The `VaultInterface` component provides an integrated vault management interface within the trading terminal. It features:

- **Real-time Vault Statistics**: TVL, APY, share values, and user balances
- **Transaction Interface**: Seamless deposit/withdrawal operations
- **Fee Structure Display**: Management fees (2%), withdrawal fees (0.1%), gas optimization
- **Approval Management**: Automatic WSEI token approval handling
- **Status Monitoring**: Live vault status (TRADING/PAUSED/OFFLINE)

### AgentStatusPanel Component

The `AgentStatusPanel` displays real-time status of all AI trading agents:

- **Live Status Updates**: Real-time agent activity monitoring
- **Performance Metrics**: Individual agent performance tracking
- **Task Visualization**: Current tasks and decision processes
- **Team Coordination**: Overall system performance and success rates
- **Animated Indicators**: Visual status indicators with terminal aesthetics

### TerminalLog Component

The `TerminalLog` provides a live feed of agent communications:

- **Logging**: Live agent chatter and system messages
- **Levels**: Info, success, warning, and error categorization
- **Timestamp**: Precise timing of all activities
- **Scrollable**: Historical log viewing with smooth scrolling
- **Auto-refresh**: Updates every 8 seconds

### MarketStats Component

The `MarketStats` component displays comprehensive market information:

- **SEI Price**: Current price, 24h change, volume, market cap
- **Trading**: Active positions, win rate, daily PnL, Sharpe ratio
- **Market**: Bull/Bear market indicators
- **Updates**: Live market data with terminal styling

## Smart Contract Integration Strategy

Contract integration follows a layered abstraction pattern. The `contracts.ts` file defines contract addresses and ABIs, while the `useVault` hook provides a clean API for contract interactions.

```typescript
const vaultContract = new ethers.Contract(
  CONTRACTS.VAULT_ADDRESS,
  VAULT_ABI,
  signer
);
```

The vault contract implements a share liquidity system where users deposit WSEI tokens and receive vault shares proportional to their contribution. Share price calculation happens on-chain for accuracy and to prevent manipulation.

Withdrawal operations use a preview function to calculate expected returns before execution, allowing users to make informed decisions about their liquidity positions.

## UI Component Library

HyperMover includes a complete set of UI components built on shadcn/ui and Radix UI:

### Core Components
- **Form Components**: Input, Label, Textarea, Select, Checkbox, Radio Group
- **Layout Components**: Card, Separator, Scroll Area, Aspect Ratio
- **Interactive Components**: Button, Badge, Toggle, Switch, Slider
- **Navigation Components**: Tabs, Breadcrumb, Navigation Menu, Sidebar
- **Feedback Components**: Toast, Alert, Progress, Skeleton, Tooltip

### Advanced Components
- **Data Display**: Table, Chart, Carousel, Accordion
- **Overlay Components**: Dialog, Sheet, Drawer, Popover, Hover Card
- **Input Components**: Input OTP, Command, Context Menu, Menubar
- **Utility Components**: Resizable panels, Collapsible sections

## How to Use HyperMover

### Getting Started

#### 1. Prerequisites
- **Web3 Wallet**: MetaMask or compatible wallet extension
- **SEI Testnet**: Access to SEI testnet (Chain ID: 1328)
- **Testnet Tokens**: Some SEI testnet tokens for gas fees

#### 2. Network Configuration
1. Open MetaMask and click the network dropdown
2. Select "Add Network" or "Custom RPC"
3. Enter the following details:
   - **Network Name**: SEI Testnet
   - **RPC URL**: `https://evm-rpc-testnet.sei-apis.com`
   - **Chain ID**: `1328`
   - **Currency Symbol**: SEI
   - **Block Explorer**: `https://seitrace.com`

#### 3. Accessing HyperMover
1. Navigate to the HyperMover application
2. Click "Connect Wallet" in the top-right corner
3. Approve the connection in MetaMask
4. Ensure you're connected to SEI Testnet

### Vault Operations

#### Depositing WSEI Tokens

1. **Navigate to Vault Dashboard**
   - Click the "Vault Dashboard" tab
   - View your current balance and vault statistics

2. **Prepare for Deposit**
   - Ensure you have sufficient WSEI tokens
   - Check the minimum deposit requirement
   - Verify your wallet is connected to SEI testnet

3. **Execute Deposit**
   - Enter the amount of WSEI you want to deposit
   - Click "Deposit WSEI"
   - Approve the transaction in MetaMask
   - Wait for confirmation

4. **Check Results**
   - View your updated share balance
   - Check the transaction hash in the block explorer
   - Monitor your vault position

#### Withdrawing Assets

1. **Check Withdrawal Eligibility**
   - Verify you have vault shares
   - Check available withdrawal amount
   - Review current share price

2. **Execute Withdrawal**
   - Click "Withdraw All" (full withdrawal)
   - Approve the transaction in MetaMask
   - Wait for confirmation

3. **Receive Assets**
   - WSEI tokens are returned to your wallet
   - Shares are burned proportionally
   - Transaction appears in your wallet history

## Development Workflow

The development environment uses several tools to maintain code quality and development velocity:

- **ESLint 9.32.0**: Enforces consistent coding standards and catches common errors
- **TypeScript 5.8.3**: Provides compile-time error checking and improved developer experience
- **Vite**: Fast development server with hot module replacement
- **Component Tagging**: Development-time component identification for easier debugging
- **React Query**: Server state management and caching
- **React Router**: Client-side routing with 404 handling

## Testing Strategy

While the current implementation focuses on functionality, the architecture supports comprehensive testing:

- **Hook Testing**: Custom hooks can be tested independently using React Testing Library
- **Component Testing**: Components are designed with clear interfaces for easy testing
- **Contract Mocking**: The abstraction layer allows for easy contract interaction mocking
- **Integration Testing**: The modular architecture supports end-to-end testing scenarios
- **AI Agent Testing**: Agent logic can be tested independently of UI components


## Deployment Considerations

Production deployment uses Vite's build optimization features:

- **Code Splitting**: Automatic route-based code splitting reduces initial bundle size
- **Tree Shaking**: Unused code is automatically removed from production builds
- **Asset Optimization**: Images and other assets are optimized for web delivery
- **Environment Configuration**: Build-time environment variable injection for different deployment targets
- **CDN Compatibility**: Static site deployment for optimal global performance
- **Edge Computing**: Support for edge computing platforms and serverless functions

