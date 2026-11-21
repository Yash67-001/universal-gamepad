import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ControllerProfileType } from '@universal-gamepad/shared-protocol';
import { triggerHaptic } from '../utils/haptics';

interface ActionButtonsProps {
  layout: ControllerProfileType;
  onButtonChange: (button: 'a' | 'b' | 'x' | 'y', pressed: boolean) => void;
  size?: number; // default 165px
  isIOS?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  layout,
  onButtonChange,
  size = 165,
  isIOS = false,
}) => {
  const [pressed, setPressed] = useState<{ a: boolean; b: boolean; x: boolean; y: boolean }>({
    a: false,
    b: false,
    x: false,
    y: false,
  });

  const buttonPointers = useRef<{ [key: string]: number | null }>({
    a: null,
    b: null,
    x: null,
    y: null,
  });

  const handlePointerDown = (buttonKey: 'a' | 'b' | 'x' | 'y', e: React.PointerEvent<HTMLButtonElement>) => {
    buttonPointers.current[buttonKey] = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    triggerHaptic(18, 0.9, isIOS);

    setPressed((prev) => ({ ...prev, [buttonKey]: true }));
    onButtonChange(buttonKey, true);
  };

  const handlePointerUp = (buttonKey: 'a' | 'b' | 'x' | 'y', e: React.PointerEvent<HTMLButtonElement>) => {
    if (buttonPointers.current[buttonKey] === e.pointerId) {
      buttonPointers.current[buttonKey] = null;
      setPressed((prev) => ({ ...prev, [buttonKey]: false }));
      onButtonChange(buttonKey, false);
    }
  };

  const handlePointerCancel = (buttonKey: 'a' | 'b' | 'x' | 'y', e: React.PointerEvent<HTMLButtonElement>) => {
    if (buttonPointers.current[buttonKey] === e.pointerId) {
      buttonPointers.current[buttonKey] = null;
      setPressed((prev) => ({ ...prev, [buttonKey]: false }));
      onButtonChange(buttonKey, false);
    }
  };

  const resetAll = useCallback(() => {
    buttonPointers.current = { a: null, b: null, x: null, y: null };
    setPressed({ a: false, b: false, x: false, y: false });
    onButtonChange('a', false);
    onButtonChange('b', false);
    onButtonChange('x', false);
    onButtonChange('y', false);
  }, [onButtonChange]);

  useEffect(() => {
    window.addEventListener('blur', resetAll);
    document.addEventListener('visibilitychange', resetAll);
    return () => {
      window.removeEventListener('blur', resetAll);
      document.removeEventListener('visibilitychange', resetAll);
    };
  }, [resetAll]);

  // Labels, colors, and neon glows per profile
  const getLabels = () => {
    if (layout === 'playstation') {
      return {
        bottom: {
          key: 'a' as const,
          label: '✕',
          color: 'text-blue-300',
          glow: 'shadow-[0_0_28px_rgba(59,130,246,1)] bg-gradient-to-b from-blue-400 to-blue-600 border-white text-white',
          border: 'border-blue-500/50',
          ambientGlow: 'bg-blue-500/15',
        },
        right: {
          key: 'b' as const,
          label: '○',
          color: 'text-rose-300',
          glow: 'shadow-[0_0_28px_rgba(244,63,94,1)] bg-gradient-to-b from-rose-400 to-rose-600 border-white text-white',
          border: 'border-rose-500/50',
          ambientGlow: 'bg-rose-500/15',
        },
        left: {
          key: 'x' as const,
          label: '□',
          color: 'text-fuchsia-300',
          glow: 'shadow-[0_0_28px_rgba(232,121,249,1)] bg-gradient-to-b from-fuchsia-400 to-fuchsia-600 border-white text-white',
          border: 'border-fuchsia-500/50',
          ambientGlow: 'bg-fuchsia-500/15',
        },
        top: {
          key: 'y' as const,
          label: '△',
          color: 'text-emerald-300',
          glow: 'shadow-[0_0_28px_rgba(16,185,129,1)] bg-gradient-to-b from-emerald-400 to-emerald-600 border-white text-white',
          border: 'border-emerald-500/50',
          ambientGlow: 'bg-emerald-500/15',
        },
      };
    }
    if (layout === 'nintendo') {
      return {
        bottom: {
          key: 'b' as const,
          label: 'B',
          color: 'text-amber-300',
          glow: 'shadow-[0_0_28px_rgba(245,158,11,1)] bg-gradient-to-b from-amber-400 to-amber-600 border-white text-slate-950 font-black',
          border: 'border-amber-500/50',
          ambientGlow: 'bg-amber-500/15',
        },
        right: {
          key: 'a' as const,
          label: 'A',
          color: 'text-rose-300',
          glow: 'shadow-[0_0_28px_rgba(244,63,94,1)] bg-gradient-to-b from-rose-400 to-rose-600 border-white text-white font-black',
          border: 'border-rose-500/50',
          ambientGlow: 'bg-rose-500/15',
        },
        left: {
          key: 'y' as const,
          label: 'Y',
          color: 'text-emerald-300',
          glow: 'shadow-[0_0_28px_rgba(16,185,129,1)] bg-gradient-to-b from-emerald-400 to-emerald-600 border-white text-white font-black',
          border: 'border-emerald-500/50',
          ambientGlow: 'bg-emerald-500/15',
        },
        top: {
          key: 'x' as const,
          label: 'X',
          color: 'text-cyan-300',
          glow: 'shadow-[0_0_28px_rgba(0,240,255,1)] bg-gradient-to-b from-cyan-400 to-cyan-600 border-white text-slate-950 font-black',
          border: 'border-cyan-500/50',
          ambientGlow: 'bg-cyan-500/15',
        },
      };
    }
    if (layout === 'racing') {
      return {
        bottom: {
          key: 'a' as const,
          label: 'GAS',
          color: 'text-emerald-300',
          glow: 'shadow-[0_0_28px_rgba(16,185,129,1)] bg-gradient-to-b from-emerald-400 to-emerald-600 border-white text-slate-950 font-black',
          border: 'border-emerald-500/50',
          ambientGlow: 'bg-emerald-500/15',
        },
        right: {
          key: 'b' as const,
          label: 'BRK',
          color: 'text-rose-300',
          glow: 'shadow-[0_0_28px_rgba(244,63,94,1)] bg-gradient-to-b from-rose-400 to-rose-600 border-white text-white font-black',
          border: 'border-rose-500/50',
          ambientGlow: 'bg-rose-500/15',
        },
        left: {
          key: 'x' as const,
          label: 'NITRO',
          color: 'text-cyan-300',
          glow: 'shadow-[0_0_28px_rgba(0,240,255,1)] bg-gradient-to-b from-cyan-400 to-cyan-600 border-white text-slate-950 font-black',
          border: 'border-cyan-500/50',
          ambientGlow: 'bg-cyan-500/15',
        },
        top: {
          key: 'y' as const,
          label: 'CAM',
          color: 'text-amber-300',
          glow: 'shadow-[0_0_28px_rgba(245,158,11,1)] bg-gradient-to-b from-amber-400 to-amber-600 border-white text-slate-950 font-black',
          border: 'border-amber-500/50',
          ambientGlow: 'bg-amber-500/15',
        },
      };
    }
    if (layout === 'kbm') {
      return {
        bottom: {
          key: 'a' as const,
          label: 'SPACE',
          color: 'text-emerald-300',
          glow: 'shadow-[0_0_28px_rgba(16,185,129,1)] bg-gradient-to-b from-emerald-400 to-emerald-600 border-white text-slate-950 font-black',
          border: 'border-emerald-500/50',
          ambientGlow: 'bg-emerald-500/15',
        },
        right: {
          key: 'b' as const,
          label: 'CTRL',
          color: 'text-rose-300',
          glow: 'shadow-[0_0_28px_rgba(244,63,94,1)] bg-gradient-to-b from-rose-400 to-rose-600 border-white text-white font-black',
          border: 'border-rose-500/50',
          ambientGlow: 'bg-rose-500/15',
        },
        left: {
          key: 'x' as const,
          label: 'SHIFT',
          color: 'text-cyan-300',
          glow: 'shadow-[0_0_28px_rgba(0,240,255,1)] bg-gradient-to-b from-cyan-400 to-cyan-600 border-white text-slate-950 font-black',
          border: 'border-cyan-500/50',
          ambientGlow: 'bg-cyan-500/15',
        },
        top: {
          key: 'y' as const,
          label: 'E',
          color: 'text-amber-300',
          glow: 'shadow-[0_0_28px_rgba(245,158,11,1)] bg-gradient-to-b from-amber-400 to-amber-600 border-white text-slate-950 font-black',
          border: 'border-amber-500/50',
          ambientGlow: 'bg-amber-500/15',
        },
      };
    }
    if (layout === 'arcade') {
      return {
        bottom: {
          key: 'a' as const,
          label: '1',
          color: 'text-emerald-300',
          glow: 'shadow-[0_0_28px_rgba(16,185,129,1)] bg-gradient-to-b from-emerald-400 to-emerald-600 border-white text-slate-950 font-black',
          border: 'border-emerald-500/50',
          ambientGlow: 'bg-emerald-500/15',
        },
        right: {
          key: 'b' as const,
          label: '2',
          color: 'text-rose-300',
          glow: 'shadow-[0_0_28px_rgba(244,63,94,1)] bg-gradient-to-b from-rose-400 to-rose-600 border-white text-white font-black',
          border: 'border-rose-500/50',
          ambientGlow: 'bg-rose-500/15',
        },
        left: {
          key: 'x' as const,
          label: '3',
          color: 'text-cyan-300',
          glow: 'shadow-[0_0_28px_rgba(0,240,255,1)] bg-gradient-to-b from-cyan-400 to-cyan-600 border-white text-slate-950 font-black',
          border: 'border-cyan-500/50',
          ambientGlow: 'bg-cyan-500/15',
        },
        top: {
          key: 'y' as const,
          label: '4',
          color: 'text-amber-300',
          glow: 'shadow-[0_0_28px_rgba(245,158,11,1)] bg-gradient-to-b from-amber-400 to-amber-600 border-white text-slate-950 font-black',
          border: 'border-amber-500/50',
          ambientGlow: 'bg-amber-500/15',
        },
      };
    }
    if (layout === 'generic') {
      return {
        bottom: {
          key: 'a' as const,
          label: 'S',
          color: 'text-emerald-300',
          glow: 'shadow-[0_0_28px_rgba(16,185,129,1)] bg-gradient-to-b from-emerald-400 to-emerald-600 border-white text-slate-950 font-black',
          border: 'border-emerald-500/50',
          ambientGlow: 'bg-emerald-500/15',
        },
        right: {
          key: 'b' as const,
          label: 'E',
          color: 'text-rose-300',
          glow: 'shadow-[0_0_28px_rgba(244,63,94,1)] bg-gradient-to-b from-rose-400 to-rose-600 border-white text-white font-black',
          border: 'border-rose-500/50',
          ambientGlow: 'bg-rose-500/15',
        },
        left: {
          key: 'x' as const,
          label: 'W',
          color: 'text-cyan-300',
          glow: 'shadow-[0_0_28px_rgba(0,240,255,1)] bg-gradient-to-b from-cyan-400 to-cyan-600 border-white text-slate-950 font-black',
          border: 'border-cyan-500/50',
          ambientGlow: 'bg-cyan-500/15',
        },
        top: {
          key: 'y' as const,
          label: 'N',
          color: 'text-amber-300',
          glow: 'shadow-[0_0_28px_rgba(245,158,11,1)] bg-gradient-to-b from-amber-400 to-amber-600 border-white text-slate-950 font-black',
          border: 'border-amber-500/50',
          ambientGlow: 'bg-amber-500/15',
        },
      };
    }
    // Default Xbox
    return {
      bottom: {
        key: 'a' as const,
        label: 'A',
        color: 'text-emerald-300',
        glow: 'shadow-[0_0_28px_rgba(16,185,129,1)] bg-gradient-to-b from-emerald-400 to-emerald-600 border-white text-white font-black',
        border: 'border-emerald-500/50',
        ambientGlow: 'bg-emerald-500/15',
      },
      right: {
        key: 'b' as const,
        label: 'B',
        color: 'text-rose-300',
        glow: 'shadow-[0_0_28px_rgba(244,63,94,1)] bg-gradient-to-b from-rose-400 to-rose-600 border-white text-white font-black',
        border: 'border-rose-500/50',
        ambientGlow: 'bg-rose-500/15',
      },
      left: {
        key: 'x' as const,
        label: 'X',
        color: 'text-cyan-300',
        glow: 'shadow-[0_0_28px_rgba(0,240,255,1)] bg-gradient-to-b from-cyan-400 to-cyan-600 border-white text-slate-950 font-black',
        border: 'border-cyan-500/50',
        ambientGlow: 'bg-cyan-500/15',
      },
      top: {
        key: 'y' as const,
        label: 'Y',
        color: 'text-amber-300',
        glow: 'shadow-[0_0_28px_rgba(245,158,11,1)] bg-gradient-to-b from-amber-400 to-amber-600 border-white text-slate-950 font-black',
        border: 'border-amber-500/50',
        ambientGlow: 'bg-amber-500/15',
      },
    };
  };

  const labels = getLabels();
  // Inset button sizing: comfortable 33% diameter leaves 34% center clearance and guaranteed outer breathing room
  const btnSize = Math.max(34, Math.round(size * 0.33));
  const fontSize = Math.max(13, Math.round(btnSize * 0.44));

  const renderButton = (
    item: {
      key: 'a' | 'b' | 'x' | 'y';
      label: string;
      color: string;
      glow: string;
      border: string;
      ambientGlow: string;
    },
    posClass: string
  ) => {
    const isBtnPressed = pressed[item.key];
    const len = item.label.length;
    const dynamicFontSize =
      len >= 5
        ? Math.max(7, Math.round(btnSize * 0.22))
        : len >= 3
        ? Math.max(8, Math.round(btnSize * 0.27))
        : fontSize;
    return (
      <div
        key={item.key}
        style={{ width: `${btnSize}px`, height: `${btnSize}px` }}
        className={`absolute ${posClass} flex items-center justify-center`}
      >
        {/* Subtle Ambient Halo beneath button */}
        <div
          className={`absolute inset-0 rounded-full blur-md transition-opacity pointer-events-none ${
            isBtnPressed ? 'opacity-100 scale-125' : 'opacity-40'
          } ${item.ambientGlow}`}
        />

        <button
          type="button"
          onPointerDown={(e) => handlePointerDown(item.key, e)}
          onPointerUp={(e) => handlePointerUp(item.key, e)}
          onPointerCancel={(e) => handlePointerCancel(item.key, e)}
          style={{ width: `${btnSize}px`, height: `${btnSize}px`, fontSize: `${dynamicFontSize}px` }}
          className={`relative rounded-full border-2 flex items-center justify-center select-none touch-none transition-all duration-75 overflow-hidden active:scale-90 ${
            isBtnPressed
              ? `${item.glow} scale-90 ring-2 ring-white/60`
              : `bg-gradient-to-b from-[#24314A] via-[#121A2C] to-[#080D18] ${item.color} ${item.border} shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:scale-105`
          }`}
        >
          {/* Specular Jewel Highlight Arc */}
          <div className="absolute inset-x-1.5 top-0.5 h-[38%] rounded-t-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

          {/* Button Character Label */}
          <span className="relative z-10 font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
            {item.label}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className="relative select-none touch-none flex items-center justify-center shrink-0"
    >
      {/* Precision Diamond Mounting Chassis */}
      <div className="absolute w-[68%] h-[68%] border border-slate-700/70 rotate-45 pointer-events-none rounded-2xl bg-gradient-to-br from-slate-900/50 via-slate-950/70 to-[#060A14] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
      <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-700/80 pointer-events-none shadow-[0_0_6px_rgba(0,0,0,0.9)]" />

      {/* Inset diamond placement: 5% inset guarantees buttons never scrape pod boundaries */}
      {renderButton(labels.top, 'top-[5%] left-1/2 -translate-x-1/2')}
      {renderButton(labels.bottom, 'bottom-[5%] left-1/2 -translate-x-1/2')}
      {renderButton(labels.left, 'left-[5%] top-1/2 -translate-y-1/2')}
      {renderButton(labels.right, 'right-[5%] top-1/2 -translate-y-1/2')}
    </div>
  );
};
