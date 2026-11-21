import React, { useState } from 'react';
import { ControllerState } from '@universal-gamepad/shared-protocol';
import { ExternalLink, Copy, Check, Sparkles, LayoutGrid, Eye } from 'lucide-react';

interface GamepadVisualizerProps {
  state: ControllerState;
}

export const GamepadVisualizer: React.FC<GamepadVisualizerProps> = ({ state }) => {
  const { buttons, axes, triggers } = state;
  const [viewMode, setViewMode] = useState<'visual' | 'tester'>('visual');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  const bookmarkletCode = `javascript:(function(){var s=document.createElement('script');s.src='http://127.0.0.1:8080/bridge.js?t='+Date.now();document.head.appendChild(s);})();`;
  const consoleCode = `fetch('http://127.0.0.1:8080/bridge.js').then(r=>r.text()).then(eval);`;

  const copyToClipboard = (text: string, type: 'bookmarklet' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'bookmarklet') {
      setCopiedBookmarklet(true);
      setTimeout(() => setCopiedBookmarklet(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  // Standard W3C mapping
  const w3cAxes = [
    { label: 'Axis 0 (LS X)', val: axes.leftX },
    { label: 'Axis 1 (LS Y)', val: -axes.leftY },
    { label: 'Axis 2 (RS X)', val: axes.rightX },
    { label: 'Axis 3 (RS Y)', val: -axes.rightY },
  ];

  const w3cButtons = [
    { num: 'B0', name: 'A', val: buttons.a ? 1 : 0 },
    { num: 'B1', name: 'B', val: buttons.b ? 1 : 0 },
    { num: 'B2', name: 'X', val: buttons.x ? 1 : 0 },
    { num: 'B3', name: 'Y', val: buttons.y ? 1 : 0 },
    { num: 'B4', name: 'L1', val: buttons.l1 ? 1 : 0 },
    { num: 'B5', name: 'R1', val: buttons.r1 ? 1 : 0 },
    { num: 'B6', name: 'L2 (Trigger)', val: triggers.l2 },
    { num: 'B7', name: 'R2 (Trigger)', val: triggers.r2 },
    { num: 'B8', name: 'Select', val: buttons.select ? 1 : 0 },
    { num: 'B9', name: 'Start', val: buttons.start ? 1 : 0 },
    { num: 'B10', name: 'L3 (Stick)', val: buttons.l3 ? 1 : 0 },
    { num: 'B11', name: 'R3 (Stick)', val: buttons.r3 ? 1 : 0 },
    { num: 'B12', name: 'D-Pad Up', val: buttons.dpadUp ? 1 : 0 },
    { num: 'B13', name: 'D-Pad Down', val: buttons.dpadDown ? 1 : 0 },
    { num: 'B14', name: 'D-Pad Left', val: buttons.dpadLeft ? 1 : 0 },
    { num: 'B15', name: 'D-Pad Right', val: buttons.dpadRight ? 1 : 0 },
    { num: 'B16', name: 'Home ❖', val: buttons.home ? 1 : 0 },
  ];

  return (
    <div className="bg-gamepad-surface border border-gamepad-border rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-base text-white tracking-wide">LIVE INPUT TESTER</h2>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800">
            60Hz / 120Hz Real-Time
          </span>
        </div>

        {/* View Switcher: 3D Visual vs Gamepad Tester Grid */}
        <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
              viewMode === 'visual'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.7)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3D Controller</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tester')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
              viewMode === 'tester'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.7)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Gamepad-Tester Grid</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: 3D Controller Chassis Mockup */}
      {viewMode === 'visual' && (
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
                <div
                  className={`absolute top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                    buttons.y
                      ? 'bg-amber-400 text-black border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-105'
                      : 'bg-slate-950 text-amber-400 border-slate-800'
                  }`}
                >
                  Y
                </div>
                <div
                  className={`absolute bottom-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                    buttons.a
                      ? 'bg-emerald-400 text-black border-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.9)] scale-105'
                      : 'bg-slate-950 text-emerald-400 border-slate-800'
                  }`}
                >
                  A
                </div>
                <div
                  className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                    buttons.x
                      ? 'bg-sky-400 text-black border-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.9)] scale-105'
                      : 'bg-slate-950 text-sky-400 border-slate-800'
                  }`}
                >
                  X
                </div>
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
      )}

      {/* VIEW 2: Gamepad-Tester Standard Grid Readout (Exact Gamepad-Tester Format) */}
      {viewMode === 'tester' && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-cyan-400 font-bold">DEVICE:</span>{' '}
              <span className="text-white">Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)</span>
            </div>
            <div className="text-slate-400">
              <span className="text-emerald-400">● CONNECTED</span> (Index 0)
            </div>
          </div>

          {/* Analog Axes */}
          <div>
            <div className="text-slate-400 font-bold mb-2">ANALOG AXES (-1.00000 to +1.00000):</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {w3cAxes.map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                  <span className="text-cyan-300 font-bold">{a.label}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-950 rounded-full overflow-hidden relative border border-slate-800">
                      <div
                        style={{
                          left: `${((a.val + 1) / 2) * 100}%`,
                          transform: 'translateX(-50%)',
                        }}
                        className="absolute top-0 bottom-0 w-2 bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,1)]"
                      />
                    </div>
                    <span className="text-white font-bold w-14 text-right">
                      {a.val >= 0 ? '+' : ''}{a.val.toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 17 Standard W3C Gamepad Buttons */}
          <div>
            <div className="text-slate-400 font-bold mb-2">STANDARD BUTTONS (B0 to B16):</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {w3cButtons.map((b, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded border transition-all ${
                    b.val > 0.05
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-[0_0_10px_rgba(0,240,255,0.6)]'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}
                >
                  <span className="font-bold">{b.num}: {b.name}</span>
                  <span className="font-mono text-[11px]">{b.val.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ⚡ Gamepad-Tester.com 1-Click Bridge Section */}
      <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900/80 border border-cyan-500/30 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>CONNECT TO GAMEPAD-TESTER.COM & BROWSER GAMES</span>
          </div>
          <a
            href="https://gamepad-tester.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-white underline font-bold"
          >
            Open gamepad-tester.com <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
          To have <span className="font-mono text-cyan-300 font-bold">gamepad-tester.com</span> or web games recognize your phone as a standard Xbox 360 controller, choose either instant option below:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Option A: Bookmarklet */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-200">Option 1: Bookmarklet (1-Click)</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Drag to bookmarks bar or copy code. Click it on gamepad-tester.com!</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(bookmarkletCode, 'bookmarklet')}
              className="mt-2.5 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors"
            >
              {copiedBookmarklet ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBookmarklet ? 'Copied Bookmarklet!' : 'Copy 1-Click Bookmarklet'}</span>
            </button>
          </div>

          {/* Option B: Console One-Liner */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-200">Option 2: Browser Console</span>
              <p className="text-[10px] text-slate-400 mt-0.5">On gamepad-tester.com, press Cmd+Option+J and paste this command:</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(consoleCode, 'script')}
              className="mt-2.5 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-colors"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Copied Console Code!' : 'Copy Console Command'}</span>
            </button>
          </div>
        </div>

        {/* Option C: Chrome Extension */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Permanent Chrome Extension: Load unpacked from <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">tools/chrome-gamepad-bridge</code></span>
        </div>
      </div>
    </div>
  );
};
