import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Zap, Shield, Cpu, Activity, Play, ChevronRight } from 'lucide-react';
import { playBootChime } from '../utils/bootAudio';
import { triggerHaptic } from '../utils/haptics';

interface BootSequenceProps {
  onComplete: () => void;
  isIOS?: boolean;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete, isIOS = true }) => {
  const [phase, setPhase] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isWarping, setIsWarping] = useState<boolean>(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    '>> KERNEL INITIALIZED // ARCH: UNIVERSAL-HID',
  ]);

  useEffect(() => {
    // Phase 1: Hardware Detection
    const t1 = setTimeout(() => {
      setPhase(1);
      setTelemetryLogs((prev) => [...prev, '>> MOUNTING 120HZ DIRECT DOM ENGINE... [OK]']);
      triggerHaptic('light', 0.6, isIOS);
    }, 300);

    // Phase 2: Input Synthesizer & Promotion
    const t2 = setTimeout(() => {
      setPhase(2);
      setTelemetryLogs((prev) => [...prev, '>> CALIBRATING DUAL HALL STICKS & DPAD... [LOCKED]']);
      triggerHaptic('light', 0.8, isIOS);
    }, 700);

    // Phase 3: Touchpad & Zero-Latency Pipeline
    const t3 = setTimeout(() => {
      setPhase(3);
      setTelemetryLogs((prev) => [...prev, '>> PRECISION TRACKPAD & HAPTICS... [ONLINE]']);
      triggerHaptic('medium', 0.9, isIOS);
    }, 1150);

    // Phase 4: Ready for Ignition
    const t4 = setTimeout(() => {
      setPhase(4);
      setTelemetryLogs((prev) => [...prev, '>> SYSTEM ARMED // ALL SUBSYSTEMS NOMINAL']);
      triggerHaptic('heavy', 1.0, isIOS);
    }, 1600);

    // Progress counter
    const pTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(pTimer);
          return 100;
        }
        return prev + 5;
      });
    }, 55);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(pTimer);
    };
  }, [isIOS]);

  const handleIgnite = useCallback(() => {
    if (isWarping) return;
    setIsWarping(true);
    triggerHaptic('heavy', 1.0, isIOS);
    playBootChime(isIOS);

    setTimeout(() => {
      onComplete();
    }, 650);
  }, [isWarping, onComplete, isIOS]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#02050B] flex flex-col items-center justify-between p-3 sm:p-6 select-none overflow-hidden transition-all duration-700 ${
        isWarping ? 'opacity-0 scale-125 filter blur-sm pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Cybernetic Blueprint Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#00F0FF_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

      {/* Cyber Sweep Laser Scanline */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent pointer-events-none animate-scanline h-48" />

      {/* Ambient Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#02050B_95%)] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between z-10 border-b border-cyan-500/25 pb-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-[10px] sm:text-xs font-black tracking-widest text-cyan-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.9)]">
            UNIVERSAL GAMEPAD // TITAN COCKPIT v2.0
          </span>
        </div>

        <button
          type="button"
          onClick={handleIgnite}
          className="px-3 py-1 rounded-lg border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 text-[10px] font-mono font-bold tracking-wider hover:bg-cyan-900/60 transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] active:scale-95"
        >
          SKIP ⏩
        </button>
      </div>

      {/* Center Holographic Reactor & Radial Scanner */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10">
        {/* Outward Shockwave Ring when warping */}
        {isWarping && (
          <div className="absolute w-96 h-96 rounded-full border-4 border-cyan-300 animate-ping opacity-60 pointer-events-none" />
        )}

        {/* Counter-Rotating Holographic Rings */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Outer Compass Degree Ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40 transition-transform duration-1000 ${
              phase >= 1 ? 'rotate-180 scale-100' : 'rotate-0 scale-90'
            }`}
          >
            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] font-mono font-bold text-cyan-400">00°</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] font-mono font-bold text-cyan-400">90°</span>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-mono font-bold text-cyan-400">180°</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[7px] font-mono font-bold text-cyan-400">270°</span>
          </div>

          {/* Electric Purple Inner Ring */}
          <div
            className={`absolute inset-4 rounded-full border border-fuchsia-500/50 transition-all duration-700 ${
              phase >= 2 ? 'rotate-90 scale-100' : '-rotate-45 scale-90'
            }`}
          />

          {/* Sweeping Laser Radar Beam */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-40">
            <div className="w-full h-full bg-gradient-to-tr from-cyan-400 via-transparent to-transparent animate-laser-sweep" />
          </div>

          {/* Core Reactor Orb with Power Flare */}
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-500 ${
              phase >= 4
                ? 'bg-gradient-to-br from-cyan-400 via-white to-blue-500 border-white shadow-[0_0_60px_rgba(0,240,255,1)] scale-110'
                : 'bg-gradient-to-br from-[#121E36] to-[#070D18] border-cyan-400/60 shadow-[0_0_30px_rgba(0,240,255,0.5)] scale-100'
            }`}
          >
            <Zap className={`w-8 h-8 ${phase >= 4 ? 'text-slate-950 animate-bounce' : 'text-cyan-300 animate-pulse'}`} />
            <span className={`text-[11px] font-mono font-black mt-0.5 ${phase >= 4 ? 'text-slate-950' : 'text-cyan-200'}`}>
              {progress}%
            </span>
          </div>

          {/* 4 Satellite Nodes (ABXY Ignition Simulation) */}
          <div
            className={`absolute top-2 w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
              phase >= 1 ? 'bg-amber-400 border-white shadow-[0_0_15px_#f59e0b] scale-110' : 'bg-slate-800 border-slate-700'
            }`}
          />
          <div
            className={`absolute right-2 w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
              phase >= 2 ? 'bg-rose-500 border-white shadow-[0_0_15px_#f43f5e] scale-110' : 'bg-slate-800 border-slate-700'
            }`}
          />
          <div
            className={`absolute bottom-2 w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
              phase >= 3 ? 'bg-emerald-400 border-white shadow-[0_0_15px_#10b981] scale-110' : 'bg-slate-800 border-slate-700'
            }`}
          />
          <div
            className={`absolute left-2 w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
              phase >= 2 ? 'bg-cyan-400 border-white shadow-[0_0_15px_#00f0ff] scale-110' : 'bg-slate-800 border-slate-700'
            }`}
          />
        </div>

        {/* Big Action Call-To-Action / Ignition Button */}
        <div className="mt-4 flex flex-col items-center gap-2">
          {phase >= 4 ? (
            <button
              type="button"
              onClick={handleIgnite}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-white to-cyan-400 text-slate-950 font-black text-xs sm:text-sm font-mono tracking-widest uppercase shadow-[0_0_35px_rgba(0,240,255,1)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ring-2 ring-white animate-pulse"
            >
              <Play className="w-4 h-4 fill-current text-slate-950" />
              <span>IGNITE COCKPIT ⚡</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
              <span className="font-mono text-xs font-black tracking-wider text-cyan-200 uppercase">
                {phase === 0 && 'INITIALIZING SYSTEM HARDWARE...'}
                {phase === 1 && 'SYNCHRONIZING TAPTIC ENGINE...'}
                {phase === 2 && 'CALIBRATING HALL THUMBSTICKS...'}
                {phase === 3 && 'ARMING PRECISION TRACKPAD...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Diagnostic Telemetry Log Stream */}
      <div className="w-full max-w-lg z-10 px-2">
        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-[9px] sm:text-[10px] space-y-1 shadow-inner">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold">SYSTEM TELEMETRY</span>
            </span>
            <span className="text-emerald-400 font-bold">120 FPS // LOW-LATENCY</span>
          </div>

          <div className="space-y-0.5 max-h-14 overflow-hidden text-cyan-300/90">
            {telemetryLogs.slice(-3).map((log, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
