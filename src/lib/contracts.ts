export const CONTRACTS = {
    VAULT_ADDRESS: "0xe22a7dbf85b88f1c950b96923e29f0213121002f296c0572549f2a6a7e7fd6f5",
    APT_ADDRESS: "0x1::aptos_coin::AptosCoin",
    SETTLEMENT_ADDRESS: "0xe22a7dbf85b88f1c950b96923e29f0213121002f296c0572549f2a6a7e7fd6f5",
    USDT_ADDRESS: "0x1::coin::CoinStore<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT>",
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
    GET_BALANCE_USER: "get_balance_user",
    BALANCE_OF: "balance_of",
    TOTAL_SUPPLY: "total_supply",
    TOTAL_ASSETS: "total_assets",
    GET_SHARE_PRICE: "get_share_price",
    GET_AVAILABLE_ASSETS: "get_available_assets",
    MIN_DEPOSIT: "min_deposit",
    PAUSED: "paused",
    ASSET: "asset",
    PREVIEW_DEPOSIT: "preview_deposit",
    PREVIEW_REDEEM: "preview_redeem",
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

  export const COIN_FUNCTIONS = {
    BALANCE: "balance",
    TRANSFER: "transfer",
    DECIMALS: "decimals",
    SYMBOL: "symbol",
    NAME: "name",
  } as const;

  export const ERC20_ABI = [];