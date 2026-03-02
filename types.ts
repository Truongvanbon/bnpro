
export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d';

export enum FilterMode {
  EASY = 'Dễ',
  NORMAL = 'Bình thường',
  HARD = 'Khó',
  CUSTOM = 'Tự chỉnh'
}

export enum MarginMode {
  ISOLATED = 'Isolated',
  CROSS = 'Cross'
}

export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export interface IndicatorConfig {
  ema20_50: boolean;
  ema200: boolean;
  rsi14: boolean;
  macd: boolean;
  adx14: boolean;
  atr14: boolean;
  volumeConfirmation: boolean;
  overextension: boolean;
  mtfConfirmation: boolean;
}

export interface AdvancedSettings {
  thresholdScore: number;
  adxMin: number;
  volMult: number;
  minVolPct: number;
  extMult: number;
  extPct: number;
}

export interface TradeSettings {
  leverage: number;
  marginMode: MarginMode;
  marginPerTrade: number;
  slMult: number;
  tp1Mult: number;
  tp2Mult: number;
  useTP2: boolean;
  takeProfit50AtTP1: boolean;
  moveSLToEntryAtTP1: boolean;
  trailingStopATR: boolean;
  trailMult: number;
  reverseOnSignal: boolean;
  entryMode: 'CLOSE' | 'NEXT_OPEN';
  cooldownMin: number;
  maxOpenTrades: number;
  topKSignals: number;
  useMarkPrice: boolean;
}

export interface Kline {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  x: boolean; // Closed
}

export interface CoinData {
  symbol: string;
  price: number;
  markPrice: number;
  volume24h: number;
  klines: Kline[];
  indicators?: any;
}

export interface Signal {
  id: string;
  symbol: string;
  side: PositionSide;
  entry: number;
  tp1: number;
  tp2: number;
  sl: number;
  score: number;
  timeframe: Timeframe;
  timestamp: number;
  reasons: string[];
}

export interface Order {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  currentPrice: number;
  tp1: number;
  tp2: number;
  sl: number;
  notional: number;
  leverage: number;
  pnlUsdt: number;
  pnlPct: number;
  status: 'OPEN' | 'CLOSED';
  closePrice?: number;
  closeReason?: 'TP1' | 'TP2' | 'SL' | 'MANUAL';
  openTime: number;
  closeTime?: number;
  timeframe: Timeframe;
  hitTP1: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastUpdate: number;
  scanningCount: number;
}
