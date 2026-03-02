
import { Kline, PositionSide, Signal, IndicatorConfig, AdvancedSettings, Timeframe } from '../types';
import { calculateEMA, calculateRSI, calculateMACD, calculateATR, calculateADX } from './indicators';

export const evaluateSignal = (
  symbol: string,
  klines: Kline[],
  timeframe: Timeframe,
  indicators: IndicatorConfig,
  advanced: AdvancedSettings
): Signal | null => {
  if (klines.length < 200) return null;

  const closes = klines.map(k => k.c);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const rsi = calculateRSI(closes, 14);
  const { macd, signal: macdSignal, hist: macdHist } = calculateMACD(closes);
  const atr = calculateATR(klines, 14);
  const { adx, plusDI, minusDI } = calculateADX(klines, 14);
  
  const lastIdx = klines.length - 1;
  const currentPrice = closes[lastIdx];
  const lastKline = klines[lastIdx];
  const prevKline = klines[lastIdx - 1];
  
  let score = 40;
  const reasons: string[] = [];
  let isLong = true;
  let isShort = true;

  // EMA 20/50
  if (indicators.ema20_50) {
    const lEma20 = ema20[ema20.length - 1];
    const lEma50 = ema50[ema50.length - 1];
    if (lEma20 > lEma50) {
      score += 10;
      isShort = false;
      reasons.push('EMA20 > EMA50');
    } else {
      score += 10;
      isLong = false;
      reasons.push('EMA20 < EMA50');
    }
  }

  // EMA 200
  if (indicators.ema200) {
    const lEma200 = ema200[ema200.length - 1];
    if (currentPrice > lEma200) {
      score += 10;
      isShort = false;
      reasons.push('Giá > EMA200');
    } else {
      score += 10;
      isLong = false;
      reasons.push('Giá < EMA200');
    }
  }

  // RSI
  if (indicators.rsi14) {
    const lRsi = rsi[rsi.length - 1];
    const pRsi = rsi[rsi.length - 2];
    if (lRsi > 50 && lRsi > pRsi) {
      score += 10;
      isShort = false;
      reasons.push('RSI > 50 & Đang tăng');
    } else if (lRsi < 50 && lRsi < pRsi) {
      score += 10;
      isLong = false;
      reasons.push('RSI < 50 & Đang giảm');
    } else {
      isLong = false;
      isShort = false;
    }
  }

  // MACD
  if (indicators.macd) {
    const lHist = macdHist[macdHist.length - 1] || 0;
    const pHist = macdHist[macdHist.length - 2] || 0;
    if (lHist > 0) {
      score += (lHist > pHist) ? 15 : 5;
      isShort = false;
      reasons.push('MACD Histogram Dương');
    } else if (lHist < 0) {
      score += (lHist < pHist) ? 15 : 5;
      isLong = false;
      reasons.push('MACD Histogram Âm');
    }
  }

  // ADX
  if (indicators.adx14) {
    const lAdx = adx[adx.length - 1] || 0;
    const lPdi = plusDI[plusDI.length - 1] || 0;
    const lMdi = minusDI[minusDI.length - 1] || 0;
    if (lAdx < advanced.adxMin) {
      return null; // Side-way filter
    }
    if (lPdi > lMdi) {
      score += 10;
      isShort = false;
      reasons.push('ADX Trend Tăng (+DI > -DI)');
    } else {
      score += 10;
      isLong = false;
      reasons.push('ADX Trend Giảm (-DI > +DI)');
    }
  }

  // ATR Volatility
  const lastAtr = atr[atr.length - 1] || 0;
  const atrPct = (lastAtr / currentPrice) * 100;
  if (indicators.atr14) {
    if (atrPct < advanced.minVolPct) return null; // Low volatility filter
    score += (atrPct > advanced.minVolPct * 1.5) ? 10 : 0;
  }

  // Final Scoring
  if (score < advanced.thresholdScore) return null;

  const side = isLong ? PositionSide.LONG : (isShort ? PositionSide.SHORT : null);
  if (!side) return null;

  // Calculate Entry, TP, SL (Simple ATR Based)
  const entry = currentPrice;
  const slMult = 1.6;
  const tp1Mult = 1.5;
  const tp2Mult = 2.6;

  const sl = side === PositionSide.LONG ? entry - lastAtr * slMult : entry + lastAtr * slMult;
  const tp1 = side === PositionSide.LONG ? entry + lastAtr * tp1Mult : entry - lastAtr * tp1Mult;
  const tp2 = side === PositionSide.LONG ? entry + lastAtr * tp2Mult : entry - lastAtr * tp2Mult;

  return {
    id: `${symbol}-${timeframe}-${Date.now()}`,
    symbol,
    side,
    entry,
    tp1,
    tp2,
    sl,
    score,
    timeframe,
    timestamp: Date.now(),
    reasons
  };
};
