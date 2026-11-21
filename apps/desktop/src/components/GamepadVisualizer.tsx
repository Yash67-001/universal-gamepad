import React from 'react';
import { ControllerState } from '@universal-gamepad/shared-protocol';

interface GamepadVisualizerProps {
  state: ControllerState;
}

export const GamepadVisualizer: React.FC<GamepadVisualizerProps> = ({ state }) => {
  const { buttons, axes, triggers } = state;

  return (
    <div className="bg-gamepad-surface border border-gamepad-border rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-base text-white tracking-wide">LIVE INPUT TESTER</h2>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800">
          60Hz / 120Hz Real-Time Stream
        </span>
      </div>

      {/* Controller Chassis Mockup */}
      <div className="relative w-full max-w-xl mx-auto p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col gap-6">
        {/* Bumpers & Triggers Row */}
        <div className="flex items-center justify-between px-4">
          {/* Left Triggers */}
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                triggers.l2 > 0.05
                  ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.8)]'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              L2: {Math.round(triggers.l2 * 100)}%
            </div>
            <div
              className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                buttons.l1
                  ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.8)]'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              L1
            </div>
          </div>

          {/* Right Triggers */}
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                buttons.r1
                  ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.8)]'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              R1
            </div>
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                triggers.r2 > 0.05
                  ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.8)]'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              R2: {Math.round(triggers.r2 * 100)}%
            </div>
          </div>
        </div>

        {/* Center Main Controller Area */}
        <div className="flex items-center justify-between px-4">
          {/* Left Wing: D-Pad and Left Stick Vector */}
          <div className="flex items-center gap-5">
            {/* D-Pad */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div
                className={`absolute top-0 w-7 h-7 rounded-t-md flex items-center justify-center text-xs font-bold border ${
                  buttons.dpadUp
                    ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                ▲
              </div>
              <div
                className={`absolute bottom-0 w-7 h-7 rounded-b-md flex items-center justify-center text-xs font-bold border ${
                  buttons.dpadDown
                    ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                ▼
              </div>
              <div
                className={`absolute left-0 w-7 h-7 rounded-l-md flex items-center justify-center text-xs font-bold border ${
                  buttons.dpadLeft
                    ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                ◀
              </div>
              <div
                className={`absolute right-0 w-7 h-7 rounded-r-md flex items-center justify-center text-xs font-bold border ${
                  buttons.dpadRight
                    ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                ▶
              </div>
              <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800" />
            </div>

            {/* Left Analog Stick Visualizer */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
                <div className="absolute w-full h-[1px] bg-slate-800" />
                <div className="absolute h-full w-[1px] bg-slate-800" />
                {/* Knob */}
                <div
                  style={{
                    transform: `translate(${axes.leftX * 24}px, ${-axes.leftY * 24}px)`,
                  }}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold shadow-md transition-transform ${
                    buttons.l3
                      ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                      : Math.hypot(axes.leftX, axes.leftY) > 0.05
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-slate-800 text-slate-400 border-slate-600'
                  }`}
                >
                  LS
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                X:{axes.leftX.toFixed(2)} Y:{axes.leftY.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Center Cluster */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  buttons.select
                    ? 'bg-cyan-400 text-black border-cyan-300'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                SELECT
              </span>
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  buttons.home
                    ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                ❖
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  buttons.start
                    ? 'bg-cyan-400 text-black border-cyan-300'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                START
              </span>
            </div>

            {buttons.turbo && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-bold">
                TURBO ENGAGED
              </span>
            )}
          </div>

          {/* Right Wing: Right Stick Vector & Face Buttons */}
          <div className="flex items-center gap-5">
            {/* Right Analog Stick Visualizer */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
                <div className="absolute w-full h-[1px] bg-slate-800" />
                <div className="absolute h-full w-[1px] bg-slate-800" />
                {/* Knob */}
                <div
                  style={{
                    transform: `translate(${axes.rightX * 24}px, ${-axes.rightY * 24}px)`,
                  }}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold shadow-md transition-transform ${
                    buttons.r3
                      ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                      : Math.hypot(axes.rightX, axes.rightY) > 0.05
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-slate-800 text-slate-400 border-slate-600'
                  }`}
                >
                  RS
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                X:{axes.rightX.toFixed(2)} Y:{axes.rightY.toFixed(2)}
              </span>
            </div>

            {/* ABXY Face Buttons */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Y - Top */}
              <div
                className={`absolute top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                  buttons.y
                    ? 'bg-amber-400 text-black border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-105'
                    : 'bg-slate-950 text-amber-400 border-slate-800'
                }`}
              >
                Y
              </div>
              {/* A - Bottom */}
              <div
                className={`absolute bottom-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                  buttons.a
                    ? 'bg-emerald-400 text-black border-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.9)] scale-105'
                    : 'bg-slate-950 text-emerald-400 border-slate-800'
                }`}
              >
                A
              </div>
              {/* X - Left */}
              <div
                className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                  buttons.x
                    ? 'bg-sky-400 text-black border-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.9)] scale-105'
                    : 'bg-slate-950 text-sky-400 border-slate-800'
                }`}
              >
                X
              </div>
              {/* B - Right */}
              <div
                className={`absolute right-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                  buttons.b
                    ? 'bg-rose-400 text-black border-rose-200 shadow-[0_0_12px_rgba(251,113,133,0.9)] scale-105'
                    : 'bg-slate-950 text-rose-400 border-slate-800'
                }`}
              >
                B
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
