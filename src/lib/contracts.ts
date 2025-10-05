export const CONTRACTS = {
    VAULT_ADDRESS: "0xf1eb6be05ac996cd9ec68bbcfd68f8881fe37cadf68eae3cf68567104d0689f8",
    MOCK_TOKEN_ADDRESS: "0xf1eb6be05ac996cd9ec68bbcfd68f8881fe37cadf68eae3cf68567104d0689f8::APTToken::AptToken",
    APT_ADDRESS: "0xf1eb6be05ac996cd9ec68bbcfd68f8881fe37cadf68eae3cf68567104d0689f8::APTToken::AptToken",
    SETTLEMENT_ADDRESS: "0xf1eb6be05ac996cd9ec68bbcfd68f8881fe37cadf68eae3cf68567104d0689f8",
    ORDERBOOK_ADDRESS: "0xf1eb6be05ac996cd9ec68bbcfd68f8881fe37cadf68eae3cf68567104d0689f8",
    USDT_ADDRESS: "0xf1eb6be05ac996cd9ec68bbcfd68f8881fe37cadf68eae3cf68567104d0689f8::USDTToken::USDTToken",
  } as const;


  export const APTOS_TESTNET = {
    name: "Aptos Testnet",
    chainId: 2,
    url: "https://api.testnet.aptoslabs.com/v1",
    faucetUrl: "https://faucet.testnet.aptoslabs.com",
    explorerUrl: "https://explorer.aptoslabs.com/?network=testnet",
  } as const;

  export const APTOS_MAINNET = {
    name: "Aptos Mainnet",
    chainId: 1,
    url: "https://fullnode.mainnet.aptoslabs.com/v1",
    explorerUrl: "https://explorer.aptoslabs.com/?network=mainnet",
  } as const;

  export const VAULT_FUNCTIONS = {
    DEPOSIT_LIQUIDITY: "deposit_liquidity",
    WITHDRAW_PROFITS: "withdraw_profits",
    GET_USER_SHARE_BALANCE: "get_user_share_balance",
    GET_VAULT_STATE: "get_vault_state",
    GET_SHARE_PRICE: "get_share_price",
    GET_AVAILABLE_ASSETS: "get_available_assets",
    GET_MIN_DEPOSIT: "get_min_deposit",
    IS_PAUSED: "is_paused",
    GET_USER_PROFITS: "get_user_profits",
    GET_USER_TOTAL_DEPOSITED: "get_user_total_deposited",
    MOVE_FROM_VAULT_TO_WALLET: "move_from_vault_to_wallet",
    MOVE_FROM_WALLET_TO_VAULT: "move_from_wallet_to_vault",
  } as const;

  export const ORDERBOOK_FUNCTIONS = {
    CREATE_MARKET: "create_market_entry",
    PLACE_LIMIT_ORDER: "place_limit_order_entry",
    CANCEL_ORDER: "cancel_order_entry",
    GET_MARKET_INFO: "get_market_info",
    GET_BEST_BID_ASK: "get_best_bid_ask",
    GET_ORDER_BOOK_DEPTH: "get_order_book_depth",
    GET_USER_ORDERS: "get_user_orders",
    GET_MARKET_STATS: "get_market_stats",
  } as const;

  // On-chain orderbook deployment for testnet
  export const ORDERBOOK_ADDRESS = CONTRACTS.ORDERBOOK_ADDRESS;
  export const ORDERBOOK_MODULE = `${ORDERBOOK_ADDRESS}::orderbook` as const;
  export const ORDERBOOK_MARKET_OWNER = ORDERBOOK_ADDRESS;

  // Coin types used for markets
  export const COIN_TYPES = {
    APT: CONTRACTS.APT_ADDRESS,
    USDT: CONTRACTS.USDT_ADDRESS,
    USDC: CONTRACTS.USDT_ADDRESS,
  } as const;

  export const VAULT_EVENTS = {
    LIQUIDITY_ADDED: "LiquidityAdded",
    LIQUIDITY_REMOVED: "LiquidityRemoved",
  } as const;

  export const APT_FUNCTIONS = {
    BALANCE: "balance",
    TRANSFER: "transfer",
    DECIMALS: "decimals",
    SYMBOL: "symbol",
    NAME: "name",
  } as const;

  export const MOCK_TOKEN_FUNCTIONS = {
    GET_BALANCE: "get_balance",
    TRANSFER: "transfer",
    DECIMALS: "decimals",
    SYMBOL: "symbol",
    NAME: "name",
    TOTAL_SUPPLY: "total_supply",
    IS_REGISTERED: "is_registered",
    REGISTER: "register",
    FAUCET: "faucet",
  } as const;

  export const COIN_FUNCTIONS = {
    BALANCE: "balance",
    TRANSFER: "transfer",
    DECIMALS: "decimals",
    SYMBOL: "symbol",
    NAME: "name",
  } as const;

  export const ERC20_ABI = [];