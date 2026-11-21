import React, { useState } from 'react';
import {
  KeyRound,
  Maximize,
  Minimize,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Radio,
  Wifi,
  Usb,
  Bluetooth,
  Zap,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface PinEntryScreenProps {
  defaultHost: string;
  defaultPort: number;
  isPairing: boolean;
  errorMessage: string | null;
  onSubmitPin: (pin: string, host: string, port: number) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isIOS: boolean;
  onConnectBluetooth?: () => void;
  isBluetoothSupported?: boolean;
}

export const PinEntryScreen: React.FC<PinEntryScreenProps> = ({
  defaultHost,
  defaultPort,
  isPairing,
  errorMessage,
  onSubmitPin,
  onToggleFullscreen,
  isFullscreen,
  isIOS,
  onConnectBluetooth,
  isBluetoothSupported,
}) => {
  const [pin, setPin] = useState('');
  const [host, setHost] = useState(defaultHost);
  const [port, setPort] = useState(defaultPort.toString());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [transportMode, setTransportMode] = useState<'wifi' | 'usb' | 'bluetooth'>('wifi');

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const next = pin + num;
      setPin(next);
      triggerHaptic('light', 0.8, isIOS);
      if (next.length === 4) {
        // Auto submit when 4th digit entered
        setTimeout(() => {
          onSubmitPin(next, host, parseInt(port, 10) || 8080);
        }, 120);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      triggerHaptic('light', 0.6, isIOS);
    }
  };

  const handleClear = () => {
    setPin('');
    triggerHaptic('light', 0.6, isIOS);
  };

  const handleSelectTransport = (mode: 'wifi' | 'usb' | 'bluetooth') => {
    setTransportMode(mode);
    triggerHaptic('light', 0.5, isIOS);

    if (mode === 'usb') {
      // For iOS, the host is usually 172.20.10.1 on USB hotspot. For Android with adb reverse, it's localhost.
      if (isIOS) {
        setHost('172.20.10.1');
      } else {
        setHost('localhost');
      }
    } else if (mode === 'wifi') {
      setHost(defaultHost || window.location.hostname || '127.0.0.1');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#04060A]/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-5 text-white select-none overflow-y-auto">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-extrabold text-[11px] sm:text-xs tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">
            UNIVERSAL GAMEPAD // AUTH TERMINAL
          </span>
        </div>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-[11px] font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] active:scale-95"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}</span>
        </button>
      </div>

      {/* Main Content: Adaptive 2-Column in landscape, Centered stack in portrait */}
      <div className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-2">
        {/* Left Column: Security Branding, Prompt, and 4 Digit Boxes */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left max-w-sm">
          {/* Transport Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl mb-3 w-full">
            <button
              type="button"
              onClick={() => handleSelectTransport('wifi')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                transportMode === 'wifi'
                  ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wifi className="w-3 h-3" />
              <span>Wi-Fi</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTransport('usb')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                transportMode === 'usb'
                  ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Usb className="w-3 h-3" />
              <span>USB Wired</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTransport('bluetooth')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                transportMode === 'bluetooth'
                  ? 'bg-blue-500/20 border border-blue-400/60 text-blue-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bluetooth className="w-3 h-3" />
              <span>Bluetooth</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <KeyRound className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_10px_rgba(0,240,255,1)]" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider text-white drop-shadow-md">
                PAIRING PIN
              </h2>
              <p className="text-[11px] text-slate-400">
                {transportMode === 'usb'
                  ? '⚡ Sub-millisecond USB Wired Mode'
                  : transportMode === 'bluetooth'
                  ? '🔵 Direct Bluetooth Radio Mode'
                  : 'Enter 4 digits shown on computer'}
              </p>
            </div>
          </div>

          {/* If Bluetooth mode and Web Bluetooth is supported */}
          {transportMode === 'bluetooth' && isBluetoothSupported && onConnectBluetooth && (
            <div className="w-full mb-3">
              <button
                type="button"
                onClick={onConnectBluetooth}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-950/60 border border-blue-500/80 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-900/60 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95"
              >
                <Zap className="w-4 h-4 text-blue-400" />
                <span>Pair via Web Bluetooth (BLE GATT)</span>
              </button>
            </div>
          )}

          {/* 4 Glowing PIN Boxes */}
          <div className="flex items-center gap-3 my-2">
            {[0, 1, 2, 3].map((idx) => {
              const digit = pin[idx] || '';
              const isActive = pin.length === idx;
              return (
                <div
                  key={idx}
                  className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-mono font-black transition-all ${
                    digit
                      ? 'border-cyan-300 bg-cyan-950/60 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.7)] scale-105'
                      : isActive
                      ? 'border-cyan-400/80 bg-[#0B1323] text-cyan-500 animate-pulse'
                      : 'border-slate-800 bg-[#070B14]/80 text-slate-700'
                  }`}
                  style={{ width: '48px', height: '56px' }}
                >
                  {digit || '•'}
                </div>
              );
            })}
          </div>

          {/* Error notification */}
          {errorMessage && (
            <div className="flex items-center gap-2 text-rose-300 text-xs my-1 bg-rose-950/70 border border-rose-500/70 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="font-semibold text-[11px]">{errorMessage}</span>
            </div>
          )}

          {/* Computer Host Target */}
          <div className="mt-2 text-left">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>Target: <span className="font-mono text-cyan-300">{host}:{port}</span></span>
            </button>

            {showAdvanced && (
              <div className="mt-2 p-2.5 bg-[#0B101E] rounded-xl border border-slate-800 flex gap-2 text-left shadow-lg">
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="Computer IP"
                  className="w-2/3 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300 outline-none"
                />
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="Port"
                  className="w-1/3 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Holographic Numeric Keypad + Connect Button */}
        <div className="flex flex-col items-center w-full max-w-[260px]">
          <div className="w-full grid grid-cols-3 gap-2 mb-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                disabled={isPairing}
                className="h-11 rounded-xl bg-[#0D1527]/90 border border-slate-700/80 hover:border-cyan-400 active:bg-cyan-400 active:text-slate-950 font-mono font-bold text-lg text-slate-100 transition-all active:scale-95 shadow"
                style={{ height: '46px' }}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-[#0D1527]/50 border border-slate-800/80 hover:border-slate-600 text-[10px] font-bold text-slate-400 active:scale-95 transition-all flex items-center justify-center"
              style={{ height: '46px' }}
            >
              CLR
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              disabled={isPairing}
              className="h-11 rounded-xl bg-[#0D1527]/90 border border-slate-700/80 hover:border-cyan-400 active:bg-cyan-400 active:text-slate-950 font-mono font-bold text-lg text-slate-100 transition-all active:scale-95 shadow"
              style={{ height: '46px' }}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-[#0D1527]/50 border border-slate-800/80 hover:border-slate-600 text-[10px] font-bold text-slate-400 active:scale-95 transition-all flex items-center justify-center"
              style={{ height: '46px' }}
            >
              DEL
            </button>
          </div>

          <button
            type="button"
            disabled={pin.length < 4 || isPairing}
            onClick={() => onSubmitPin(pin, host, parseInt(port, 10) || 8080)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] text-slate-950 font-black text-sm tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPairing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>CONNECTING...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>CONFIRM &amp; PLAY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Security Footer */}
      <div className="w-full text-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
        <span>AES-Encrypted Handshake • Multi-Touch Pointer Tracking • Low Latency Protocol</span>
      </div>
    </div>
  );
};
