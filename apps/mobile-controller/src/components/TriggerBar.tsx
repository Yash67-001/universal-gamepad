import React, { useRef, useState, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface TriggerBarProps {
  onBumperChange: (bumper: 'l1' | 'r1', pressed: boolean) => void;
  onTriggerChange: (trigger: 'l2' | 'r2', value: number) => void;
  isIOS?: boolean;
  children?: React.ReactNode;
}

export const TriggerBar: React.FC<TriggerBarProps> = ({
  onBumperChange,
  onTriggerChange,
  isIOS = false,
  children,
}) => {
  const [l1Pressed, setL1Pressed] = useState(false);
  const [r1Pressed, setR1Pressed] = useState(false);
  const [l2Value, setL2Value] = useState(0);
  const [r2Value, setR2Value] = useState(0);

  const l2Pointer = useRef<number | null>(null);
  const r2Pointer = useRef<number | null>(null);
  const l2StartPos = useRef<number>(0);
  const r2StartPos = useRef<number>(0);

  // L1 Bumper
  const handleL1Down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    triggerHaptic('light', 0.8, isIOS);
    setL1Pressed(true);
    onBumperChange('l1', true);
  };
  const handleL1Up = () => {
    setL1Pressed(false);
    onBumperChange('l1', false);
  };

  // R1 Bumper
  const handleR1Down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    triggerHaptic('light', 0.8, isIOS);
    setR1Pressed(true);
    onBumperChange('r1', true);
  };
  const handleR1Up = () => {
    setR1Pressed(false);
    onBumperChange('r1', false);
  };

  // L2 Analog Trigger (Pull down for progressive pressure)
  const handleL2Down = (e: React.PointerEvent) => {
    l2Pointer.current = e.pointerId;
    l2StartPos.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
    triggerHaptic('heavy', 0.9, isIOS);
    setL2Value(1.0);
    onTriggerChange('l2', 1.0);
  };
  const handleL2Move = (e: React.PointerEvent) => {
    if (l2Pointer.current === e.pointerId) {
      const delta = e.clientY - l2StartPos.current;
      const normalized = Math.max(0.05, Math.min(1.0, 1.0 - delta / 50));
      setL2Value(normalized);
      onTriggerChange('l2', normalized);
    }
  };
  const handleL2Up = (e: React.PointerEvent) => {
    if (l2Pointer.current === e.pointerId) {
      l2Pointer.current = null;
      setL2Value(0);
      onTriggerChange('l2', 0);
    }
  };

  // R2 Analog Trigger
  const handleR2Down = (e: React.PointerEvent) => {
    r2Pointer.current = e.pointerId;
    r2StartPos.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
    triggerHaptic('heavy', 0.9, isIOS);
    setR2Value(1.0);
    onTriggerChange('r2', 1.0);
  };
  const handleR2Move = (e: React.PointerEvent) => {
    if (r2Pointer.current === e.pointerId) {
      const delta = e.clientY - r2StartPos.current;
      const normalized = Math.max(0.05, Math.min(1.0, 1.0 - delta / 50));
      setR2Value(normalized);
      onTriggerChange('r2', normalized);
    }
  };
  const handleR2Up = (e: React.PointerEvent) => {
    if (r2Pointer.current === e.pointerId) {
      r2Pointer.current = null;
      setR2Value(0);
      onTriggerChange('r2', 0);
    }
  };

  const resetAll = useCallback(() => {
    setL1Pressed(false);
    setR1Pressed(false);
    setL2Value(0);
    setR2Value(0);
    onBumperChange('l1', false);
    onBumperChange('r1', false);
    onTriggerChange('l2', 0);
    onTriggerChange('r2', 0);
  }, [onBumperChange, onTriggerChange]);

  useEffect(() => {
    window.addEventListener('blur', resetAll);
    document.addEventListener('visibilitychange', resetAll);
    return () => {
      window.removeEventListener('blur', resetAll);
      document.removeEventListener('visibilitychange', resetAll);
    };
  }, [resetAll]);

  // Progressive LED segment bar
  const renderLedSegments = (val: number) => {
    const segments = 6;
    const activeCount = Math.round(val * segments);
    return (
      <div className="flex gap-0.5 mt-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-xs transition-all duration-75 ${
              i < activeCount
                ? i >= 5
                  ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.9)]'
                  : 'bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.9)]'
                : 'bg-slate-800/80'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full flex items-center justify-between px-3 sm:px-6 pt-1.5 pb-1 select-none touch-none z-20">
      {/* Left Shoulder Pod: Ergonomic L2 Trigger & L1 Bumper */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* L2 Analog Trigger Pedal - Sculpted Shoulder Contour */}
        <div
          onPointerDown={handleL2Down}
          onPointerMove={handleL2Move}
          onPointerUp={handleL2Up}
          onPointerCancel={handleL2Up}
          className={`relative min-w-[58px] px-3.5 py-1.5 rounded-tl-2xl rounded-tr-lg rounded-bl-xl rounded-br-md border flex flex-col items-center justify-center font-bold text-xs select-none touch-none overflow-hidden transition-all duration-100 ${
            l2Value > 0
              ? 'border-cyan-400 bg-gradient-to-b from-cyan-950 via-cyan-900/50 to-slate-950 text-cyan-200 shadow-[0_0_24px_rgba(0,240,255,0.7)] scale-95 ring-1 ring-cyan-300/40'
              : 'border-slate-700/80 bg-gradient-to-b from-[#222E44] via-[#101726] to-[#070B14] text-slate-300 hover:border-slate-500 shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-95'
          }`}
        >
          {/* Pressure Fill Glow */}
          <div
            style={{ height: `${l2Value * 100}%` }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400/60 via-cyan-500/25 to-transparent pointer-events-none transition-all"
          />
          <div className="relative z-10 flex items-center gap-1.5">
            <span className="font-black tracking-wider text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">L2</span>
            {l2Value > 0 && (
              <span className="text-[9px] font-mono text-cyan-300 font-bold">
                {Math.round(l2Value * 100)}%
              </span>
            )}
          </div>
          {renderLedSegments(l2Value)}
        </div>

        {/* L1 Tactile Bumper */}
        <button
          type="button"
          onPointerDown={handleL1Down}
          onPointerUp={handleL1Up}
          onPointerCancel={handleL1Up}
          className={`min-w-[52px] px-4 py-2 rounded-xl border font-black text-xs tracking-wider select-none touch-none transition-all ${
            l1Pressed
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 border-white shadow-[0_0_25px_rgba(0,240,255,1)] scale-95 ring-1 ring-white/50'
              : 'bg-gradient-to-b from-[#283752] via-[#121A2A] to-[#080D18] text-slate-200 border-slate-700/80 hover:border-slate-500 shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] active:scale-95'
          }`}
        >
          L1
        </button>
      </div>

      {/* Center Section: Compact Status & Fullscreen */}
      {children && (
        <div className="flex items-center justify-center px-1">
          {children}
        </div>
      )}

      {/* Right Shoulder Pod: Ergonomic R1 Bumper & R2 Trigger */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* R1 Tactile Bumper */}
        <button
          type="button"
          onPointerDown={handleR1Down}
          onPointerUp={handleR1Up}
          onPointerCancel={handleR1Up}
          className={`min-w-[52px] px-4 py-2 rounded-xl border font-black text-xs tracking-wider select-none touch-none transition-all ${
            r1Pressed
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 border-white shadow-[0_0_25px_rgba(0,240,255,1)] scale-95 ring-1 ring-white/50'
              : 'bg-gradient-to-b from-[#283752] via-[#121A2A] to-[#080D18] text-slate-200 border-slate-700/80 hover:border-slate-500 shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] active:scale-95'
          }`}
        >
          R1
        </button>

        {/* R2 Analog Trigger Pedal - Sculpted Shoulder Contour */}
        <div
          onPointerDown={handleR2Down}
          onPointerMove={handleR2Move}
          onPointerUp={handleR2Up}
          onPointerCancel={handleR2Up}
          className={`relative min-w-[58px] px-3.5 py-1.5 rounded-tr-2xl rounded-tl-lg rounded-br-xl rounded-bl-md border flex flex-col items-center justify-center font-bold text-xs select-none touch-none overflow-hidden transition-all duration-100 ${
            r2Value > 0
              ? 'border-cyan-400 bg-gradient-to-b from-cyan-950 via-cyan-900/50 to-slate-950 text-cyan-200 shadow-[0_0_24px_rgba(0,240,255,0.7)] scale-95 ring-1 ring-cyan-300/40'
              : 'border-slate-700/80 bg-gradient-to-b from-[#222E44] via-[#101726] to-[#070B14] text-slate-300 hover:border-slate-500 shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-95'
          }`}
        >
          {/* Pressure Fill Glow */}
          <div
            style={{ height: `${r2Value * 100}%` }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400/60 via-cyan-500/25 to-transparent pointer-events-none transition-all"
          />
          <div className="relative z-10 flex items-center gap-1.5">
            <span className="font-black tracking-wider text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">R2</span>
            {r2Value > 0 && (
              <span className="text-[9px] font-mono text-cyan-300 font-bold">
                {Math.round(r2Value * 100)}%
              </span>
            )}
          </div>
          {renderLedSegments(r2Value)}
        </div>
      </div>
    </div>
  );
};
