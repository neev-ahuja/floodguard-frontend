import React from 'react';
import { Wifi, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'realtime' | 'polling' | 'connecting';
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, className = '' }) => {
  const badgeConfig = {
    realtime: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 neon-glow-green',
      icon: <Wifi className="w-3.5 h-3.5" />,
      text: 'Live Realtime',
    },
    polling: {
      color: 'bg-amber-50 text-amber-700 border-amber-200 neon-glow-orange',
      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />,
      text: 'Live Polling',
    },
    connecting: {
      color: 'bg-slate-50 text-slate-600 border-slate-200',
      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
      text: 'Connecting...',
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${badgeConfig.color} ${className}`}
    >
      {badgeConfig.icon}
      <span>{badgeConfig.text}</span>
    </div>
  );
};

export default ConnectionStatus;
