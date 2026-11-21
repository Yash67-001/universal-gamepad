import React from 'react';
import { ControllerProfileType, JoystickConfig } from '@universal-gamepad/shared-protocol';
import { X, Smartphone, Volume2, Gamepad2, Zap } from 'lucide-react';

interface QuickSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  layout: ControllerProfileType;
  onLayoutChange: (layout: ControllerProfileType) => void;
  leftStickConfig: JoystickConfig;
  onLeftStickConfigChange: (cfg: JoystickConfig) => void;
  rightStickConfig: JoystickConfig;
  onRightStickConfigChange: (cfg: JoystickConfig) => void;
  hapticEnabled: boolean;
  onHapticToggle: (enabled: boolean) => void;
  onReplayBoot?: () => void;
  isIOS: boolean;
  isPWA: boolean;
  onInstallPwaPrompt?: () => void;
}

export const QuickSettingsModal: React.FC<QuickSettingsModalProps> = ({
  isOpen,
  onClose,
  layout,
  onLayoutChange,
  leftStickConfig,
  onLeftStickConfigChange,
  rightStickConfig,
  onRightStickConfigChange,
  hapticEnabled,
  onHapticToggle,
  onReplayBoot,
  isIOS,
  isPWA,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-cyan-300">CONTROLLER SETTINGS</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Button Layout Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-200 tracking-wider text-[11px] uppercase">
                CONTROLLER PROFILE & BUTTON LAYOUT
              </label>
              <span className="text-[10px] text-cyan-400 font-mono font-semibold uppercase">
                ACTIVE: {layout}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'xbox' as ControllerProfileType,
                  title: 'Xbox Wireless',
                  badge: 'Standard',
                  desc: 'Modern PC & Steam games',
                  pills: ['A', 'B', 'X', 'Y'],
                },
                {
                  id: 'playstation' as ControllerProfileType,
                  title: 'PlayStation',
                  badge: 'DualSense',
                  desc: 'Classic PlayStation symbols',
                  pills: ['✕', '○', '□', '△'],
                },
                {
                  id: 'nintendo' as ControllerProfileType,
                  title: 'Nintendo Pro',
                  badge: 'Switch',
                  desc: 'Inverted A/B and X/Y',
                  pills: ['B', 'A', 'Y', 'X'],
                },
                {
                  id: 'racing' as ControllerProfileType,
                  title: 'Racing Rig',
                  badge: 'Highway Rush',
                  desc: 'Throttle, Brake & Nitro',
                  pills: ['GAS', 'BRK', 'NITRO', 'CAM'],
                },
                {
                  id: 'arcade' as ControllerProfileType,
                  title: 'Retro Arcade',
                  badge: 'Fighter',
                  desc: 'Classic arcade 1-2-3-4',
                  pills: ['1', '2', '3', '4'],
                },
                {
                  id: 'kbm' as ControllerProfileType,
                  title: 'PC Keyboard',
                  badge: 'Direct Key',
                  desc: 'Space, Shift, Ctrl & E',
                  pills: ['SPACE', 'CTRL', 'SHIFT', 'E'],
                },
              ].map((p) => {
                const isSelected = layout === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onLayoutChange(p.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative overflow-hidden active:scale-95 ${
                      isSelected
                        ? 'border-cyan-400 bg-gradient-to-b from-cyan-950/70 to-slate-900 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/40'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1">
                      <span className={`font-bold text-[11px] truncate ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {p.title}
                      </span>
                      <span
                        className={`text-[8px] font-mono px-1 py-0.5 rounded uppercase font-semibold ${
                          isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.badge}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-400 mb-2 leading-tight">
                      {p.desc}
                    </div>

                    {/* Face Button Preview Mini-Pills */}
                    <div className="flex items-center gap-1 mt-auto">
                      {p.pills.map((pill, idx) => (
                        <span
                          key={idx}
                          className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${
                            isSelected
                              ? 'border-cyan-400/40 bg-cyan-900/40 text-cyan-200'
                              : 'border-slate-700 bg-slate-800 text-slate-300'
                          }`}
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Analog Deadzone & Sensitivity */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
            <span className="font-bold text-slate-300 text-[11px]">LEFT JOYSTICK (LS)</span>
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Radial Deadzone:</span>
                <span className="text-cyan-400 font-mono">{Math.round(leftStickConfig.deadzone * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.30"
                step="0.01"
                value={leftStickConfig.deadzone}
                onChange={(e) =>
                  onLeftStickConfigChange({ ...leftStickConfig, deadzone: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Sensitivity:</span>
                <span className="text-cyan-400 font-mono">{leftStickConfig.sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={leftStickConfig.sensitivity}
                onChange={(e) =>
                  onLeftStickConfigChange({ ...leftStickConfig, sensitivity: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Right Analog Deadzone & Sensitivity */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
            <span className="font-bold text-slate-300 text-[11px]">RIGHT JOYSTICK (RS / AIM)</span>
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Radial Deadzone:</span>
                <span className="text-cyan-400 font-mono">{Math.round(rightStickConfig.deadzone * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.30"
                step="0.01"
                value={rightStickConfig.deadzone}
                onChange={(e) =>
                  onRightStickConfigChange({ ...rightStickConfig, deadzone: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Sensitivity:</span>
                <span className="text-cyan-400 font-mono">{rightStickConfig.sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rightStickConfig.sensitivity}
                onChange={(e) =>
                  onRightStickConfigChange({ ...rightStickConfig, sensitivity: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={rightStickConfig.invertY}
                  onChange={(e) =>
                    onRightStickConfigChange({ ...rightStickConfig, invertY: e.target.checked })
                  }
                  className="rounded accent-cyan-400"
                />
                Invert Pitch (Y-Axis)
              </label>
            </div>
          </div>

          {/* Haptics */}
          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-semibold text-slate-200">
                  {isIOS ? 'Acoustic Tactile Feedback' : 'Vibration & Haptics'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isIOS ? 'Synthesized mechanical click for iOS' : 'Hardware motor vibration on touch'}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={hapticEnabled}
              onChange={(e) => onHapticToggle(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Replay Cyber Boot Animation */}
          {onReplayBoot && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onReplayBoot();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-950/60 to-blue-950/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-cyan-900/40 transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] active:scale-95"
            >
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>⚡ REPLAY CRAZY BOOT ANIMATION</span>
            </button>
          )}

          {/* Fullscreen / PWA Guidance */}
          {!isPWA && (
            <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/50 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Smartphone className="w-4 h-4" />
                <span>RECOMMENDED: ADD TO HOME SCREEN</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {isIOS
                  ? 'To unlock genuine full-screen gaming without the Safari URL bar, tap the Share button (square with arrow) at the bottom and select "Add to Home Screen".'
                  : 'Install this as a PWA to eliminate browser navigation bars and achieve edge-to-edge full screen.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
