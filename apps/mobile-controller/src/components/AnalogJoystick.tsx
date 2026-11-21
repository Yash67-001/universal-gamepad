import React, { useRef, useState, useEffect, useCallback } from 'react';
import { JoystickConfig } from '@universal-gamepad/shared-protocol';
import { applyRadialDeadzone, touchOffsetToNormalized } from '@universal-gamepad/controller-core';
import { triggerHaptic } from '../utils/haptics';

interface AnalogJoystickProps {
  label: string; // "LS" or "RS"
  clickLabel: string; // "L3" or "R3"
  config: JoystickConfig;
  onMove: (x: number, y: number) => void;
  onClickToggle: (pressed: boolean) => void;
  size?: number; // default 145px
  isIOS?: boolean;
}

export const AnalogJoystick: React.FC<AnalogJoystickProps> = ({
  label,
  clickLabel,
  config,
  onMove,
  onClickToggle,
  size = 145,
  isIOS = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  const activePointerId = useRef<number | null>(null);
  const activeTouchId = useRef<number | null>(null);
  const centerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [isStickClicked, setIsStickClicked] = useState(false);

  const maxRadius = size / 2;
  const knobRadius = size * 0.28;

  const resetStick = useCallback(() => {
    activePointerId.current = null;
    activeTouchId.current = null;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
    if (lineRef.current) {
      lineRef.current.setAttribute('x2', (size / 2).toString());
      lineRef.current.setAttribute('y2', (size / 2).toString());
    }
    if (hudRef.current) {
      hudRef.current.textContent = '';
    }
    setIsPressed(false);
    onMove(0, 0);
  }, [onMove, size]);

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      const deltaX = clientX - centerPos.current.x;
      const deltaY = clientY - centerPos.current.y;

      const rawNormalized = touchOffsetToNormalized(deltaX, deltaY, maxRadius);
      const finalPoint = applyRadialDeadzone(rawNormalized.x, rawNormalized.y, config);

      // Visual knob offset clamped to max boundary
      const visualDist = Math.hypot(deltaX, deltaY);
      const clampedDist = Math.min(maxRadius - knobRadius * 0.45, visualDist);
      const angle = Math.atan2(deltaY, deltaX);
      const kX = Math.cos(angle) * clampedDist;
      const kY = Math.sin(angle) * clampedDist;

      // DIRECT GPU DOM UPDATE (Zero React re-render bottleneck at 120Hz!)
      if (knobRef.current) {
        knobRef.current.style.transform = `translate3d(${kX}px, ${kY}px, 0)`;
      }
      if (lineRef.current) {
        lineRef.current.setAttribute('x2', (size / 2 + kX).toString());
        lineRef.current.setAttribute('y2', (size / 2 + kY).toString());
      }
      if (hudRef.current) {
        const deg = Math.round(((angle * 180) / Math.PI + 360) % 360);
        const mag = Math.min(100, Math.round((clampedDist / (maxRadius - knobRadius * 0.45)) * 100));
        hudRef.current.textContent = `${deg}° • ${mag}%`;
      }

      onMove(finalPoint.x, finalPoint.y);
    },
    [config, maxRadius, knobRadius, onMove, size]
  );

  const startTracking = (clientX: number, clientY: number, pointerId?: number, touchId?: number) => {
    if (pointerId !== undefined) activePointerId.current = pointerId;
    if (touchId !== undefined) activeTouchId.current = touchId;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      centerPos.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setIsPressed(true);
    updatePosition(clientX, clientY);
  };

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If touch was already registered, let touch handler lead
    if (activeTouchId.current !== null) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    startTracking(e.clientX, e.clientY, e.pointerId, undefined);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== null && activePointerId.current === e.pointerId) {
      updatePosition(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current === e.pointerId || activePointerId.current === null) {
      resetStick();
    }
  };

  // Touch Event Handlers (Native multi-touch on iOS Safari and Android Chrome)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    startTracking(touch.clientX, touch.clientY, undefined, touch.identifier);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    if (activeTouchId.current === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouchId.current) {
        updatePosition(e.touches[i].clientX, e.touches[i].clientY);
        return;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (activeTouchId.current === null) {
      resetStick();
      return;
    }
    // Check if our touch finished
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId.current) {
        resetStick();
        return;
      }
    }
    // Or if our touch is no longer in touches list
    let stillPresent = false;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouchId.current) {
        stillPresent = true;
        break;
      }
    }
    if (!stillPresent) {
      resetStick();
    }
  };

  const handleStickClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const next = !isStickClicked;
    setIsStickClicked(next);
    triggerHaptic('medium', 1.0, isIOS);
    onClickToggle(next);
  };

  // Global Multi-layer Window & Document Failsafes
  useEffect(() => {
    const handleGlobalPointerRelease = (e: PointerEvent) => {
      if (activePointerId.current === e.pointerId || activePointerId.current === null) {
        resetStick();
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      // 1. If no touches remain on screen, always snap to center
      if (e.touches.length === 0) {
        resetStick();
        return;
      }

      // 2. If this stick has an active touch, check if it's still alive
      if (activeTouchId.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId.current) {
            resetStick();
            return;
          }
        }
        let found = false;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === activeTouchId.current) {
            found = true;
            break;
          }
        }
        if (!found) {
          resetStick();
        }
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      // Self-healing check: if stick is deflected but active touch ID is missing from active touches, auto-heal!
      if (activeTouchId.current !== null) {
        let found = false;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === activeTouchId.current) {
            found = true;
            break;
          }
        }
        if (!found) {
          resetStick();
        }
      }
    };

    const handleWindowBlur = () => resetStick();

    window.addEventListener('pointerup', handleGlobalPointerRelease, { passive: true });
    window.addEventListener('pointercancel', handleGlobalPointerRelease, { passive: true });
    window.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleGlobalTouchEnd, { passive: true });
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('contextmenu', handleWindowBlur);
    document.addEventListener('visibilitychange', handleWindowBlur);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerRelease);
      window.removeEventListener('pointercancel', handleGlobalPointerRelease);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('contextmenu', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleWindowBlur);
    };
  }, [resetStick]);

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className="relative select-none touch-none flex items-center justify-center shrink-0"
    >
      {/* Outer Pod with Cyber Ring & Knurled Bevel */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`relative rounded-full transition-colors duration-150 touch-none flex items-center justify-center p-1.5 knurled-edge ${
          isPressed
            ? 'border-2 border-cyan-400 glow-cyan-intense bg-[#0A1220]/90'
            : 'border border-slate-700/60 bg-[#070B14]/80 shadow-[0_12px_30px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Futuristic Radar Concentric Rings */}
        <div className="absolute inset-2 rounded-full border border-slate-800/80 pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-slate-800/40 pointer-events-none" />

        {/* Ambient Laser Sweep Radar Beam */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-20">
          <div className="w-full h-full bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent animate-laser-sweep" />
        </div>

        {/* Outer Directional Ticks (N, S, E, W) */}
        <div className="absolute top-1 w-2 h-1 bg-cyan-400/70 rounded-full pointer-events-none shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
        <div className="absolute bottom-1 w-2 h-1 bg-cyan-400/70 rounded-full pointer-events-none shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
        <div className="absolute left-1 w-1 h-2 bg-cyan-400/70 rounded-full pointer-events-none shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
        <div className="absolute right-1 w-1 h-2 bg-cyan-400/70 rounded-full pointer-events-none shadow-[0_0_6px_rgba(0,240,255,0.8)]" />

        {/* Deadzone Boundary Ring */}
        <div
          style={{
            width: `${size * config.deadzone * 2}px`,
            height: `${size * config.deadzone * 2}px`,
          }}
          className="absolute rounded-full border border-dashed border-cyan-500/30 pointer-events-none"
        />

        {/* SVG Laser Deflection Vector Line */}
        <svg className={`absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0 ${isPressed ? 'opacity-100' : 'opacity-0'}`}>
          <line
            ref={lineRef}
            x1={size / 2}
            y1={size / 2}
            x2={size / 2}
            y2={size / 2}
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeDasharray="3 2"
            className="drop-shadow-[0_0_8px_rgba(0,240,255,0.9)]"
          />
        </svg>

        {/* Laser Crosshairs */}
        <div className="absolute w-full h-[1px] bg-cyan-500/10 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-cyan-500/10 pointer-events-none" />

        {/* Floating In-Pod Telemetry HUD (Direct DOM, Zero Layout Shift) */}
        <div
          ref={hudRef}
          className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded-full border border-cyan-500/50 shadow-[0_0_8px_rgba(0,240,255,0.4)] pointer-events-none z-20 whitespace-nowrap ${
            isPressed ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* 3D Concave Stick Cap (GPU-Accelerated translate3d via direct DOM ref) */}
        <div
          ref={knobRef}
          style={{
            width: `${knobRadius * 2}px`,
            height: `${knobRadius * 2}px`,
            transform: 'translate3d(0px, 0px, 0)',
            willChange: 'transform',
          }}
          className={`absolute rounded-full flex flex-col items-center justify-center font-black pointer-events-none stick-cap z-10 ${
            isPressed
              ? 'border-2 border-cyan-300 shadow-[0_0_30px_rgba(0,240,255,1)] scale-105'
              : 'border border-slate-600/70'
          }`}
        >
          {/* Inner Glowing Reactor Core */}
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
              isPressed
                ? 'bg-cyan-400 shadow-[0_0_15px_rgba(0,240,255,1)] scale-110'
                : 'bg-slate-700/80 border border-slate-500'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/95" />
          </div>
          <span className="text-[9px] font-mono tracking-tighter text-slate-300 mt-0.5 font-bold">
            {label}
          </span>
        </div>
      </div>

      {/* Sleek Integrated Stick Click Pill Badge (Zero Vertical Layout Shift) */}
      <button
        type="button"
        onClick={handleStickClick}
        className={`absolute -top-1.5 right-0 z-30 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold tracking-wider transition-all border ${
          isStickClicked
            ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_15px_rgba(0,240,255,1)] scale-105'
            : 'bg-slate-900/90 text-cyan-300/80 border-slate-700/80 hover:border-cyan-400 active:scale-95 shadow-md'
        }`}
      >
        {clickLabel} {isStickClicked ? 'ON' : ''}
      </button>
    </div>
  );
};
