
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

  // Volume Filter (Clean Signal Confirmation)
  const volumes = klines.map(k => k.v);
  const avgVol = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  const currentVol = volumes[lastIdx];
  const volSpike = currentVol > avgVol * 1.5;
  
  if (!volSpike) {
    // Optional: Reduce score if no volume spike, or return null for "cleanest" signals
    // For now, let's just reduce score to ensure we only get high-conviction trades
    score -= 15;
  } else {
    score += 15;
    reasons.push('Bùng nổ khối lượng (Vol > 1.5x Avg)');
  }

  // EMA 20/50
  if (indicators.ema20_50) {
    const lEma20 = ema20[ema20.length - 1];
    const lEma50 = ema50[ema50.length - 1];
    const pEma20 = ema20[ema20.length - 2];
    const pEma50 = ema50[ema50.length - 2];

    // Crossover logic for cleaner entries
    const isCrossUp = pEma20 <= pEma50 && lEma20 > lEma50;
    const isCrossDown = pEma20 >= pEma50 && lEma20 < lEma50;

    if (lEma20 > lEma50) {
      score += isCrossUp ? 25 : 10; // Bonus for fresh crossover
      isShort = false;
      reasons.push(isCrossUp ? 'Giao cắt EMA20/50 (Mới)' : 'EMA20 > EMA50');
    } else {
      score += isCrossDown ? 25 : 10;
      isLong = false;
      reasons.push(isCrossDown ? 'Giao cắt EMA20/50 (Mới)' : 'EMA20 < EMA50');
    }
  }

  // EMA 200 (Hard Trend Filter)
  if (indicators.ema200) {
    const lEma200 = ema200[ema200.length - 1];
    if (currentPrice > lEma200) {
      score += 15;
      isShort = false; // Don't short above EMA200 for clean signals
      reasons.push('Giá > EMA200 (Trend Tăng)');
    } else {
      score += 15;
      isLong = false; // Don't long below EMA200
      reasons.push('Giá < EMA200 (Trend Giảm)');
    }
  }

  // RSI
  if (indicators.rsi14) {
    const lRsi = rsi[rsi.length - 1];
    const pRsi = rsi[rsi.length - 2];
    
    // Pullback/Momentum logic
    if (lRsi > 50 && lRsi > pRsi) {
      const isPullback = pRsi < 45 && lRsi >= 50; // RSI crossing up from neutral/oversold
      score += isPullback ? 20 : 10;
      isShort = false;
      reasons.push(isPullback ? 'RSI Pullback & Phá vỡ 50' : 'RSI > 50 & Đang tăng');
    } else if (lRsi < 50 && lRsi < pRsi) {
      const isPullback = pRsi > 55 && lRsi <= 50;
      score += isPullback ? 20 : 10;
      isLong = false;
      reasons.push(isPullback ? 'RSI Pullback & Phá vỡ 50' : 'RSI < 50 & Đang giảm');
    } else {
      isLong = false;
      isShort = false;
    }
  }

  // MACD
  if (indicators.macd) {
    const lHist = macdHist[macdHist.length - 1] || 0;
    const pHist = macdHist[macdHist.length - 2] || 0;
    const lMacd = macd[macd.length - 1] || 0;
    const lSignal = macdSignal[macdSignal.length - 1] || 0;
    const pMacd = macd[macd.length - 2] || 0;
    const pSignal = macdSignal[macdSignal.length - 2] || 0;

    const isCrossUp = pMacd <= pSignal && lMacd > lSignal;
    const isCrossDown = pMacd >= pSignal && lMacd < lSignal;

    if (lHist > 0) {
      score += isCrossUp ? 25 : 10;
      isShort = false;
      reasons.push(isCrossUp ? 'Giao cắt MACD (Mới)' : 'MACD Histogram Dương');
    } else if (lHist < 0) {
      score += isCrossDown ? 25 : 10;
      isLong = false;
      reasons.push(isCrossDown ? 'Giao cắt MACD (Mới)' : 'MACD Histogram Âm');
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
