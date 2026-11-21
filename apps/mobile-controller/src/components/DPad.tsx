import React, { useRef, useState, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface DPadProps {
  onDirectionChange: (dir: { up: boolean; down: boolean; left: boolean; right: boolean }) => void;
  size?: number; // default 155px
  isIOS?: boolean;
}

export const DPad: React.FC<DPadProps> = ({ onDirectionChange, size = 155, isIOS = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const [activeDirs, setActiveDirs] = useState({ up: false, down: false, left: false, right: false });

  const updateDirectionsFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Deadzone at center
      if (dist < (size / 2) * 0.18) {
        const none = { up: false, down: false, left: false, right: false };
        setActiveDirs(none);
        onDirectionChange(none);
        return;
      }

      const angle = Math.atan2(dy, dx);
      const deg = (angle * 180) / Math.PI;

      const right = deg >= -67.5 && deg <= 67.5;
      const down = deg >= 22.5 && deg <= 157.5;
      const left = deg >= 112.5 || deg <= -112.5;
      const up = deg >= -157.5 && deg <= -22.5;

      const newDirs = { up, down, left, right };
      setActiveDirs(newDirs);
      onDirectionChange(newDirs);
    },
    [onDirectionChange, size]
  );

  const resetDPad = useCallback(() => {
    activePointerId.current = null;
    const none = { up: false, down: false, left: false, right: false };
    setActiveDirs(none);
    onDirectionChange(none);
  }, [onDirectionChange]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    triggerHaptic(15, 0.8, isIOS);
    updateDirectionsFromPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current === e.pointerId) {
      updateDirectionsFromPoint(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current === e.pointerId) {
      resetDPad();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current === e.pointerId) {
      resetDPad();
    }
  };

  useEffect(() => {
    const handleGlobalCancel = () => resetDPad();
    window.addEventListener('blur', handleGlobalCancel);
    document.addEventListener('visibilitychange', handleGlobalCancel);
    return () => {
      window.removeEventListener('blur', handleGlobalCancel);
      document.removeEventListener('visibilitychange', handleGlobalCancel);
    };
  }, [resetDPad]);

  const isAnyActive = activeDirs.up || activeDirs.down || activeDirs.left || activeDirs.right;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ width: `${size}px`, height: `${size}px` }}
      className="relative select-none touch-none flex items-center justify-center p-1 shrink-0"
    >
      {/* Outer Halo Glow when active */}
      {isAnyActive && (
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl pointer-events-none animate-pulse" />
      )}

      {/* Cross Beveled Molded Chassis with Chamfered Highlights */}
      <div className="absolute w-[34%] h-[86%] bg-gradient-to-b from-[#24314A] via-[#0E1524] to-[#070B14] rounded-xl border border-slate-700/80 shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]" />
      <div className="absolute h-[34%] w-[86%] bg-gradient-to-r from-[#24314A] via-[#0E1524] to-[#070B14] rounded-xl border border-slate-700/80 shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]" />

      {/* Up Wing */}
      <div
        className={`absolute top-[7%] w-[34%] h-[29%] rounded-t-xl flex flex-col items-center justify-center transition-all ${
          activeDirs.up
            ? 'bg-gradient-to-b from-cyan-400 to-cyan-600 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,1)] scale-95 border-t border-cyan-200'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className="font-black text-xs tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">▲</span>
        <div className={`w-2.5 h-0.5 mt-0.5 rounded-full ${activeDirs.up ? 'bg-white shadow-[0_0_8px_white]' : 'bg-slate-700/60'}`} />
      </div>

      {/* Down Wing */}
      <div
        className={`absolute bottom-[7%] w-[34%] h-[29%] rounded-b-xl flex flex-col items-center justify-center transition-all ${
          activeDirs.down
            ? 'bg-gradient-to-t from-cyan-400 to-cyan-600 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,1)] scale-95 border-b border-cyan-200'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`w-2.5 h-0.5 mb-0.5 rounded-full ${activeDirs.down ? 'bg-white shadow-[0_0_8px_white]' : 'bg-slate-700/60'}`} />
        <span className="font-black text-xs tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">▼</span>
      </div>

      {/* Left Wing */}
      <div
        className={`absolute left-[7%] h-[34%] w-[29%] rounded-l-xl flex items-center justify-center transition-all ${
          activeDirs.left
            ? 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,1)] scale-95 border-l border-cyan-200'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className="font-black text-xs tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">◀</span>
      </div>

      {/* Right Wing */}
      <div
        className={`absolute right-[7%] h-[34%] w-[29%] rounded-r-xl flex items-center justify-center transition-all ${
          activeDirs.right
            ? 'bg-gradient-to-l from-cyan-400 to-cyan-600 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,1)] scale-95 border-r border-cyan-200'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className="font-black text-xs tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">▶</span>
      </div>

      {/* Center Pivot with Concentric Laser Ring */}
      <div className="absolute w-[28%] h-[28%] rounded-full bg-gradient-to-br from-[#1E283D] to-[#080D18] border border-slate-700/90 flex items-center justify-center pointer-events-none shadow-inner">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            isAnyActive
              ? 'bg-cyan-400 shadow-[0_0_12px_rgba(0,240,255,1)] scale-110'
              : 'bg-cyan-500/30 border border-cyan-400/50'
          }`}
        />
      </div>
    </div>
  );
};
