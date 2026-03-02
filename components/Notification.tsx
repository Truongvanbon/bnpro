
import React from 'react';

interface NotificationProps {
  title: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const Notification: React.FC<NotificationProps> = ({ title, message, type }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-blue-500');
  const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle');

  return (
    <div className="w-72 bg-[#1e2329] border border-binance-gray rounded-lg shadow-2xl overflow-hidden animate-slide-in">
      <div className={`h-1 w-full ${bgColor}`}></div>
      <div className="p-4 flex items-start space-x-3">
        <div className={`mt-0.5 text-lg ${type === 'success' ? 'text-green-500' : (type === 'error' ? 'text-red-500' : 'text-blue-500')}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div>
          <h4 className="font-bold text-xs">{title}</h4>
          <p className="text-[10px] text-gray-400 mt-0.5">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Notification;
