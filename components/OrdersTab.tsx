
import React, { useState } from 'react';
import { Order, PositionSide } from '../types';

interface OrdersTabProps {
  orders: Order[];
  onCloseOrder: (id: string, price: number) => void;
  onShowChart: (symbol: string) => void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ orders, onCloseOrder, onShowChart }) => {
  const [filter, setFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'ALL' || o.side === filter;
    const matchesSearch = o.symbol.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate Summary
  const totalNotional = orders.reduce((sum, o) => sum + o.notional, 0);
  const totalPnlUsdt = orders.reduce((sum, o) => sum + o.pnlUsdt, 0);
  const totalMargin = orders.reduce((sum, o) => sum + (o.notional / o.leverage), 0);
  const totalPnlPct = totalMargin > 0 ? (totalPnlUsdt / totalMargin) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-binance-gray p-4 rounded-xl border border-binance-gray flex flex-col items-center justify-center">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Tổng vị thế (Notional)</p>
            <p className="text-lg font-bold text-white">{totalNotional.toLocaleString()} USDT</p>
          </div>
          <div className="bg-binance-gray p-4 rounded-xl border border-binance-gray flex flex-col items-center justify-center">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Tổng P/L (USDT)</p>
            <p className={`text-lg font-bold ${totalPnlUsdt >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
              {totalPnlUsdt >= 0 ? '+' : ''}{totalPnlUsdt.toFixed(2)} USDT
            </p>
          </div>
          <div className="bg-binance-gray p-4 rounded-xl border border-binance-gray flex flex-col items-center justify-center">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Tổng P/L (%)</p>
            <p className={`text-lg font-bold ${totalPnlPct >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
              {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-binance-gray p-4 rounded-xl border border-binance-gray">
        <div className="flex space-x-2">
          {['ALL', 'LONG', 'SHORT'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f ? 'bg-yellow-500 text-black' : 'bg-[#0b0e11] text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
          <input 
            type="text" 
            placeholder="Tìm mã coin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0b0e11] border border-binance-gray rounded-lg py-1.5 pl-9 pr-4 text-xs outline-none focus:border-yellow-500"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <i className="fas fa-box-open fa-3x mb-4"></i>
          <p>Không có lệnh nào đang mở</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-binance-gray rounded-xl p-4 border border-binance-gray relative hover:border-gray-600 transition-all shadow-lg overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full ${order.side === PositionSide.LONG ? 'bg-binance-green' : 'bg-binance-red'}`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center">
                    <h4 className="font-bold text-lg mr-2">{order.symbol}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      order.side === PositionSide.LONG ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {order.side} {order.leverage}x
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Mở lúc: {new Date(order.openTime).toLocaleTimeString()}</p>
                </div>
                
                <button 
                  onClick={() => onShowChart(order.symbol)}
                  className="p-2 text-gray-400 hover:text-yellow-500 bg-[#0b0e11] rounded-lg transition-colors"
                >
                  <i className="fas fa-chart-line"></i>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-y-3 mb-6">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Giá vào</p>
                  <p className="font-medium text-sm">{order.entryPrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase">Giá hiện tại</p>
                  <p className="font-medium text-sm">{order.currentPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Target (TP1)</p>
                  <p className="font-medium text-sm text-green-500">{order.tp1.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase">Dừng lỗ (SL)</p>
                  <p className="font-medium text-sm text-red-500">{order.sl.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-end justify-between bg-[#0b0e11] p-3 rounded-lg border border-binance-gray mb-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">P/L Ước tính</p>
                  <p className={`text-xl font-bold ${order.pnlUsdt >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                    {order.pnlUsdt >= 0 ? '+' : ''}{order.pnlUsdt.toFixed(2)} USDT
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${order.pnlPct >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                    {order.pnlPct >= 0 ? '+' : ''}{order.pnlPct.toFixed(2)}%
                  </p>
                </div>
              </div>

              <button 
                onClick={() => onCloseOrder(order.id, order.currentPrice)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm transition-all"
              >
                ĐÓNG LỆNH
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
