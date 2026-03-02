
import React from 'react';
import { Order, PositionSide } from '../types';

interface HistoryTabProps {
  history: Order[];
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const totalPnlPct = history.reduce((sum, o) => sum + o.pnlPct, 0);
  const totalPnlUsdt = history.reduce((sum, o) => sum + o.pnlUsdt, 0);

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-binance-gray p-4 rounded-xl border border-binance-gray flex flex-col items-center justify-center">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Tổng lợi nhuận (USDT)</p>
            <p className={`text-lg font-bold ${totalPnlUsdt >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
              {totalPnlUsdt >= 0 ? '+' : ''}{totalPnlUsdt.toFixed(2)} USDT
            </p>
          </div>
          <div className="bg-binance-gray p-4 rounded-xl border border-binance-gray flex flex-col items-center justify-center">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Tổng P/L (%) tích lũy</p>
            <p className={`text-lg font-bold ${totalPnlPct >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
              {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      <div className="bg-binance-gray rounded-xl border border-binance-gray overflow-hidden">
      <div className="p-4 border-b border-binance-gray">
        <h3 className="font-bold">Lịch sử giao dịch</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] text-gray-500 uppercase bg-[#0b0e11] border-b border-binance-gray">
            <tr>
              <th className="px-4 py-3 font-medium">Cặp giao dịch</th>
              <th className="px-4 py-3 font-medium">Giá Vào &rarr; Đóng</th>
              <th className="px-4 py-3 font-medium">Kết quả</th>
              <th className="px-4 py-3 font-medium">P/L</th>
              <th className="px-4 py-3 font-medium text-right">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-binance-gray">
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-gray-500 italic">Chưa có lịch sử lệnh đã đóng</td>
              </tr>
            ) : (
              history.map(order => (
                <tr key={order.id} className="hover:bg-[#0b0e11] transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <span className={`w-1 h-8 rounded-full mr-3 ${order.side === PositionSide.LONG ? 'bg-binance-green' : 'bg-binance-red'}`}></span>
                      <div>
                        <p className="font-bold">{order.symbol}</p>
                        <span className={`text-[10px] font-bold ${order.side === PositionSide.LONG ? 'text-binance-green' : 'text-binance-red'}`}>
                          {order.side} {order.leverage}x
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-gray-300">{order.entryPrice.toLocaleString()}</p>
                    <i className="fas fa-arrow-down text-[10px] text-gray-600 block mx-2"></i>
                    <p className="font-medium">{order.closePrice?.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.closeReason === 'SL' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {order.closeReason}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className={`font-bold ${order.pnlUsdt >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                      {order.pnlUsdt >= 0 ? '+' : ''}{order.pnlUsdt.toFixed(2)} USDT
                    </p>
                    <p className={`text-xs ${order.pnlPct >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                      {order.pnlPct >= 0 ? '+' : ''}{order.pnlPct.toFixed(2)}%
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-[10px] text-gray-500">{new Date(order.openTime).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-500">{new Date(order.openTime).toLocaleTimeString()}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};

export default HistoryTab;
