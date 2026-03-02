
import { Kline } from '../types';

export const calculateEMA = (data: number[], period: number) => {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
};

export const calculateRSI = (data: number[], period: number = 14) => {
  if (data.length <= period) return [];
  const rsi = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi.push(100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    let gain = diff >= 0 ? diff : 0;
    let loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi.push(100 - 100 / (1 + avgGain / avgLoss));
  }
  return Array(period).fill(null).concat(rsi);
};

export const calculateMACD = (data: number[]) => {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  if (ema26.length < data.length) return { macd: [], signal: [], hist: [] };

  const macd = ema12.map((v, i) => v - ema26[i]);
  const signal = calculateEMA(macd.slice(25), 9);
  const fullSignal = Array(25 + 8).fill(null).concat(signal);
  const hist = macd.map((v, i) => (fullSignal[i] !== null ? v - fullSignal[i] : null));

  return { macd, signal: fullSignal, hist };
};

export const calculateATR = (klines: Kline[], period: number = 14) => {
  if (klines.length <= period) return [];
  const trs = klines.map((k, i) => {
    if (i === 0) return k.h - k.l;
    return Math.max(k.h - k.l, Math.abs(k.h - klines[i - 1].c), Math.abs(k.l - klines[i - 1].c));
  });

  const atr = [trs.slice(0, period).reduce((a, b) => a + b, 0) / period];
  for (let i = period; i < trs.length - 1; i++) {
    atr.push((atr[atr.length - 1] * (period - 1) + trs[i]) / period);
  }
  return Array(period).fill(null).concat(atr);
};

export const calculateADX = (klines: Kline[], period: number = 14) => {
  if (klines.length <= period * 2) return { adx: [], plusDI: [], minusDI: [] };
  
  const plusDM = klines.map((k, i) => {
    if (i === 0) return 0;
    const upMove = k.h - klines[i-1].h;
    const downMove = klines[i-1].l - k.l;
    return (upMove > downMove && upMove > 0) ? upMove : 0;
  });

  const minusDM = klines.map((k, i) => {
    if (i === 0) return 0;
    const upMove = k.h - klines[i-1].h;
    const downMove = klines[i-1].l - k.l;
    return (downMove > upMove && downMove > 0) ? downMove : 0;
  });

  const trs = klines.map((k, i) => {
    if (i === 0) return k.h - k.l;
    return Math.max(k.h - k.l, Math.abs(k.h - klines[i - 1].c), Math.abs(k.l - klines[i - 1].c));
  });

  const smooth = (data: number[]) => {
    const res = [data.slice(0, period).reduce((a, b) => a + b, 0)];
    for (let i = period; i < data.length; i++) {
      res.push(res[res.length - 1] - (res[res.length - 1] / period) + data[i]);
    }
    return res;
  };

  const str = smooth(trs);
  const spdm = smooth(plusDM);
  const smdm = smooth(minusDM);

  const plusDI = spdm.map((v, i) => 100 * v / str[i]);
  const minusDI = smdm.map((v, i) => 100 * v / str[i]);
  
  const dx = plusDI.map((v, i) => 100 * Math.abs(v - minusDI[i]) / (v + minusDI[i]));
  const adx = [dx.slice(0, period).reduce((a, b) => a + b, 0) / period];
  for (let i = period; i < dx.length; i++) {
    adx.push((adx[adx.length - 1] * (period - 1) + dx[i]) / period);
  }

  const offset = period * 2 - 1;
  return { 
    adx: Array(offset).fill(null).concat(adx), 
    plusDI: Array(period - 1).fill(null).concat(plusDI), 
    minusDI: Array(period - 1).fill(null).concat(minusDI) 
  };
};
