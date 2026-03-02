
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Timeframe, FilterMode, MarginMode, PositionSide, IndicatorConfig, 
  AdvancedSettings, TradeSettings, Order, Signal, ConnectionStatus, CoinData,
  // Fix: Added Kline to the imports from ./types
  Kline 
} from './types';
import { 
  DEFAULT_INDICATORS, DEFAULT_ADVANCED, DEFAULT_TRADE_SETTINGS, 
  TIMEFRAMES, PRESETS 
} from './constants';
import { fetchTopCoins, fetchKlines, connectScannerWS, connectTickerWS } from './services/binance';
import { evaluateSignal } from './services/signalEngine';

// Components
import ScannerTab from './components/ScannerTab';
import OrdersTab from './components/OrdersTab';
import HistoryTab from './components/HistoryTab';
import SettingsTab from './components/SettingsTab';
import Header from './components/Header';
import Notification from './components/Notification';
import ChartModal from './components/ChartModal';

const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'scanner' | 'orders' | 'history' | 'settings'>('scanner');
  
  // Configuration
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [coinCount, setCoinCount] = useState<number>(50);
  const [filterMode, setFilterMode] = useState<FilterMode>(FilterMode.NORMAL);
  const [indicators, setIndicators] = useState<IndicatorConfig>(DEFAULT_INDICATORS);
  const [advanced, setAdvanced] = useState<AdvancedSettings>(DEFAULT_ADVANCED);
  const [tradeSettings, setTradeSettings] = useState<TradeSettings>(DEFAULT_TRADE_SETTINGS);
  
  // App State
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    lastUpdate: Date.now(),
    scanningCount: 0
  });
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedCoinForChart, setSelectedCoinForChart] = useState<string | null>(null);

  // Data refs for engine
  const coinDataMap = useRef<Map<string, CoinData>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const priceWsRef = useRef<WebSocket | null>(null);
  const lastSignalTime = useRef<Map<string, number>>(new Map());

  // Initialization
  useEffect(() => {
    // Sync presets when filterMode changes
    if (filterMode !== FilterMode.CUSTOM) {
      const preset = (PRESETS as any)[filterMode];
      if (preset) {
        setIndicators(preset.indicators);
        setAdvanced(preset.advanced);
        setTradeSettings(prev => ({ ...prev, leverage: preset.leverage }));
      }
    }
  }, [filterMode]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleOpenOrder = useCallback((signal: Signal) => {
    // Spam check
    const lastTime = lastSignalTime.current.get(signal.symbol) || 0;
    if (Date.now() - lastTime < tradeSettings.cooldownMin * 60000) return;
    if (openOrders.length >= tradeSettings.maxOpenTrades) return;
    if (openOrders.some(o => o.symbol === signal.symbol && o.timeframe === signal.timeframe)) return;

    // Calculate fixed TP/SL based on PnL % (20% TP, 60% SL of margin)
    // pnlPctROE = pnlPctPrice * leverage
    // 20% = pnlPctPrice * leverage => pnlPctPrice = 0.20 / leverage
    const tpPct = 0.20 / tradeSettings.leverage;
    const slPct = 0.60 / tradeSettings.leverage;

    const isLong = signal.side === PositionSide.LONG;
    const entryPrice = signal.entry;
    
    const tp1 = isLong ? entryPrice * (1 + tpPct) : entryPrice * (1 - tpPct);
    const sl = isLong ? entryPrice * (1 - slPct) : entryPrice * (1 + slPct);

    const newOrder: Order = {
      id: signal.id,
      symbol: signal.symbol,
      side: signal.side,
      entryPrice: entryPrice,
      currentPrice: entryPrice,
      tp1: tp1,
      tp2: tp1, // Same as tp1 for now as user only mentioned one TP
      sl: sl,
      leverage: tradeSettings.leverage,
      notional: tradeSettings.marginPerTrade * tradeSettings.leverage,
      pnlUsdt: 0,
      pnlPct: 0,
      status: 'OPEN',
      openTime: Date.now(),
      timeframe: signal.timeframe,
      hitTP1: false
    };

    setOpenOrders(prev => [...prev, newOrder]);
    lastSignalTime.current.set(signal.symbol, Date.now());
    addNotification(`Lệnh mới: ${signal.symbol}`, `${signal.side} @ ${signal.entry}`, 'success');
  }, [tradeSettings, openOrders.length]);

  const handleCloseOrder = useCallback((id: string, reason: 'TP1' | 'TP2' | 'SL' | 'MANUAL', closePrice: number) => {
    setOpenOrders(prev => {
      const order = prev.find(o => o.id === id);
      if (!order) return prev;

      const closedOrder: Order = {
        ...order,
        status: 'CLOSED',
        closePrice,
        closeReason: reason,
        closeTime: Date.now()
      };

      setHistory(h => [closedOrder, ...h]);
      addNotification(`Đã đóng lệnh ${order.symbol}`, `${reason} @ ${closePrice}`, reason === 'SL' ? 'error' : 'success');
      return prev.filter(o => o.id !== id);
    });
  }, []);

  const updateOrderPrices = useCallback((symbol: string, price: number) => {
    setOpenOrders(prev => prev.map(order => {
      if (order.symbol !== symbol) return order;

      const isLong = order.side === PositionSide.LONG;
      const pnlPct = isLong ? (price - order.entryPrice) / order.entryPrice : (order.entryPrice - price) / order.entryPrice;
      const pnlUsdt = order.notional * pnlPct;

      // Trigger logic
      if (isLong) {
        if (price <= order.sl) {
          setTimeout(() => handleCloseOrder(order.id, 'SL', price), 0);
        } else if (price >= order.tp1 && !order.hitTP1) {
          if (tradeSettings.takeProfit50AtTP1) {
            // Semi-close logic could go here, for simplicity we just track hitTP1
          }
          if (tradeSettings.moveSLToEntryAtTP1) {
            order.sl = order.entryPrice;
          }
          order.hitTP1 = true;
          if (!tradeSettings.useTP2) setTimeout(() => handleCloseOrder(order.id, 'TP1', price), 0);
        } else if (tradeSettings.useTP2 && price >= order.tp2) {
          setTimeout(() => handleCloseOrder(order.id, 'TP2', price), 0);
        }
      } else {
        if (price >= order.sl) {
          setTimeout(() => handleCloseOrder(order.id, 'SL', price), 0);
        } else if (price <= order.tp1 && !order.hitTP1) {
          if (tradeSettings.moveSLToEntryAtTP1) {
            order.sl = order.entryPrice;
          }
          order.hitTP1 = true;
          if (!tradeSettings.useTP2) setTimeout(() => handleCloseOrder(order.id, 'TP1', price), 0);
        } else if (tradeSettings.useTP2 && price <= order.tp2) {
          setTimeout(() => handleCloseOrder(order.id, 'TP2', price), 0);
        }
      }

      return { ...order, currentPrice: price, pnlUsdt, pnlPct: pnlPct * 100 * order.leverage };
    }));
  }, [handleCloseOrder, tradeSettings]);

  const startScanner = async () => {
    setIsScanning(true);
    setStatus(prev => ({ ...prev, reconnecting: true }));
    
    const symbols = await fetchTopCoins(coinCount);
    setStatus(prev => ({ ...prev, scanningCount: symbols.length, connected: true, reconnecting: false }));

    // Fetch initial klines
    for (const symbol of symbols) {
      const klines = await fetchKlines(symbol, timeframe);
      coinDataMap.current.set(symbol, { symbol, price: 0, markPrice: 0, volume24h: 0, klines });
    }

    // Connect WebSocket
    wsRef.current = connectScannerWS(symbols, timeframe, (msg) => {
      const { s: symbol, k } = msg.data || msg;
      if (!k) return;

      const data = coinDataMap.current.get(symbol);
      if (!data) return;

      const newKline: Kline = {
        t: k.t, o: parseFloat(k.o), h: parseFloat(k.h), l: parseFloat(k.l), c: parseFloat(k.c), v: parseFloat(k.v), x: k.x
      };

      // Update klines cache
      const updatedKlines = [...data.klines];
      if (updatedKlines[updatedKlines.length - 1].t === newKline.t) {
        updatedKlines[updatedKlines.length - 1] = newKline;
      } else {
        updatedKlines.push(newKline);
        if (updatedKlines.length > 500) updatedKlines.shift();
      }
      data.klines = updatedKlines;
      data.price = newKline.c;

      // Update scanner UI status
      setStatus(prev => ({ ...prev, lastUpdate: Date.now() }));

      // Evaluate on candle close
      if (newKline.x) {
        const signal = evaluateSignal(symbol, updatedKlines, timeframe, indicators, advanced);
        if (signal) {
          handleOpenOrder(signal);
        }
      }
    });

    // Connect Price WebSocket for open orders tracking
    priceWsRef.current = connectTickerWS(symbols, (msg) => {
      const data = msg.data || msg;
      const symbol = data.s;
      const price = data.c; // Last price in ticker stream
      if (symbol && price) {
        updateOrderPrices(symbol, parseFloat(price));
      }
    });
  };

  const stopScanner = () => {
    setIsScanning(false);
    wsRef.current?.close();
    priceWsRef.current?.close();
    setStatus(prev => ({ ...prev, connected: false, scanningCount: 0 }));
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header 
        status={status} 
        isScanning={isScanning} 
        onStart={startScanner} 
        onStop={stopScanner} 
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 pt-4">
        {activeTab === 'scanner' && (
          <ScannerTab 
            timeframe={timeframe} setTimeframe={setTimeframe}
            coinCount={coinCount} setCoinCount={setCoinCount}
            filterMode={filterMode} setFilterMode={setFilterMode}
            indicators={indicators} setIndicators={setIndicators}
            advanced={advanced} setAdvanced={setAdvanced}
            isScanning={isScanning}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab 
            orders={openOrders} 
            onCloseOrder={(id, price) => handleCloseOrder(id, 'MANUAL', price)} 
            onShowChart={(symbol) => setSelectedCoinForChart(symbol)}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab history={history} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab settings={tradeSettings} setSettings={setTradeSettings} />
        )}
      </div>

      {/* Persistent Bottom Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-binance-gray border-t border-binance-gray flex justify-around items-center h-16 z-50">
        <button onClick={() => setActiveTab('scanner')} className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'scanner' ? 'text-yellow-500' : 'text-gray-400'}`}>
          <i className="fas fa-search-dollar text-xl mb-1"></i>
          <span className="text-xs">Quét</span>
        </button>
        <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center flex-1 py-2 relative ${activeTab === 'orders' ? 'text-yellow-500' : 'text-gray-400'}`}>
          <i className="fas fa-list-ul text-xl mb-1"></i>
          <span className="text-xs">Lệnh ({openOrders.length})</span>
          {openOrders.length > 0 && (
            <span className="absolute top-1 right-1/2 translate-x-4 bg-red-500 text-white text-[10px] rounded-full px-1.5 min-w-[18px] text-center border-2 border-[#1e2329]">
              {openOrders.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'history' ? 'text-yellow-500' : 'text-gray-400'}`}>
          <i className="fas fa-history text-xl mb-1"></i>
          <span className="text-xs">Lịch sử</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'settings' ? 'text-yellow-500' : 'text-gray-400'}`}>
          <i className="fas fa-cog text-xl mb-1"></i>
          <span className="text-xs">Cài đặt</span>
        </button>
      </nav>

      {/* Notifications */}
      <div className="fixed top-20 right-4 space-y-2 z-[60]">
        {notifications.map(n => <Notification key={n.id} {...n} />)}
      </div>

      {/* Chart Modal */}
      {selectedCoinForChart && (
        <ChartModal 
          symbol={selectedCoinForChart} 
          timeframe={timeframe}
          onClose={() => setSelectedCoinForChart(null)} 
        />
      )}
    </div>
  );
};

export default App;
