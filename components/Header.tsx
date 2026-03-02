
import React from 'react';
import { ConnectionStatus } from '../types';

interface HeaderProps {
  status: ConnectionStatus;
  isScanning: boolean;
  onStart: () => void;
  onStop: () => void;
}

const Header: React.FC<HeaderProps> = ({ status, isScanning, onStart, onStop }) => {
  return (
    <header className="bg-binance-gray border-b border-binance-gray px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-black font-bold">B</div>
          <div>
            <h1 className="text-sm font-bold leading-none">Scannet Pro</h1>
            <div className="flex items-center mt-1">
              <span className={`w-2 h-2 rounded-full mr-2 ${status.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] text-gray-400">
                {status.reconnecting ? 'Đang khôi phục...' : (status.connected ? 'Đã kết nối' : 'Mất kết nối')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isScanning && (
            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-gray-500">Đang quét {status.scanningCount} coins</p>
              <p className="text-[10px] text-gray-500">Cập nhật: {new Date(status.lastUpdate).toLocaleTimeString()}</p>
            </div>
          )}
          
          <button 
            onClick={isScanning ? onStop : onStart}
            className={`px-6 py-2 rounded-lg font-bold text-sm shadow-lg transition-all ${
              isScanning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
          >
            {isScanning ? (
              <><i className="fas fa-stop mr-2"></i>DỪNG QUÉT</>
            ) : (
              <><i className="fas fa-play mr-2"></i>BẮT ĐẦU</>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
