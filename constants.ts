
import { FilterMode, MarginMode, IndicatorConfig, AdvancedSettings, TradeSettings } from './types';

export const BINANCE_FUTURES_REST = 'https://fapi.binance.com';
export const BINANCE_FUTURES_WS = 'wss://fstream.binance.com/stream?streams=';

export const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];

export const DEFAULT_INDICATORS: IndicatorConfig = {
  ema20_50: true,
  ema200: false,
  rsi14: true,
  macd: true,
  adx14: false,
  atr14: true,
  volumeConfirmation: false,
  overextension: false,
  mtfConfirmation: false
};

export const DEFAULT_ADVANCED: AdvancedSettings = {
  thresholdScore: 60,
  adxMin: 18,
  volMult: 1.2,
  minVolPct: 0.25,
  extMult: 1.2,
  extPct: 1.0
};

export const DEFAULT_TRADE_SETTINGS: TradeSettings = {
  leverage: 10,
  marginMode: MarginMode.ISOLATED,
  marginPerTrade: 20,
  slMult: 1.6,
  tp1Mult: 1.5,
  tp2Mult: 2.6,
  useTP2: false,
  takeProfit50AtTP1: true,
  moveSLToEntryAtTP1: true,
  trailingStopATR: false,
  trailMult: 1.2,
  reverseOnSignal: false,
  entryMode: 'CLOSE',
  cooldownMin: 15,
  maxOpenTrades: 20,
  topKSignals: 10,
  useMarkPrice: true
};

export const PRESETS = {
  [FilterMode.EASY]: {
    indicators: { ...DEFAULT_INDICATORS, ema20_50: true, rsi14: true, macd: true, atr14: true },
    advanced: { ...DEFAULT_ADVANCED, thresholdScore: 60, minVolPct: 0.20 },
    leverage: 5
  },
  [FilterMode.NORMAL]: {
    indicators: { 
      ema20_50: true, ema200: true, rsi14: true, macd: true, 
      adx14: true, atr14: true, volumeConfirmation: true, 
      overextension: false, mtfConfirmation: false 
    },
    advanced: { ...DEFAULT_ADVANCED, thresholdScore: 70, adxMin: 18, volMult: 1.2, minVolPct: 0.30 },
    leverage: 10
  },
  [FilterMode.HARD]: {
    indicators: { 
      ema20_50: true, ema200: true, rsi14: true, macd: true, 
      adx14: true, atr14: true, volumeConfirmation: true, 
      overextension: true, mtfConfirmation: true 
    },
    advanced: { ...DEFAULT_ADVANCED, thresholdScore: 80, adxMin: 20, volMult: 1.35, minVolPct: 0.45 },
    leverage: 15
  }
};
