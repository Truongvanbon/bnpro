
import { BINANCE_FUTURES_REST, BINANCE_FUTURES_WS } from '../constants';
import { Timeframe, Kline } from '../types';

export const fetchTopCoins = async (limit: number = 100) => {
  try {
    const response = await fetch(`${BINANCE_FUTURES_REST}/fapi/v1/ticker/24hr`);
    const data = await response.json();
    return data
      .filter((item: any) => item.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit)
      .map((item: any) => item.symbol);
  } catch (error) {
    console.error('Error fetching top coins:', error);
    return [];
  }
};

export const fetchKlines = async (symbol: string, interval: Timeframe, limit: number = 500): Promise<Kline[]> => {
  try {
    const response = await fetch(`${BINANCE_FUTURES_REST}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await response.json();
    return data.map((d: any) => ({
      t: d[0],
      o: parseFloat(d[1]),
      h: parseFloat(d[2]),
      l: parseFloat(d[3]),
      c: parseFloat(d[4]),
      v: parseFloat(d[5]),
      x: true
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return [];
  }
};

export const connectScannerWS = (symbols: string[], interval: Timeframe, onMessage: (msg: any) => void) => {
  const streams = symbols.map(s => `${s.toLowerCase()}@kline_${interval}`).join('/');
  const ws = new WebSocket(`${BINANCE_FUTURES_WS}${streams}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  return ws;
};

export const connectMarkPriceWS = (symbols: string[], onMessage: (msg: any) => void) => {
  const streams = symbols.map(s => `${s.toLowerCase()}@markPrice@1s`).join('/');
  const ws = new WebSocket(`${BINANCE_FUTURES_WS}${streams}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  return ws;
};

export const connectTickerWS = (symbols: string[], onMessage: (msg: any) => void) => {
  const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
  const ws = new WebSocket(`${BINANCE_FUTURES_WS}${streams}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  return ws;
};
