import { useCallback, useMemo, useState } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { ORDERBOOK_MODULE, COIN_TYPES } from '@/lib/contracts';
import { useWallet } from '@/hooks/useWallet';

export interface DepthLevel {
  price: number;
  size: number;
}

export interface OrderbookDepth {
  bids: DepthLevel[];
  asks: DepthLevel[];
}

export const useOrderbook = (marketOwner: string, baseType: string, quoteType: string) => {
  const [loading, setLoading] = useState(false);
  const [orderbook, setOrderbook] = useState<OrderbookDepth>({ bids: [], asks: [] });

  const client = useMemo(() => new Aptos(new AptosConfig({ network: Network.TESTNET })), []);
  const { signAndSubmitTransaction, account } = useWallet();

  const marketAddress = marketOwner;

  const fetchDepth = useCallback(async (levels: number = 10) => {
    setLoading(true);
    try {
      const res = await client.view({
        payload: {
          function: `${ORDERBOOK_MODULE}::get_order_book_depth`,
          typeArguments: [baseType, quoteType],
          functionArguments: [marketAddress, String(levels)],
        }
      });

      // Contract returns: [bid_prices, bid_sizes, ask_prices, ask_sizes]
      const [bidPrices, bidSizes, askPrices, askSizes] = res as [string[], string[], string[], string[]];
      const PRICE_DECIMALS = 2;
      const scaleDown = (v: string) => Number(v) / Math.pow(10, PRICE_DECIMALS);
      const bids: DepthLevel[] = (bidPrices || []).map((p, i) => ({ price: scaleDown(p), size: Number(bidSizes?.[i] || 0) }));
      const asks: DepthLevel[] = (askPrices || []).map((p, i) => ({ price: scaleDown(p), size: Number(askSizes?.[i] || 0) }));

      setOrderbook({ bids, asks });
      return { bids, asks };
    } finally {
      setLoading(false);
    }
  }, [client, marketAddress, baseType, quoteType]);

  const placeLimitOrder = useCallback(async (params: {
    side: 'bid' | 'ask';
    price: string | number;
    size: string | number;
    restriction?: 'none' | 'post_only' | 'ioc' | 'fok';
  }) => {
    if (!signAndSubmitTransaction || !account) throw new Error('Wallet not connected');
    const sideBool = params.side === 'ask';
    const restrictionMap = {
      none: 0,
      post_only: 3,
      ioc: 2,
      fok: 1,
    } as const;
    const r = restrictionMap[params.restriction || 'none'];

    // Scale price to integer ticks (2 decimals)
    const PRICE_DECIMALS = 2;
    const priceNum = Number(params.price);
    const sizeNum = Number(params.size);
    if (!Number.isFinite(priceNum) || priceNum <= 0) throw new Error('Invalid price');
    if (!Number.isFinite(sizeNum) || sizeNum <= 0) throw new Error('Invalid size');
    const scaledPrice = Math.round(priceNum * Math.pow(10, PRICE_DECIMALS));
    const scaledSize = Math.trunc(sizeNum); // size expected as integer units

    const payload = {
      function: `${ORDERBOOK_MODULE}::place_limit_order_entry`,
      type_arguments: [baseType, quoteType],
      arguments: [marketAddress, sideBool, String(scaledPrice), String(scaledSize), String(r)],
    };

    console.log(payload, "ZAKWAIAI");

    const resp = await signAndSubmitTransaction(payload);
    return resp;
  }, [signAndSubmitTransaction, account, marketAddress, baseType, quoteType]);

  const cancelOrder = useCallback(async (params: { orderId: string | number; side: 'bid' | 'ask'; price: string | number; }) => {
    if (!signAndSubmitTransaction || !account) throw new Error('Wallet not connected');
    const sideBool = params.side === 'ask';
    const PRICE_DECIMALS = 2;
    const priceNum = Number(params.price);
    if (!Number.isFinite(priceNum)) throw new Error('Invalid price');
    const scaledPrice = Math.round(priceNum * Math.pow(10, PRICE_DECIMALS));
    const payload = {
      function: `${ORDERBOOK_MODULE}::cancel_order_entry`,
      type_arguments: [baseType, quoteType],
      arguments: [marketAddress, String(params.orderId), sideBool, String(scaledPrice)],
    };
    const resp = await signAndSubmitTransaction(payload);
    return resp;
  }, [signAndSubmitTransaction, account, marketAddress, baseType, quoteType]);

  return {
    loading,
    orderbook,
    fetchDepth,
    COIN_TYPES,
    placeLimitOrder,
    cancelOrder,
  };
};


