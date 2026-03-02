
import React from 'react';
import { TradeSettings, MarginMode } from '../types';

interface SettingsTabProps {
  settings: TradeSettings;
  setSettings: (s: TradeSettings) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ settings, setSettings }) => {
  const updateSetting = (key: keyof TradeSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
      {/* Risk & Leverage */}
      <section className="bg-binance-gray rounded-xl p-5 border border-binance-gray">
        <h3 className="text-lg font-bold mb-5 flex items-center">
          <i className="fas fa-shield-alt mr-2 text-yellow-500"></i>
          Giao dịch & Đòn bẩy
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Đòn bẩy (Leverage)</label>
              <span className="text-sm font-bold text-yellow-500">{settings.leverage}x</span>
            </div>
            <input 
              type="range" min="1" max="50"
              value={settings.leverage}
              onChange={(e) => updateSetting('leverage', parseInt(e.target.value))}
              className="w-full accent-yellow-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Margin Mode</label>
              <select 
                value={settings.marginMode}
                onChange={(e) => updateSetting('marginMode', e.target.value)}
                className="w-full bg-[#0b0e11] border border-binance-gray rounded p-2 text-sm outline-none"
              >
                <option value={MarginMode.ISOLATED}>Isolated</option>
                <option value={MarginMode.CROSS}>Cross</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Vốn/Lệnh (USDT)</label>
              <input 
                type="number"
                value={settings.marginPerTrade}
                onChange={(e) => updateSetting('marginPerTrade', parseFloat(e.target.value))}
                className="w-full bg-[#0b0e11] border border-binance-gray rounded p-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-[11px] text-yellow-500 italic">
              * Tổng vốn danh nghĩa (Notional) = {settings.marginPerTrade} * {settings.leverage} = {settings.marginPerTrade * settings.leverage} USDT
            </p>
          </div>
        </div>
      </section>

      {/* TP/SL Management */}
      <section className="bg-binance-gray rounded-xl p-5 border border-binance-gray">
        <h3 className="text-lg font-bold mb-5 flex items-center">
          <i className="fas fa-bullseye mr-2 text-yellow-500"></i>
          TP/SL & Quản lý lệnh
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 hover:bg-[#0b0e11] rounded transition-colors">
            <span className="text-sm">Sử dụng TP2 (Target 2)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.useTP2} onChange={() => updateSetting('useTP2', !settings.useTP2)} className="sr-only peer"/>
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-yellow-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-2 hover:bg-[#0b0e11] rounded transition-colors">
            <span className="text-sm">Chốt 50% tại TP1</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.takeProfit50AtTP1} onChange={() => updateSetting('takeProfit50AtTP1', !settings.takeProfit50AtTP1)} className="sr-only peer"/>
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-yellow-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-2 hover:bg-[#0b0e11] rounded transition-colors">
            <span className="text-sm">Dời SL về Entry khi hit TP1</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.moveSLToEntryAtTP1} onChange={() => updateSetting('moveSLToEntryAtTP1', !settings.moveSLToEntryAtTP1)} className="sr-only peer"/>
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-yellow-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-2 hover:bg-[#0b0e11] rounded transition-colors">
            <span className="text-sm">Trailing stop theo ATR</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.trailingStopATR} onChange={() => updateSetting('trailingStopATR', !settings.trailingStopATR)} className="sr-only peer"/>
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-yellow-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="pt-4 grid grid-cols-2 gap-4 border-t border-binance-gray mt-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nguồn giá</label>
              <select 
                value={settings.useMarkPrice ? 'MARK' : 'LAST'}
                onChange={(e) => updateSetting('useMarkPrice', e.target.value === 'MARK')}
                className="w-full bg-[#0b0e11] border border-binance-gray rounded p-2 text-sm outline-none"
              >
                <option value="MARK">Mark Price</option>
                <option value="LAST">Last Price</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Cooldown (Phút)</label>
              <input 
                type="number"
                value={settings.cooldownMin}
                onChange={(e) => updateSetting('cooldownMin', parseInt(e.target.value))}
                className="w-full bg-[#0b0e11] border border-binance-gray rounded p-2 text-sm outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Spam Prevention */}
      <section className="bg-binance-gray rounded-xl p-5 border border-binance-gray md:col-span-2">
        <h3 className="text-lg font-bold mb-5 flex items-center">
          <i className="fas fa-microchip mr-2 text-yellow-500"></i>
          Giới hạn hệ thống
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Tối đa số lệnh đang mở đồng thời: {settings.maxOpenTrades}</label>
            <input 
              type="range" min="1" max="50"
              value={settings.maxOpenTrades}
              onChange={(e) => updateSetting('maxOpenTrades', parseInt(e.target.value))}
              className="w-full accent-yellow-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Ưu tiên Top K tín hiệu tốt nhất: {settings.topKSignals}</label>
            <input 
              type="range" min="1" max="20"
              value={settings.topKSignals}
              onChange={(e) => updateSetting('topKSignals', parseInt(e.target.value))}
              className="w-full accent-yellow-500"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsTab;
