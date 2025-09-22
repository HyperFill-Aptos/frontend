import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { CONTRACTS, VAULT_FUNCTIONS, APT_FUNCTIONS, APTOS_TESTNET } from './contracts';

export class AptosClient {
  private client: Aptos;

  constructor(network: Network = Network.TESTNET) {
    const config = new AptosConfig({ network });
    this.client = new Aptos(config);
  }

  async getAccountBalance(accountAddress: string, coinType: string = CONTRACTS.APT_ADDRESS): Promise<string> {
    try {
      const resource = await this.client.getAccountResource({
        accountAddress,
        resourceType: `0x1::coin::CoinStore<${coinType}>`,
      });
      return (resource as any).coin.value;
    } catch (error) {
      console.error('Error getting account balance:', error);
      return '0';
    }
  }

  async getVaultBalance(accountAddress: string): Promise<string> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.GET_BALANCE_USER}`,
          arguments: [accountAddress],
        },
      });
      return result[0] as string;
    } catch (error) {
      console.error('Error getting vault balance:', error);
      return '0';
    }
  }

  async getUserShareBalance(accountAddress: string): Promise<string> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.GET_USER_SHARE_BALANCE}`,
          arguments: [accountAddress],
        },
      });
      return result[0] as string;
    } catch (error) {
      console.error('Error getting user share balance:', error);
      return '0';
    }
  }

  async getTotalAssets(): Promise<string> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.TOTAL_ASSETS}`,
          arguments: [],
        },
      });
      return result[0] as string;
    } catch (error) {
      console.error('Error getting total assets:', error);
      return '0';
    }
  }

  async getSharePrice(): Promise<string> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.GET_SHARE_PRICE}`,
          arguments: [],
        },
      });
      return result[0] as string;
    } catch (error) {
      console.error('Error getting share price:', error);
      return '0';
    }
  }

  async getAvailableAssets(): Promise<string> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.GET_AVAILABLE_ASSETS}`,
          arguments: [],
        },
      });
      return result[0] as string;
    } catch (error) {
      console.error('Error getting available assets:', error);
      return '0';
    }
  }

  async getMinDeposit(): Promise<string> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.MIN_DEPOSIT}`,
          arguments: [],
        },
      });
      return result[0] as string;
    } catch (error) {
      console.error('Error getting min deposit:', error);
      return '0';
    }
  }

  async isPaused(): Promise<boolean> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.PAUSED}`,
          arguments: [],
        },
      });
      return result[0] as boolean;
    } catch (error) {
      console.error('Error checking if paused:', error);
      return false;
    }
  }

  async previewDeposit(assets: string): Promise<string> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.PREVIEW_DEPOSIT}`,
          arguments: [assets],
        },
      });
      return result[0] as string;
    } catch (error) {
      console.error('Error previewing deposit:', error);
      return '0';
    }
  }

  async previewRedeem(shares: string): Promise<string> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.PREVIEW_REDEEM}`,
          arguments: [shares],
        },
      });
      return result[0] as string;
    } catch (error) {
      console.error('Error previewing redeem:', error);
      return '0';
    }
  }

  buildDepositTransaction(senderAddress: string, amount: string) {
    return {
      data: {
        function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.DEPOSIT_LIQUIDITY}`,
        arguments: [amount],
      },
    };
  }

  buildWithdrawTransaction(senderAddress: string) {
    return {
      data: {
        function: `${CONTRACTS.VAULT_ADDRESS}::${VAULT_FUNCTIONS.WITHDRAW_PROFITS}`,
        arguments: [],
      },
    };
  }

  async getTransactionHistory(accountAddress: string, limit: number = 25) {
    try {
      const transactions = await this.client.getAccountTransactions({
        accountAddress,
        options: { limit },
      });
      return transactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  formatAPT(amount: string | number, decimals: number = 8): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return (value / Math.pow(10, 8)).toFixed(decimals);
  }

  parseAPT(amount: string): string {
    return (parseFloat(amount) * Math.pow(10, 8)).toString();
  }
}

export const aptosClient = new AptosClient();