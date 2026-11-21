import React from 'react';
import { Gamepad2, ShieldCheck, Cpu } from 'lucide-react';
import { DriverStatusReport, ConnectionStatus } from '@universal-gamepad/shared-protocol';

interface HeaderProps {
  status: ConnectionStatus;
  driverReport?: {
    platform: string;
    mode: string;
    isDriverInstalled: boolean;
    driverName: string;
    statusMessage: string;
  };
}

export const Header: React.FC<HeaderProps> = ({ status, driverReport }) => {
  return (
    <header className="w-full border-b border-gamepad-border bg-gamepad-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
          <Gamepad2 className="w-6 h-6 text-slate-950" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-wider text-white flex items-center gap-2">
            UNIVERSAL GAMEPAD <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">HOST v1.0</span>
          </h1>
          <p className="text-xs text-slate-400">Turn Every Smartphone Into a Wireless Gaming Controller</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Driver Mode Pill */}
        {driverReport && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Mode:</span>
            <span className="font-semibold text-cyan-300">
              {driverReport.mode === 'mode_a_virtual_gamepad' ? 'Mode A (Xbox Gamepad)' : 'Mode B (Input Synthesis)'}
            </span>
          </div>
        )}

        {/* Global Status Pill */}
        <div
          className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-black tracking-wider transition-all duration-300 ${
            status === 'connected'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] ring-2 ring-emerald-500/20'
              : status === 'pairing'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 ring-1 ring-amber-500/20'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : status === 'pairing'
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
            />
            {status === 'connected' && (
              <span className="w-4 h-4 bg-emerald-400/60 rounded-full absolute -inset-0.75 animate-ping pointer-events-none" />
            )}
          </div>
          <span className="uppercase">
            {status === 'connected' ? 'CONTROLLER CONNECTED' : status.replace('_', ' ')}
          </span>
        </div>
      </div>
    </header>
  );
};
