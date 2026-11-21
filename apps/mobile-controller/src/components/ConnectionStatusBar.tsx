import React from 'react';
import { ConnectionStatus, LatencyReport } from '@universal-gamepad/shared-protocol';
import { Activity, Maximize2, Minimize2, Wifi, Usb, Bluetooth } from 'lucide-react';

interface ConnectionStatusBarProps {
  status: ConnectionStatus;
  latency: LatencyReport;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onDisconnect?: () => void;
  compact?: boolean;
  transport?: 'wifi' | 'usb' | 'bluetooth';
}

export const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({
  status,
  latency,
  isFullscreen,
  onToggleFullscreen,
  onDisconnect,
  compact = false,
  transport = 'wifi',
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'ONLINE',
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
          dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse',
        };
      case 'pairing':
      case 'reconnecting':
        return {
          label: 'PAIRING',
          color: 'bg-amber-500/15 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
          dot: 'bg-amber-400 animate-ping',
        };
      default:
        return {
          label: 'OFFLINE',
          color: 'bg-rose-500/15 text-rose-300 border-rose-400/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
          dot: 'bg-rose-400',
        };
    }
  };

  const badge = getStatusBadge();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-mono select-none">
        {/* Status Pill */}
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${badge.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          <span className="font-bold text-[9px] tracking-wider">{badge.label}</span>
        </div>

        {/* Transport Type Badge */}
        {status === 'connected' && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0B1324] border border-slate-700/80 text-[9px] font-mono">
            {transport === 'usb' && <Usb className="w-2.5 h-2.5 text-emerald-400" />}
            {transport === 'bluetooth' && <Bluetooth className="w-2.5 h-2.5 text-blue-400" />}
            {transport === 'wifi' && <Wifi className="w-2.5 h-2.5 text-cyan-400" />}
            <span
              className={
                transport === 'usb'
                  ? 'text-emerald-300 font-bold'
                  : transport === 'bluetooth'
                  ? 'text-blue-300 font-bold'
                  : 'text-cyan-300'
              }
            >
              {transport === 'usb' ? 'USB' : transport === 'bluetooth' ? 'BT' : 'WI-FI'}
            </span>
          </div>
        )}

        {/* Latency RTT */}
        {status === 'connected' && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0B1324] border border-cyan-500/30 text-slate-200">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-300 font-bold font-mono text-[9px]">
              {latency.rttMs < 1 ? '<1' : latency.rttMs.toFixed(1)}ms
            </span>
          </div>
        )}

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg border border-cyan-400/60 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-[9px] font-bold tracking-wider transition-all shadow-[0_0_10px_rgba(0,240,255,0.25)] active:scale-95"
          title="Toggle Fullscreen Mode"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3 text-cyan-400" /> : <Maximize2 className="w-3 h-3 text-cyan-400" />}
          <span>{isFullscreen ? 'EXIT' : 'FULL'}</span>
        </button>

        {/* Disconnect Option */}
        {status === 'connected' && onDisconnect && (
          <button
            type="button"
            onClick={onDisconnect}
            className="text-[9px] font-bold text-rose-300 border border-rose-500/40 hover:bg-rose-950/60 px-2 py-0.5 rounded-lg transition-colors active:scale-95"
          >
            DISCONNECT
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-between px-4 py-1 text-[11px] font-mono select-none bg-[#050812]/80 backdrop-blur-md border-b border-cyan-500/20 shadow-md">
      {/* Left: App Brand & Status */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
          <span className="font-extrabold text-xs text-white tracking-widest drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            UNIVERSAL <span className="text-cyan-400">GAMEPAD</span>
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${badge.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          <span className="font-bold text-[9px] tracking-wider">{badge.label}</span>
        </div>
      </div>

      {/* Right: Fullscreen Button, Latency Telemetry & Disconnect */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-cyan-400/60 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-[10px] font-extrabold tracking-wider transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] active:scale-95"
          title="Toggle Fullscreen Mode"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3 text-cyan-400" /> : <Maximize2 className="w-3 h-3 text-cyan-400" />}
          <span>{isFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}</span>
        </button>

        {status === 'connected' && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#0B1324] border border-cyan-500/30 text-slate-200">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-300 font-bold font-mono text-[10px]">
              {latency.rttMs < 1 ? '<1' : latency.rttMs.toFixed(1)} ms
            </span>
            <span className="text-[8px] text-slate-400 font-semibold">RTT</span>
          </div>
        )}

        {status === 'connected' && onDisconnect && (
          <button
            type="button"
            onClick={onDisconnect}
            className="text-[9px] font-bold text-rose-300 border border-rose-500/40 hover:bg-rose-950/60 px-2.5 py-0.5 rounded-lg transition-colors active:scale-95"
          >
            DISCONNECT
          </button>
        )}
      </div>
    </div>
  );
};
