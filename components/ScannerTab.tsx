
import React, { useState } from 'react';
import { Timeframe, FilterMode, IndicatorConfig, AdvancedSettings } from '../types';
import { TIMEFRAMES } from '../constants';

interface ScannerTabProps {
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  coinCount: number;
  setCoinCount: (c: number) => void;
  filterMode: FilterMode;
  setFilterMode: (m: FilterMode) => void;
  indicators: IndicatorConfig;
  setIndicators: (i: IndicatorConfig) => void;
  advanced: AdvancedSettings;
  setAdvanced: (a: AdvancedSettings) => void;
  isScanning: boolean;
}

const ScannerTab: React.FC<ScannerTabProps> = ({
  timeframe, setTimeframe,
  coinCount, setCoinCount,
  filterMode, setFilterMode,
  indicators, setIndicators,
  advanced, setAdvanced,
  isScanning
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleIndicator = (key: keyof IndicatorConfig) => {
    if (filterMode !== FilterMode.CUSTOM) setFilterMode(FilterMode.CUSTOM);
    setIndicators({ ...indicators, [key]: !indicators[key] });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Box */}
      <section className="bg-binance-gray rounded-xl p-5 border border-binance-gray">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <i className="fas fa-sliders-h mr-2 text-yellow-500"></i>
          Cấu hình quét
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Khung giờ</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              disabled={isScanning}
              className="w-full bg-[#0b0e11] border border-binance-gray rounded p-2 text-sm outline-none focus:border-yellow-500"
            >
              {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Top Volume 24h</label>
            <select 
              value={coinCount} 
              onChange={(e) => setCoinCount(Number(e.target.value))}
              disabled={isScanning}
              className="w-full bg-[#0b0e11] border border-binance-gray rounded p-2 text-sm outline-none focus:border-yellow-500"
            >
              <option value={10}>Top 10</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Chế độ lọc</label>
            <div className="flex space-x-2">
              {[FilterMode.EASY, FilterMode.NORMAL, FilterMode.HARD, FilterMode.CUSTOM].map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  disabled={isScanning}
                  className={`flex-1 py-2 text-xs font-medium rounded border transition-all ${
                    filterMode === mode 
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                      : 'bg-[#0b0e11] border-binance-gray text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Indicators Box */}
      <section className="bg-binance-gray rounded-xl p-5 border border-binance-gray">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center">
            <i className="fas fa-chart-line mr-2 text-yellow-500"></i>
            Hệ thống lọc (AND logic)
          </h3>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-yellow-500 flex items-center hover:underline"
          >
            {showAdvanced ? 'Thu gọn' : 'Nâng cao'}
            <i className={`fas fa-chevron-${showAdvanced ? 'up' : 'down'} ml-1`}></i>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Object.entries(indicators).map(([key, value]) => (
            <label 
              key={key} 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                value ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-[#0b0e11] border-binance-gray grayscale opacity-60'
              }`}
            >
              <input 
                type="checkbox" 
                checked={value} 
                onChange={() => toggleIndicator(key as keyof IndicatorConfig)}
                className="hidden"
                disabled={isScanning}
              />
              <div className={`w-4 h-4 rounded-sm border mr-3 flex items-center justify-center ${value ? 'bg-yellow-500 border-yellow-500' : 'border-gray-500'}`}>
                {value && <i className="fas fa-check text-[10px] text-black"></i>}
              </div>
              <span className="text-[11px] font-medium truncate uppercase">{key.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>

        {/* Advanced Accordion */}
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-binance-gray grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs text-gray-400 block mb-2">Điểm tin cậy (Score) tối thiểu: {advanced.thresholdScore}</label>
              <input 
                type="range" min="40" max="90" step="5"
                value={advanced.thresholdScore}
                onChange={(e) => setAdvanced({...advanced, thresholdScore: parseInt(e.target.value)})}
                className="w-full accent-yellow-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">ADX tối thiểu: {advanced.adxMin}</label>
              <input 
                type="range" min="10" max="35" step="1"
                value={advanced.adxMin}
                onChange={(e) => setAdvanced({...advanced, adxMin: parseInt(e.target.value)})}
                className="w-full accent-yellow-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">Độ biến động ATR min %: {advanced.minVolPct}%</label>
              <input 
                type="range" min="0.1" max="1.0" step="0.05"
                value={advanced.minVolPct}
                onChange={(e) => setAdvanced({...advanced, minVolPct: parseFloat(e.target.value)})}
                className="w-full accent-yellow-500"
              />
            </div>
          </div>
        )}
      </section>

      {/* Stats Summary */}
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <i className="fas fa-radar fa-3x mb-4 text-binance-gray"></i>
        <p className="max-w-md">Hệ thống sẽ quét liên tục thị trường Futures. Khi tất cả các chỉ báo được chọn đều đồng nhất tín hiệu tại nến đóng, lệnh mô phỏng sẽ tự động được mở.</p>
      </div>
    </div>
  );
};

export default ScannerTab;
