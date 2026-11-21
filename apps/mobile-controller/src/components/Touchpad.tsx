import React, { useRef, useState, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { MousePointer, ChevronUp, ChevronDown, X } from 'lucide-react';

interface TouchpadProps {
  onMouseMove: (dx: number, dy: number) => void;
  onMouseClick: (button: 'left' | 'right', down: boolean) => void;
  onMouseScroll?: (deltaY: number) => void;
  onClose?: () => void;
  isIOS?: boolean;
  width?: number | string;
  height?: number | string;
}

export const Touchpad: React.FC<TouchpadProps> = ({
  onMouseMove,
  onMouseClick,
  onMouseScroll,
  onClose,
  isIOS = false,
  width = '100%',
  height = '100%',
}) => {
  const padRef = useRef<HTMLDivElement>(null);
  const pointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerStartTime = useRef<number>(0);
  const totalTravel = useRef<number>(0);
  const lastHapticDist = useRef<number>(0);
  const activePointerId = useRef<number | null>(null);
  const touchFingerCount = useRef<number>(1);

  const [isHovered, setIsHovered] = useState(false);
  const [leftClickDown, setLeftClickDown] = useState(false);
  const [rightClickDown, setRightClickDown] = useState(false);
  const [telemetry, setTelemetry] = useState<string>('AIM // READY');

  // Reticle feedback DOM ref for 120Hz smooth zero-react-render tracking
  const reticleRef = useRef<HTMLDivElement>(null);

  // Unified start handler for both Pointer and Touch events
  const onStartInteraction = (clientX: number, clientY: number, pointerId?: number) => {
    if (pointerId !== undefined) {
      activePointerId.current = pointerId;
    }
    pointerPos.current = { x: clientX, y: clientY };
    pointerStartTime.current = Date.now();
    totalTravel.current = 0;
    lastHapticDist.current = 0;
    setIsHovered(true);

    if (reticleRef.current && padRef.current) {
      const rect = padRef.current.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      reticleRef.current.style.transform = `translate3d(${localX}px, ${localY}px, 0)`;
      reticleRef.current.style.opacity = '1';
    }
  };

  // Unified move handler
  const onMoveInteraction = (clientX: number, clientY: number, pointerId?: number) => {
    if (pointerId !== undefined && activePointerId.current !== null && activePointerId.current !== pointerId) {
      return;
    }

    const rawDx = clientX - pointerPos.current.x;
    const rawDy = clientY - pointerPos.current.y;
    pointerPos.current = { x: clientX, y: clientY };

    const dist = Math.hypot(rawDx, rawDy);
    totalTravel.current += dist;

    // Subtle tactile selection tick every ~45px of glide across trackpad
    if (totalTravel.current - lastHapticDist.current >= 45) {
      lastHapticDist.current = totalTravel.current;
      triggerHaptic('selection', 0.6, isIOS);
    }

    // Ballistic acceleration curve for desktop mouse control:
    // Small slow movements are high-precision (2.4x factor)
    // Fast swipes accelerate smoothly across the screen (up to 4.8x factor)
    const accel = Math.min(4.8, 2.4 + dist * 0.12);
    const scaledDx = rawDx * accel;
    const scaledDy = rawDy * accel;

    // Check if touch is on right 15% edge for vertical scrolling
    if (padRef.current && onMouseScroll) {
      const rect = padRef.current.getBoundingClientRect();
      const relativeX = (clientX - rect.left) / rect.width;
      if (relativeX > 0.85) {
        onMouseScroll(-rawDy * 3.5);
        setTelemetry(`SCROLL // ${(-rawDy).toFixed(0)}px`);
        return;
      }
    }

    onMouseMove(scaledDx, scaledDy);
    setTelemetry(
      `DX: ${scaledDx > 0 ? '+' : ''}${scaledDx.toFixed(0)}  DY: ${scaledDy > 0 ? '+' : ''}${scaledDy.toFixed(0)}`
    );

    if (reticleRef.current && padRef.current) {
      const rect = padRef.current.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      reticleRef.current.style.transform = `translate3d(${localX}px, ${localY}px, 0)`;
    }
  };

  // Unified end handler
  const onEndInteraction = () => {
    activePointerId.current = null;
    setIsHovered(false);

    if (reticleRef.current) {
      reticleRef.current.style.opacity = '0';
    }

    // Tap-to-Click detection: if finger tapped for < 320ms and moved < 18px
    const duration = Date.now() - pointerStartTime.current;
    if (duration < 320 && totalTravel.current < 18) {
      if (touchFingerCount.current >= 2) {
        // Two-Finger Tap -> Right Click!
        triggerHaptic('heavy', 1.0, isIOS);
        onMouseClick('right', true);
        setTimeout(() => onMouseClick('right', false), 40);
        setTelemetry('2-FINGER // RIGHT CLICK');
      } else {
        // One-Finger Tap -> Left Click!
        triggerHaptic('heavy', 1.0, isIOS);
        onMouseClick('left', true);
        setTimeout(() => onMouseClick('left', false), 40);
        setTelemetry('LEFT TAP // CLICK');
      }
    } else {
      setTelemetry('AIM // IDLE');
    }
    touchFingerCount.current = 1;
  };

  // Pointer Event Handlers
  const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    onStartInteraction(e.clientX, e.clientY, e.pointerId);
  };

  const handlePadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onMoveInteraction(e.clientX, e.clientY, e.pointerId);
  };

  const handlePadPointerUp = () => {
    onEndInteraction();
  };

  // Direct Touch Event Handlers (High-priority on iOS Safari to bypass browser gesture cancellations)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchFingerCount.current = e.touches.length;
    if (e.touches.length > 0) {
      const t = e.touches[0];
      onStartInteraction(t.clientX, t.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    if (e.touches.length > touchFingerCount.current) {
      touchFingerCount.current = e.touches.length;
    }
    if (e.touches.length > 0) {
      const t = e.touches[0];
      onMoveInteraction(t.clientX, t.clientY);
    }
  };

  const handleTouchEnd = () => {
    onEndInteraction();
  };

  const handleLeftDown = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setLeftClickDown(true);
    triggerHaptic('heavy', 1.0, isIOS);
    onMouseClick('left', true);
  };
  const handleLeftUp = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setLeftClickDown(false);
    onMouseClick('left', false);
  };

  const handleRightDown = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setRightClickDown(true);
    triggerHaptic('heavy', 1.0, isIOS);
    onMouseClick('right', true);
  };
  const handleRightUp = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setRightClickDown(false);
    onMouseClick('right', false);
  };

  // Safety flush on blur
  useEffect(() => {
    const handleReset = () => {
      activePointerId.current = null;
      setIsHovered(false);
      setLeftClickDown(false);
      setRightClickDown(false);
      onMouseClick('left', false);
      onMouseClick('right', false);
    };
    window.addEventListener('blur', handleReset);
    return () => window.removeEventListener('blur', handleReset);
  }, [onMouseClick]);

  return (
    <div
      style={{ width, height }}
      className="flex flex-col rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#0F172A]/95 via-[#0A0F1D]/98 to-[#050811]/100 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden select-none touch-none relative"
    >
      {/* Top Trackpad Header Strip */}
      <div className="w-full flex items-center justify-between px-2.5 py-1 bg-slate-900/80 border-b border-cyan-500/20 text-[9px] font-mono">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <MousePointer className="w-3 h-3 text-cyan-400" />
          <span className="font-black tracking-wider">TRACKPAD</span>
          <span className="text-slate-500">•</span>
          <span className="text-[8px] text-cyan-400/80 font-bold">{telemetry}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[8px] text-slate-400 hidden sm:inline">TAP TO CLICK</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Trackpad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Touch Sensing Surface */}
      <div
        ref={padRef}
        onPointerDown={handlePadPointerDown}
        onPointerMove={handlePadPointerMove}
        onPointerUp={handlePadPointerUp}
        onPointerCancel={handlePadPointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`flex-1 relative touch-none cursor-crosshair overflow-hidden transition-colors ${
          isHovered
            ? 'bg-cyan-950/20 shadow-[inset_0_0_20px_rgba(0,240,255,0.15)]'
            : 'bg-transparent'
        }`}
      >
        {/* Futuristic Laser Crosshair Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Center Aiming Reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-16 h-16 rounded-full border border-dashed border-cyan-400" />
          <div className="absolute w-2 h-2 rounded-full bg-cyan-400" />
        </div>

        {/* 120Hz GPU Laser Reticle that follows finger */}
        <div
          ref={reticleRef}
          style={{ transform: 'translate3d(0px, 0px, 0)', opacity: 0 }}
          className="absolute -top-3 -left-3 w-6 h-6 rounded-full border border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,1)] pointer-events-none transition-opacity duration-150 z-20 flex items-center justify-center"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_white]" />
        </div>

        {/* Right Edge Scroll Indicator Strip */}
        <div className="absolute right-0 top-0 bottom-0 w-[14%] bg-gradient-to-l from-cyan-950/40 to-transparent border-l border-cyan-500/10 pointer-events-none flex flex-col items-center justify-between py-2 text-[7px] text-cyan-400/40 font-mono font-bold">
          <ChevronUp className="w-2.5 h-2.5 text-cyan-400/50" />
          <span className="rotate-90 tracking-widest">SCROLL</span>
          <ChevronDown className="w-2.5 h-2.5 text-cyan-400/50" />
        </div>
      </div>

      {/* Bottom Physical Click Bar: Left Click and Right Click */}
      <div className="w-full flex items-stretch border-t border-slate-800 bg-[#070B14]">
        {/* Left Click Trigger Button */}
        <button
          type="button"
          onPointerDown={handleLeftDown}
          onPointerUp={handleLeftUp}
          onPointerCancel={handleLeftUp}
          onTouchStart={(e) => { e.preventDefault(); handleLeftDown(e); }}
          onTouchEnd={(e) => { e.preventDefault(); handleLeftUp(e); }}
          onTouchCancel={(e) => { e.preventDefault(); handleLeftUp(e); }}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-black font-mono tracking-wider border-r border-slate-800 select-none touch-none transition-all ${
            leftClickDown
              ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,1)] scale-[0.98]'
              : 'bg-[#0E1524]/90 text-cyan-300 hover:text-white hover:bg-cyan-950/40 active:scale-[0.98]'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${leftClickDown ? 'bg-black' : 'bg-cyan-400'}`} />
          <span>LEFT CLICK</span>
        </button>

        {/* Right Click Trigger Button */}
        <button
          type="button"
          onPointerDown={handleRightDown}
          onPointerUp={handleRightUp}
          onPointerCancel={handleRightUp}
          onTouchStart={(e) => { e.preventDefault(); handleRightDown(e); }}
          onTouchEnd={(e) => { e.preventDefault(); handleRightUp(e); }}
          onTouchCancel={(e) => { e.preventDefault(); handleRightUp(e); }}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-black font-mono tracking-wider select-none touch-none transition-all ${
            rightClickDown
              ? 'bg-gradient-to-r from-fuchsia-400 to-fuchsia-500 text-white shadow-[0_0_15px_rgba(232,121,249,1)] scale-[0.98]'
              : 'bg-[#0E1524]/90 text-fuchsia-300 hover:text-white hover:bg-fuchsia-950/40 active:scale-[0.98]'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${rightClickDown ? 'bg-white' : 'bg-fuchsia-400'}`} />
          <span>RIGHT CLICK</span>
        </button>
      </div>
    </div>
  );
};
