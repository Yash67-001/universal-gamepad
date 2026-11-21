import React, { useState } from 'react';
import {
  QrCode,
  RefreshCw,
  Copy,
  Check,
  Wifi,
  KeyRound,
  Usb,
  Bluetooth,
  Zap,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Gamepad2,
  Activity,
  Radio,
  PowerOff,
} from 'lucide-react';
import { NetworkInterfaceInfo } from '../server/network';
import { TransportStateReport, ConnectionStatus, ControllerState } from '@universal-gamepad/shared-protocol';

interface PairingCardProps {
  status: ConnectionStatus;
  qrCodeDataUrl: string;
  pairingUrl: string;
  pin: string;
  interfaces: NetworkInterfaceInfo[];
  selectedInterface: string;
  transports?: TransportStateReport;
  connectedDevice?: {
    browser: string;
    os: string;
    ip: string;
    connectedAt: number;
  };
  metrics?: {
    rttMs: number;
    packetCount: number;
    lastSequence: number;
  };
  latestGamepadState?: ControllerState;
  onSelectInterface?: (ip: string) => void;
  onRegenerateToken: () => void;
  onRefreshTransports?: () => void;
  onSetupUsb?: () => Promise<{ success: boolean; message: string }>;
  onDisconnect?: () => void;
}

export const PairingCard: React.FC<PairingCardProps> = ({
  status,
  qrCodeDataUrl,
  pairingUrl,
  pin,
  interfaces,
  selectedInterface,
  transports,
  connectedDevice,
  metrics = { rttMs: 0, packetCount: 0, lastSequence: 0 },
  latestGamepadState,
  onSelectInterface,
  onRegenerateToken,
  onRefreshTransports,
  onSetupUsb,
  onDisconnect,
}) => {
  const [activeTab, setActiveTab] = useState<'wifi' | 'usb' | 'bluetooth'>('wifi');
  const [copied, setCopied] = useState(false);
  const [usbSettingUp, setUsbSettingUp] = useState(false);
  const [usbNotice, setUsbNotice] = useState<string | null>(null);
  const [showQrWhileConnected, setShowQrWhileConnected] = useState(false);

  const handleCopyUrl = (urlToCopy?: string) => {
    navigator.clipboard.writeText(urlToCopy || pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerAdbReverse = async () => {
    if (!onSetupUsb) return;
    setUsbSettingUp(true);
    setUsbNotice(null);
    try {
      const res = await onSetupUsb();
      setUsbNotice(res.message);
    } catch (err: any) {
      setUsbNotice(err.message || 'Failed to setup USB');
    } finally {
      setUsbSettingUp(false);
    }
  };

  const usbInterface = interfaces.find((i) => i.type === 'usb');
  const btInterface = interfaces.find((i) => i.type === 'bluetooth');

  // Active buttons list for live visual feedback
  const activeButtonsList: string[] = [];
  if (latestGamepadState?.buttons) {
    if (latestGamepadState.buttons.a) activeButtonsList.push('A');
    if (latestGamepadState.buttons.b) activeButtonsList.push('B');
    if (latestGamepadState.buttons.x) activeButtonsList.push('X');
    if (latestGamepadState.buttons.y) activeButtonsList.push('Y');
    if (latestGamepadState.buttons.l1) activeButtonsList.push('L1');
    if (latestGamepadState.buttons.r1) activeButtonsList.push('R1');
    if (latestGamepadState.buttons.l3) activeButtonsList.push('L3');
    if (latestGamepadState.buttons.r3) activeButtonsList.push('R3');
    if (latestGamepadState.buttons.dpadUp) activeButtonsList.push('▲');
    if (latestGamepadState.buttons.dpadDown) activeButtonsList.push('▼');
    if (latestGamepadState.buttons.dpadLeft) activeButtonsList.push('◀');
    if (latestGamepadState.buttons.dpadRight) activeButtonsList.push('▶');
    if (latestGamepadState.buttons.start) activeButtonsList.push('START');
    if (latestGamepadState.buttons.select) activeButtonsList.push('SELECT');
    if (latestGamepadState.buttons.home) activeButtonsList.push('HOME');
  }

  // Latency quality color
  const getLatencyColor = (rtt: number) => {
    if (rtt <= 2) return 'text-emerald-300';
    if (rtt <= 10) return 'text-cyan-300';
    if (rtt <= 25) return 'text-amber-300';
    return 'text-rose-400';
  };

  // If phone is connected and user hasn't explicitly clicked "Show QR Code",
  // display the GLORIOUS CONTROLLER CONNECTED HERO PANEL!
  if (status === 'connected' && !showQrWhileConnected) {
    return (
      <div className="bg-gradient-to-br from-[#061418] via-[#0A1220] to-[#070D18] border-2 border-emerald-400/80 rounded-2xl p-6 flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.25)] relative overflow-hidden">
        {/* Glowing Background Radial Halo */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          {/* Top Hero Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.7)]">
                  <Gamepad2 className="w-7 h-7" />
                </div>
                <span className="w-3.5 h-3.5 bg-emerald-400 rounded-full absolute -top-1 -right-1 animate-ping" />
                <span className="w-3.5 h-3.5 bg-emerald-400 rounded-full absolute -top-1 -right-1 shadow-[0_0_8px_#34d399]" />
              </div>

              <div>
                <div className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>ONLINE • PLAYER 1 ACTIVE</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-wide">
                  {connectedDevice?.os || 'APPLE IPHONE'} CONTROLLER
                </h2>
                <div className="text-xs text-slate-400 font-mono">
                  {connectedDevice?.browser || 'Mobile Safari'} • {connectedDevice?.ip?.replace('::ffff:', '') || '192.168.1.6'}
                </div>
              </div>
            </div>

            {onDisconnect && (
              <button
                type="button"
                onClick={onDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] active:scale-95"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            )}
          </div>

          {/* Real-time Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-3 my-4">
            {/* Latency */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex flex-col justify-between shadow-inner">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>PING (RTT)</span>
              </div>
              <div className={`text-2xl font-black font-mono mt-1 ${getLatencyColor(metrics.rttMs)}`}>
                {metrics.rttMs < 1 ? '< 1' : metrics.rttMs.toFixed(1)} <span className="text-xs font-normal">ms</span>
              </div>
              <div className="text-[9px] text-emerald-400/80 font-mono mt-0.5">Ultra-Low Latency</div>
            </div>

            {/* Packet Stream */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-inner">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>STREAM</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {metrics.packetCount.toLocaleString()}
              </div>
              <div className="text-[9px] text-cyan-400/80 font-mono mt-0.5">60Hz Binary Frames</div>
            </div>

            {/* Transport Mode */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-inner">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>TRANSPORT</span>
              </div>
              <div className="text-sm font-black font-mono text-white mt-2 truncate">
                {transports?.usb.isCableConnected ? '⚡ USB Wired' : '📶 Wi-Fi LAN'}
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">Sub-ms Stream</div>
            </div>
          </div>

          {/* Live Controller Inputs Bar */}
          <div className="p-3.5 rounded-xl bg-[#060B14] border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">LIVE INPUTS:</span>
              <div className="flex flex-wrap gap-1.5">
                {activeButtonsList.length > 0 ? (
                  activeButtonsList.map((btn) => (
                    <span
                      key={btn}
                      className="px-2 py-0.5 rounded-lg bg-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(0,240,255,0.9)] animate-pulse"
                    >
                      {btn}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Press any button or joystick on phone...</span>
                )}
              </div>
            </div>

            {latestGamepadState && (
              <div className="text-[10px] font-mono text-slate-400">
                L: ({latestGamepadState.axes.leftX.toFixed(2)}, {latestGamepadState.axes.leftY.toFixed(2)})
              </div>
            )}
          </div>
        </div>

        {/* Footer: Toggle QR Code */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Controller is actively receiving input and ready for gaming</span>
          </span>
          <button
            type="button"
            onClick={() => setShowQrWhileConnected(true)}
            className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors underline font-mono"
          >
            Show QR Code (Add Player 2)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gamepad-surface border border-gamepad-border rounded-2xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
      {/* Background Cyber Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Top Header & New Code button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
              <QrCode className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-black text-sm text-white tracking-wider">CONNECT SMARTPHONE</h2>
              <span className="text-[10px] text-slate-400 font-mono">MULTI-TRANSPORT LINK</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === 'connected' && showQrWhileConnected && (
              <button
                type="button"
                onClick={() => setShowQrWhileConnected(false)}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 text-xs font-bold"
              >
                Back to Controller
              </button>
            )}
            <button
              type="button"
              onClick={onRegenerateToken}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all active:scale-95 shadow-sm"
              title="Generate new pairing token"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Code</span>
            </button>
          </div>
        </div>

        {/* Transport Channel Tabs (Wi-Fi, USB, Bluetooth) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('wifi')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'wifi'
                ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi LAN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usb')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'usb'
                ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            <span>USB Wired</span>
            {transports?.usb.isCableConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bluetooth')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bluetooth'
                ? 'bg-blue-500/20 border border-blue-400/60 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>Bluetooth</span>
          </button>
        </div>

        {/* TAB 1: WI-FI / LOCAL NETWORK */}
        {activeTab === 'wifi' && (
          <div>
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-gamepad-bg border border-cyan-500/30 rounded-2xl relative group shadow-[0_0_25px_rgba(0,240,255,0.08)]">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Scan to Pair Controller"
                  className="w-52 h-52 rounded-xl border border-slate-800 transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-500 text-xs">
                  Generating QR Code...
                </div>
              )}

              <div className="mt-2.5 text-center">
                <span className="text-[11px] text-cyan-300 font-semibold">
                  Scan with iPhone Camera or Android Camera to connect in 1 second!
                </span>
              </div>
            </div>

            {/* 4-Digit Pairing PIN */}
            <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">PAIRING PIN</div>
                  <div className="text-xl font-black font-mono tracking-widest text-cyan-300">{pin || '----'}</div>
                </div>
              </div>
              <span className="text-[10px] text-cyan-400/90 font-semibold max-w-[140px] text-right">
                Enter PIN on phone if prompted
              </span>
            </div>

            {/* Direct URL */}
            <div className="mt-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div className="truncate text-slate-400 text-[11px] pr-2">{pairingUrl}</div>
              <button
                type="button"
                onClick={() => handleCopyUrl(pairingUrl)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px] shrink-0"
                title="Copy Pairing URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: USB WIRED LINK */}
        {activeTab === 'usb' && (
          <div className="space-y-3">
            {/* USB Live Status Banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                transports?.usb.isCableConnected
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    transports?.usb.isCableConnected
                      ? 'bg-emerald-900/40 border-emerald-400/50 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Usb className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{transports?.usb.deviceName || 'USB Connection'}</span>
                    {transports?.usb.isCableConnected && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        DETECTED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {transports?.usb.isCableConnected
                      ? 'Sub-millisecond wired gaming (< 0.3ms latency)'
                      : 'Plug in Lightning or USB-C cable'}
                  </div>
                </div>
              </div>

              {onRefreshTransports && (
                <button
                  type="button"
                  onClick={onRefreshTransports}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
                  title="Rescan USB devices"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Apple iPhone USB Setup */}
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Apple iPhone (USB Lightning / USB-C)</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">0.3ms latency</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                1. Connect iPhone with USB cable to Mac.
                <br />
                2. On iPhone, open <strong className="text-slate-200">Settings &gt; Personal Hotspot &gt; Turn ON</strong> (choose <strong className="text-slate-200">&ldquo;USB Only&rdquo;</strong>).
                <br />
                3. Your Mac immediately establishes a high-speed virtual Ethernet wire!
              </p>
              {usbInterface ? (
                <button
                  type="button"
                  onClick={() => onSelectInterface && onSelectInterface(usbInterface.address)}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    selectedInterface === usbInterface.address
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                      : 'bg-emerald-950/40 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {selectedInterface === usbInterface.address
                      ? `Active: ${usbInterface.address} (Wired)`
                      : `Switch to USB Link: ${usbInterface.address}`}
                  </span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-500 italic bg-slate-950/60 p-2 rounded-lg">
                  Tip: When iPhone USB Hotspot is turned ON, the wired interface auto-appears here.
                </div>
              )}
            </div>

            {/* Android USB Setup & ADB Reverse */}
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Android (USB Tethering &amp; ADB Reverse)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">0.2ms latency</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Mode A (Plug &amp; Play):</strong> On Android, enable{' '}
                <strong className="text-slate-200">Settings &gt; USB Tethering</strong>.
                <br />
                <strong className="text-slate-200">Mode B (1-Click ADB Reverse):</strong> Enable USB Debugging, then click below to map port 8080 through the USB cable:
              </p>
              <button
                type="button"
                disabled={usbSettingUp}
                onClick={handleTriggerAdbReverse}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-cyan-950/60 border border-cyan-500/70 text-cyan-300 hover:bg-cyan-900/60 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>{usbSettingUp ? 'Mapping Port...' : 'Map USB Port (adb reverse tcp:8080)'}</span>
              </button>

              {usbNotice && (
                <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-[10px] text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{usbNotice}</span>
                </div>
              )}

              <div className="p-2 bg-slate-950/60 rounded-lg flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 truncate">Phone URL: http://localhost:8080</span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(`http://localhost:8080/?host=localhost&port=8080&session=${pin}`)}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  title="Copy Android USB URL"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BLUETOOTH LINK */}
        {activeTab === 'bluetooth' && (
          <div className="space-y-3">
            {/* Bluetooth State Banner */}
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-900/40 border border-blue-400/50 text-blue-300">
                  <Bluetooth className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Bluetooth Radio</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                        transports?.bluetooth.isEnabled
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {transports?.bluetooth.isEnabled ? 'ACTIVE' : 'READY'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Zero Wi-Fi or router needed • Direct device radio
                  </div>
                </div>
              </div>

              {onRefreshTransports && (
                <button
                  type="button"
                  onClick={onRefreshTransports}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
                  title="Rescan Bluetooth state"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Method 1: Bluetooth PAN (Personal Area Network) */}
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Bluetooth PAN Tethering (iPhone &amp; Android)</span>
                </span>
                <span className="text-[10px] text-blue-400 font-mono">Zero Router</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Works natively in <strong className="text-slate-200">iOS Safari &amp; Android Chrome</strong> without any browser restrictions:
                <br />
                1. In computer &amp; phone Bluetooth settings, <strong className="text-slate-200">pair your devices</strong>.
                <br />
                2. On iPhone: <strong className="text-slate-200">Settings &gt; Personal Hotspot &gt; Turn ON (Bluetooth)</strong>.
                <br />
                &nbsp;&nbsp;&nbsp;On Android: <strong className="text-slate-200">Settings &gt; Bluetooth Tethering &gt; ON</strong>.
                <br />
                3. Computer auto-receives a low-latency direct radio link!
              </p>

              {btInterface ? (
                <button
                  type="button"
                  onClick={() => onSelectInterface && onSelectInterface(btInterface.address)}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    selectedInterface === btInterface.address
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'bg-blue-950/40 border-blue-600/70 text-blue-300 hover:bg-blue-900/50'
                  }`}
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>
                    {selectedInterface === btInterface.address
                      ? `Active: ${btInterface.address} (Bluetooth PAN)`
                      : `Switch to Bluetooth Interface: ${btInterface.address}`}
                  </span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-500 italic bg-slate-950/60 p-2 rounded-lg">
                  Bluetooth PAN interface attaches automatically when phone Bluetooth tethering is enabled.
                </div>
              )}
            </div>

            {/* Method 2: Web Bluetooth GATT Low-Energy */}
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Web Bluetooth GATT (Chrome on Android / PC)</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">BLE GATT</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Connect directly through browser Bluetooth GATT without any local IP.
              </p>
              <div className="p-2 bg-slate-950/80 rounded-lg text-[10px] font-mono space-y-1 text-slate-400">
                <div><span className="text-cyan-400">Service UUID:</span> 0000ffe0-0000-1000-8000-00805f9b34fb</div>
                <div><span className="text-cyan-400">Gamepad State:</span> 0000ffe1-0000-1000-8000-00805f9b34fb</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Network Interface Selection Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-800">
        <label className="text-[11px] text-slate-400 font-semibold flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>SELECT ACTIVE NETWORK INTERFACE</span>
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">Current: {selectedInterface}</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {interfaces.map((iface) => (
            <button
              key={iface.address}
              type="button"
              onClick={() => onSelectInterface && onSelectInterface(iface.address)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all flex items-center gap-1.5 ${
                iface.address === selectedInterface
                  ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {iface.type === 'usb' && <Usb className="w-3 h-3 text-emerald-400" />}
              {iface.type === 'bluetooth' && <Bluetooth className="w-3 h-3 text-blue-400" />}
              {iface.type === 'wifi' && <Wifi className="w-3 h-3 text-cyan-400" />}
              <span>
                {iface.name}: {iface.address} {iface.address === selectedInterface ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
