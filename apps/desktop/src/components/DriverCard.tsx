import React from 'react';
import { ShieldCheck, Info, ExternalLink, Download } from 'lucide-react';
import { DriverStatusReport } from '../server/driverManager';

interface DriverCardProps {
  report?: DriverStatusReport;
}

export const DriverCard: React.FC<DriverCardProps> = ({ report }) => {
  if (!report) return null;

  return (
    <div className="bg-gamepad-surface border border-gamepad-border rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-base text-white tracking-wide">SYSTEM DRIVER & VIRTUAL HID</h2>
        </div>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
            report.mode === 'mode_a_virtual_gamepad'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
          }`}
        >
          {report.mode === 'mode_a_virtual_gamepad' ? 'MODE A: VIRTUAL GAMEPAD' : 'MODE B: INPUT SYNTHESIS'}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Target Driver Engine:</span>
          <span className="font-mono text-cyan-300 font-bold">{report.driverName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Host OS:</span>
          <span className="font-mono text-slate-200 capitalize">{report.platform}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Status:</span>
          <span className="text-emerald-400 font-semibold">{report.statusMessage}</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-400 leading-relaxed">
        {report.platform === 'win32' && !report.isDriverInstalled && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span>To enable genuine Xbox 360 controller emulation for Steam and PC games:</span>
              <a
                href="https://github.com/nefarius/ViGEmBus/releases"
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-bold text-cyan-400 underline"
              >
                Download ViGEmBus Driver Installer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {report.platform === 'darwin' && (
          <p className="text-[11px] text-slate-400">
            Apple macOS security architecture enforces strict DriverKit entitlements for kernel HID devices. Universal Gamepad transparently runs high-speed Mode B input synthesis with zero kernel tamper risks.
          </p>
        )}
      </div>
    </div>
  );
};
