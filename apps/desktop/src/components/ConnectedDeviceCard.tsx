import React from 'react';
import { Smartphone, Activity, Radio, AlertCircle } from 'lucide-react';

interface ConnectedDeviceCardProps {
  device?: {
    browser: string;
    os: string;
    ip: string;
    connectedAt: number;
  };
  metrics: {
    rttMs: number;
    packetCount: number;
    lastSequence: number;
  };
  onDisconnect: () => void;
}

export const ConnectedDeviceCard: React.FC<ConnectedDeviceCardProps> = ({
  device,
  metrics,
  onDisconnect,
}) => {
  if (!device) {
    return (
      <div className="bg-gamepad-surface border border-gamepad-border rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl min-h-[160px]">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <Smartphone className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="font-bold text-sm text-slate-300">NO SMARTPHONE CONNECTED</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Scan the QR code with your phone or enter the PIN to activate a wireless gamepad slot.
        </p>
      </div>
    );
  }

  // Latency quality color
  const getLatencyColor = (rtt: number) => {
    if (rtt <= 5) return 'text-emerald-400';
    if (rtt <= 15) return 'text-cyan-400';
    if (rtt <= 30) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="bg-gamepad-surface border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">PLAYER 1 ACTIVE</div>
            <div className="font-black text-sm text-white flex items-center gap-2">
              <span>{device.os} DEVICE</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {device.browser}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDisconnect}
          className="px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 text-xs font-bold transition-colors"
        >
          DISCONNECT
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2">
        {/* Latency Meter */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>RTT LATENCY</span>
          </div>
          <div className={`text-xl font-black font-mono mt-1 ${getLatencyColor(metrics.rttMs)}`}>
            {metrics.rttMs.toFixed(1)} <span className="text-xs font-normal">ms</span>
          </div>
        </div>

        {/* Packet Count */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>PACKETS RECVD</span>
          </div>
          <div className="text-xl font-black font-mono text-white mt-1">
            {metrics.packetCount.toLocaleString()}
          </div>
        </div>

        {/* Client IP */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">CLIENT IP</div>
          <div className="text-xs font-mono text-cyan-300 mt-2 truncate">
            {device.ip.replace('::ffff:', '')}
          </div>
        </div>
      </div>
    </div>
  );
};
