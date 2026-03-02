
import React, { useEffect, useState, useRef } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData, CandlestickSeries } from 'lightweight-charts';
import { fetchKlines } from '../services/binance';
import { Kline, Timeframe } from '../types';

interface ChartModalProps {
  symbol: string;
  timeframe: Timeframe;
  onClose: () => void;
}

const ChartModal: React.FC<ChartModalProps> = ({ symbol, timeframe, onClose }) => {
  const [loading, setLoading] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'>>(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchKlines(symbol, timeframe, 500);
      
      if (chartContainerRef.current) {
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: '#0b0e11' },
            textColor: '#d1d4dc',
          },
          grid: {
            vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
            horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
          },
          width: chartContainerRef.current.clientWidth,
          height: 450,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#02c076',
          downColor: '#f84960',
          borderVisible: false,
          wickUpColor: '#02c076',
          wickDownColor: '#f84960',
        });

        const formattedData: CandlestickData[] = data.map(k => ({
          time: k.t / 1000 as any,
          open: k.o,
          high: k.h,
          low: k.l,
          close: k.c,
        }));

        candlestickSeries.setData(formattedData);
        
        chartRef.current = chart;
        seriesRef.current = candlestickSeries;
        setLoading(false);

        const handleResize = () => {
          if (chartContainerRef.current) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        };

        window.addEventListener('resize', handleResize);
        return () => {
          window.removeEventListener('resize', handleResize);
          chart.remove();
        };
      }
    };
    load();
  }, [symbol, timeframe]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-binance-gray rounded-2xl w-full max-w-5xl border border-binance-gray overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-binance-gray flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="text-yellow-500">{symbol}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400 uppercase">{timeframe}</span>
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">Biểu đồ kỹ thuật Binance Futures • Thời gian thực</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="relative bg-[#0b0e11] min-h-[450px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0b0e11]">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin text-yellow-500">
                  <i className="fas fa-circle-notch fa-3x"></i>
                </div>
                <p className="text-xs text-gray-500">Đang tải biểu đồ...</p>
              </div>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full" />
        </div>

        <div className="p-4 bg-binance-gray text-[10px] text-gray-500 flex justify-between items-center border-t border-binance-gray">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Live Data</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> TradingView Engine</span>
          </div>
          <p>Sử dụng chuột để phóng to/thu nhỏ và kéo biểu đồ</p>
        </div>
      </div>
    </div>
  );
};

export default ChartModal;
