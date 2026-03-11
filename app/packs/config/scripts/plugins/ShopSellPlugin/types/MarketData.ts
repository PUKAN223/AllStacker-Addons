interface MarketConfig {
  lastEconomySync: number;
  lastStockIncreaseSync: number;
  scoreboard: string;
  name: string;
}

interface MarketItem {
  itemId: string;
  itemName: string;
  price: number;
  defaultPrice: number;
  minPrice: number;
  maxPrice: number;
  icon: string;
  stock: number;
  canPlacedOn?: string[];
  canDestroyedOn?: string[];
  multiplier: string;
  enchantments: { type: string; level: number }[];
}

export enum TransactionType {
  Buy,
  Sell,
}

interface MarketTransaction {
  player: string;
  transactionType: TransactionType;
  itemId: string;
  quantity: number;
  totalPrice: number;
  date: string;
  timestamp: number;
}

interface MarketData {
  items: MarketItem[];
  history: MarketTransaction[];
  config: MarketConfig;
}

interface MarketNPCData {
  [marketId: string]: MarketData;
}

export type {
  MarketConfig,
  MarketData,
  MarketItem,
  MarketNPCData,
  MarketTransaction,
};
