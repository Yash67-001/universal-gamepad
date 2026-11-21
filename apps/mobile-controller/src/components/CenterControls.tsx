import React, { useState } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { MousePointer } from 'lucide-react';

interface CenterControlsProps {
  onButtonChange: (btn: 'select' | 'start' | 'home' | 'turbo', pressed: boolean) => void;
  onOpenSettings: () => void;
  onToggleTouchpad?: () => void;
  isTouchpadOpen?: boolean;
  onReplayBoot?: () => void;
  isIOS?: boolean;
  compact?: boolean;
}

export const CenterControls: React.FC<CenterControlsProps> = ({
  onButtonChange,
  onOpenSettings,
  onToggleTouchpad,
  isTouchpadOpen = false,
  onReplayBoot,
  isIOS = false,
  compact = false,
}) => {
  const [selectPressed, setSelectPressed] = useState(false);
  const [startPressed, setStartPressed] = useState(false);
  const [homePressed, setHomePressed] = useState(false);
  const [turboActive, setTurboActive] = useState(false);

  const makePointerHandlers = (
    btn: 'select' | 'start' | 'home',
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      triggerHaptic(15, 0.7, isIOS);
      setter(true);
      onButtonChange(btn, true);
    },
    onPointerUp: () => {
      setter(false);
      onButtonChange(btn, false);
    },
    onPointerCancel: () => {
      setter(false);
      onButtonChange(btn, false);
    },
  });

  const handleTurboToggle = () => {
    const next = !turboActive;
    setTurboActive(next);
    triggerHaptic(20, 1.0, isIOS);
    onButtonChange('turbo', next);
  };

  const handleTouchpadClick = () => {
    triggerHaptic(15, 0.8, isIOS);
    if (onToggleTouchpad) {
      onToggleTouchpad();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 select-none touch-none bg-gradient-to-b from-[#111A2E]/90 to-[#070C18]/95 p-2 sm:p-2.5 rounded-2xl border border-slate-700/70 backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] min-w-[125px] max-w-[155px]">
      {/* Top Rocker Row: SELECT & START */}
      <div className="w-full flex items-center justify-between gap-1.5">
        <button
          type="button"
          {...makePointerHandlers('select', setSelectPressed)}
          className={`flex-1 py-1 rounded-lg border text-[9px] font-black tracking-wider select-none touch-none transition-all flex items-center justify-center gap-1 ${
            selectPressed
              ? 'bg-cyan-400 text-slate-950 border-cyan-200 shadow-[0_0_15px_rgba(0,240,255,1)] scale-95'
              : 'bg-[#0E1524]/90 text-slate-300 border-slate-700/80 hover:text-white active:scale-95 shadow-sm'
          }`}
        >
          <div className={`w-1 h-1 rounded-full ${selectPressed ? 'bg-black' : 'bg-cyan-400'}`} />
          <span>SELECT</span>
        </button>

        <button
          type="button"
          {...makePointerHandlers('start', setStartPressed)}
          className={`flex-1 py-1 rounded-lg border text-[9px] font-black tracking-wider select-none touch-none transition-all flex items-center justify-center gap-1 ${
            startPressed
              ? 'bg-cyan-400 text-slate-950 border-cyan-200 shadow-[0_0_15px_rgba(0,240,255,1)] scale-95'
              : 'bg-[#0E1524]/90 text-slate-300 border-slate-700/80 hover:text-white active:scale-95 shadow-sm'
          }`}
        >
          <span>START</span>
          <div className={`w-1 h-1 rounded-full ${startPressed ? 'bg-black' : 'bg-cyan-400'}`} />
        </button>
      </div>

      {/* Center Console Row: TURBO, Reactor Orb (Home), SETTINGS */}
      <div className="w-full flex items-center justify-between gap-1.5">
        {/* Turbo Mode Switch */}
        <button
          type="button"
          onClick={handleTurboToggle}
          className={`px-2 py-1 rounded-lg border text-[8px] font-black tracking-wider transition-all flex items-center gap-1 ${
            turboActive
              ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-[0_0_15px_rgba(245,158,11,1)]'
              : 'bg-[#0E1524]/70 text-slate-400 border-slate-700/60 hover:text-slate-200'
          }`}
        >
          <div className={`w-1 h-1 rounded-full ${turboActive ? 'bg-black' : 'bg-amber-400/50'}`} />
          <span>TRB</span>
        </button>

        {/* Console Guide Reactor Orb */}
        <button
          type="button"
          {...makePointerHandlers('home', setHomePressed)}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-black select-none touch-none transition-all relative shrink-0 ${
            homePressed
              ? 'bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-amber-400 text-slate-950 border-white shadow-[0_0_25px_rgba(0,240,255,1)] scale-90'
              : 'bg-gradient-to-br from-[#1E293B] via-[#0E1524] to-[#070B14] text-cyan-300 border-cyan-500/60 shadow-[0_0_18px_rgba(0,240,255,0.35)] hover:border-cyan-300 hover:scale-105'
          }`}
          title="Home / Guide"
        >
          <div className="absolute inset-0.5 rounded-full border border-cyan-400/25 pointer-events-none" />
          <span className="text-sm drop-shadow-[0_0_8px_rgba(0,240,255,0.9)]">❖</span>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="px-2 py-1 rounded-lg border border-slate-700/60 bg-[#0E1524]/70 text-slate-300 hover:text-white hover:border-cyan-400/50 text-[11px] flex items-center justify-center transition-all active:scale-95"
          title="Controller Settings"
        >
          ⚙
        </button>
      </div>

      {/* Row 3: Pop-Out Touchpad Button (Does not shift any layout) */}
      {onToggleTouchpad && (
        <button
          type="button"
          onClick={handleTouchpadClick}
          className={`w-full py-1 px-2 rounded-lg border text-[9px] font-mono font-bold tracking-wider select-none touch-none transition-all flex items-center justify-center gap-1.5 ${
            isTouchpadOpen
              ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 border-white shadow-[0_0_15px_rgba(0,240,255,1)] scale-95'
              : 'bg-cyan-950/30 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/60 active:scale-95 shadow-sm'
          }`}
        >
          <MousePointer className="w-2.5 h-2.5 text-cyan-400" />
          <span>{isTouchpadOpen ? 'CLOSE PAD' : '⌨ TOUCHPAD'}</span>
        </button>
      )}
    </div>
  );
};
