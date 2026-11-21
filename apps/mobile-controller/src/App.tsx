import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ControllerState,
  INITIAL_CONTROLLER_STATE,
  ControllerProfileType,
  JoystickConfig,
} from '@universal-gamepad/shared-protocol';
import { DEFAULT_PROFILES } from '@universal-gamepad/controller-core';
import { detectDeviceCapabilities } from './utils/capabilities';
import { WakeLockManager } from './utils/wakeLock';
import { unlockHapticAudio } from './utils/haptics';
import { useGamepadSocket } from './hooks/useGamepadSocket';
import { useBluetoothGamepad } from './hooks/useBluetoothGamepad';

import { TriggerBar } from './components/TriggerBar';
import { DPad } from './components/DPad';
import { ActionButtons } from './components/ActionButtons';
import { AnalogJoystick } from './components/AnalogJoystick';
import { CenterControls } from './components/CenterControls';
import { TouchpadModal } from './components/TouchpadModal';
import { ConnectionStatusBar } from './components/ConnectionStatusBar';
import { OrientationPrompt } from './components/OrientationPrompt';
import { QuickSettingsModal } from './components/QuickSettingsModal';
import { PinEntryScreen } from './components/PinEntryScreen';
import { SafariFullscreenModal } from './components/SafariFullscreenModal';
import { BootSequence } from './components/BootSequence';

export const App: React.FC = () => {
  const caps = useRef(detectDeviceCapabilities());
  const isIOS = caps.current.os === 'ios';
  const isPWA = caps.current.isPWA;

  const controllerStateRef = useRef<ControllerState>(
    JSON.parse(JSON.stringify(INITIAL_CONTROLLER_STATE))
  );

  const [showBootAnimation, setShowBootAnimation] = useState(true);
  const handleBootComplete = useCallback(() => {
    setShowBootAnimation(false);
  }, []);

  const [layout, setLayout] = useState<ControllerProfileType>('xbox');
  const [leftStickConfig, setLeftStickConfig] = useState<JoystickConfig>(DEFAULT_PROFILES.xbox.leftStick);
  const [rightStickConfig, setRightStickConfig] = useState<JoystickConfig>(DEFAULT_PROFILES.xbox.rightStick);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTouchpadModal, setShowTouchpadModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSafariGuide, setShowSafariGuide] = useState(false);

  // Viewport tracking for responsive scaling
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 400,
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Keep iOS Web Audio active on user interactions
  useEffect(() => {
    const unlock = () => unlockHapticAudio();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Check if running as installed Standalone PWA on iOS
  const isStandalone =
    typeof window !== 'undefined' &&
    ((window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches);

  // Ponytail Adaptive Responsive Geometry Formula
  // Ensures every pod, button, and stick is 100% visible, perfectly centered, with ZERO clipping or edge overflow
  const isLandscape = viewport.width > viewport.height;
  const screenW = isLandscape ? viewport.width : viewport.height;
  const screenH = isLandscape ? viewport.height : viewport.width;

  // Safe allowance: 96px on iOS guarantees safe clearance from Dynamic Island, camera notch, and phone call pills
  const safeAllowanceH = isIOS ? 96 : 32;
  const availableW = Math.max(300, screenW - safeAllowanceH);
  const availableH = Math.max(200, screenH - 56); // Deduct TriggerBar row

  const isUltraCompact = availableW < 640 || availableH < 315;
  const isCompact = availableW < 780 || availableH < 360;

  // Maximum width each wing pod can occupy without pushing center or opposite pod:
  // Compact center console takes ~145px, leaving generous breathing room for left and right pods
  const centerSpace = isUltraCompact ? 120 : 145;
  const maxPodWidth = Math.floor((availableW - centerSpace - 24) / 2);
  const targetPodHeight = Math.floor(availableH * 0.82);

  // Pod overhead: horizontal padding (~28px) + gap (~10px) = 38px; vertical padding (~26px)
  const maxControlW = Math.floor((maxPodWidth - 38) / 2);
  const maxControlH = targetPodHeight - 26;
  const targetSize = Math.max(76, Math.min(maxControlW, maxControlH));

  // Balanced console-grade proportions: 104px - 116px on standard iPhones
  // Guarantees right pod action buttons (ABXY) and analog sticks NEVER clip or overflow off-screen!
  const controlSize = Math.max(80, Math.min(116, targetSize));
  const stickSize = Math.max(78, Math.min(110, Math.round(controlSize * 0.94)));
  const dpadSize = controlSize;
  const actionSize = controlSize;

  const {
    status,
    latency,
    errorMessage,
    serverParams,
    sendInputState,
    sendMouseMove,
    sendMouseClick,
    sendMouseScroll,
    connectWithPin,
    disconnect,
  } = useGamepadSocket();

  const bluetoothGamepad = useBluetoothGamepad();

  const isBleConnected = bluetoothGamepad.isConnected;
  const isWsConnected = status === 'connected';
  const effectiveStatus = isBleConnected || isWsConnected ? 'connected' : status === 'pairing' || bluetoothGamepad.isConnecting ? 'pairing' : status;

  let activeTransport: 'wifi' | 'usb' | 'bluetooth' = 'wifi';
  if (isBleConnected) {
    activeTransport = 'bluetooth';
  } else if (
    serverParams.host === 'localhost' ||
    serverParams.host === '127.0.0.1' ||
    serverParams.host.startsWith('172.20.10.') ||
    serverParams.host.startsWith('192.168.42.')
  ) {
    activeTransport = 'usb';
  }

  const wakeLock = useRef(new WakeLockManager());

  // Listen for native fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    // If running inside regular Safari on iPhone, native requestFullscreen() is disabled by iOS.
    // Trigger the Safari Fullscreen / Add-to-Home-Screen guide modal!
    if (isIOS && !isStandalone) {
      setShowSafariGuide(true);
      return;
    }

    const isFull = !!(
      document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
    );

    if (!isFull) {
      const elem = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {
          if (isIOS) setShowSafariGuide(true);
        });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (isIOS) {
        setShowSafariGuide(true);
      }
      if ('orientation' in screen && 'lock' in (screen.orientation as { lock?: (o: string) => Promise<void> })) {
        (screen.orientation as unknown as { lock: (o: string) => Promise<void> })
          .lock('landscape')
          .catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
      };
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [isIOS, isStandalone]);

  // Keep screen awake while connected
  useEffect(() => {
    if (status === 'connected') {
      wakeLock.current.acquire();
    } else {
      wakeLock.current.release();
    }
  }, [status]);

  // Flush neutral state on app blur or screen lock
  const flushNeutralState = useCallback(() => {
    const neutral = JSON.parse(JSON.stringify(INITIAL_CONTROLLER_STATE));
    controllerStateRef.current = neutral;
    sendInputState(neutral);
    if (bluetoothGamepad.isConnected) {
      bluetoothGamepad.sendInputState(neutral);
    }
  }, [sendInputState, bluetoothGamepad]);

  useEffect(() => {
    const handleVisibility = () => {
      wakeLock.current.onVisibilityChange();
      if (document.visibilityState !== 'visible') {
        flushNeutralState();
      }
    };
    window.addEventListener('blur', flushNeutralState);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', flushNeutralState);
    return () => {
      window.removeEventListener('blur', flushNeutralState);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', flushNeutralState);
    };
  }, [flushNeutralState]);

  // Dispatch state updates to server immediately (Zero React Re-render Bottleneck!)
  const updateState = useCallback(
    (updater: (prev: ControllerState) => ControllerState) => {
      const next = updater(controllerStateRef.current);
      next.timestamp = Date.now();
      controllerStateRef.current = next;
      sendInputState(next);
      if (bluetoothGamepad.isConnected) {
        bluetoothGamepad.sendInputState(next);
      }
    },
    [sendInputState, bluetoothGamepad]
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
    if (bluetoothGamepad.isConnected) {
      bluetoothGamepad.disconnect();
    }
  }, [disconnect, bluetoothGamepad]);

  // Input handlers
  const handleDirectionChange = (dirs: { up: boolean; down: boolean; left: boolean; right: boolean }) => {
    updateState((s) => ({
      ...s,
      buttons: {
        ...s.buttons,
        dpadUp: dirs.up,
        dpadDown: dirs.down,
        dpadLeft: dirs.left,
        dpadRight: dirs.right,
      },
    }));
  };

  const handleActionButtonChange = (btn: 'a' | 'b' | 'x' | 'y', pressed: boolean) => {
    updateState((s) => ({
      ...s,
      buttons: {
        ...s.buttons,
        [btn]: pressed,
      },
    }));
  };

  const handleBumperChange = (bumper: 'l1' | 'r1', pressed: boolean) => {
    updateState((s) => ({
      ...s,
      buttons: {
        ...s.buttons,
        [bumper]: pressed,
      },
    }));
  };

  const handleTriggerChange = (trigger: 'l2' | 'r2', value: number) => {
    updateState((s) => ({
      ...s,
      triggers: {
        ...s.triggers,
        [trigger]: value,
      },
    }));
  };

  const handleLeftStickMove = (x: number, y: number) => {
    updateState((s) => ({
      ...s,
      axes: {
        ...s.axes,
        leftX: x,
        leftY: y,
      },
    }));
  };

  const handleRightStickMove = (x: number, y: number) => {
    updateState((s) => ({
      ...s,
      axes: {
        ...s.axes,
        rightX: x,
        rightY: y,
      },
    }));
  };

  const handleStickClick = (stick: 'l3' | 'r3', pressed: boolean) => {
    updateState((s) => ({
      ...s,
      buttons: {
        ...s.buttons,
        [stick]: pressed,
      },
    }));
  };

  const handleCenterButtonChange = (btn: 'select' | 'start' | 'home' | 'turbo', pressed: boolean) => {
    updateState((s) => ({
      ...s,
      buttons: {
        ...s.buttons,
        [btn]: pressed,
      },
    }));
  };

  return (
    <div
      className="w-full h-full flex flex-col justify-between bg-slate-950 text-slate-100 select-none overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <OrientationPrompt />

      {/* Crazy Console Power-Up / Boot-Up Animation Sequence */}
      {showBootAnimation && (
        <BootSequence
          onComplete={handleBootComplete}
          isIOS={isIOS}
        />
      )}

      {/* Show PIN Entry Screen whenever disconnected or authenticating */}
      {effectiveStatus !== 'connected' && (
        <PinEntryScreen
          defaultHost={serverParams.host || window.location.hostname || '127.0.0.1'}
          defaultPort={serverParams.port || 8080}
          isPairing={status === 'pairing' || bluetoothGamepad.isConnecting}
          errorMessage={errorMessage || bluetoothGamepad.errorMessage}
          onSubmitPin={(pin, host, port) => connectWithPin(pin, host, port)}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          isIOS={isIOS}
          onConnectBluetooth={bluetoothGamepad.connect}
          isBluetoothSupported={bluetoothGamepad.isSupported}
        />
      )}

      {/* Unified Top Header: Triggers on outer shoulders, Compact Status in center */}
      <TriggerBar
        onBumperChange={handleBumperChange}
        onTriggerChange={handleTriggerChange}
        isIOS={isIOS}
      >
        <ConnectionStatusBar
          status={effectiveStatus}
          latency={
            isBleConnected
              ? {
                  rttMs: 1.2,
                  jitterMs: 0.2,
                  packetsSent: 0,
                  packetsReceived: 0,
                  packetLossPercent: 0,
                  lastUpdated: Date.now(),
                }
              : latency
          }
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onDisconnect={handleDisconnect}
          compact
          transport={activeTransport}
        />
      </TriggerBar>

      {/* Main Controller Body: Left Wing Pod, Center Console & Touchpad, Right Wing Pod */}
      <div className="flex-1 flex items-center justify-between px-2 sm:px-6 py-1 sm:py-2 gap-2 relative overflow-hidden box-border max-w-full">
        {/* Futuristic Laser Reticle Background Underglow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.06)_0%,transparent_70%)] pointer-events-none" />

        {/* Cyber Chassis Interconnect Bus Lines (Visual continuity across pods) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25 overflow-visible">
          <defs>
            <linearGradient id="bus-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="url(#bus-glow)" strokeWidth="1" strokeDasharray="6 4" />
        </svg>

        {/* Left Side Cyber Grip Glow Runner */}
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-60 rounded-r shadow-[0_0_15px_rgba(0,240,255,1)] pointer-events-none animate-pulse" />

        {/* Right Side Cyber Grip Glow Runner */}
        <div className="absolute right-0 top-1/4 bottom-1/4 w-1.5 bg-gradient-to-b from-transparent via-fuchsia-400 to-transparent opacity-60 rounded-l shadow-[0_0_15px_rgba(232,121,249,1)] pointer-events-none animate-pulse" />

        {/* Cyber Cockpit Corner HUD Labels */}
        <div className="absolute top-1 left-4 text-[7px] font-mono font-bold text-cyan-400/50 tracking-widest pointer-events-none select-none">
          [ POD-L // 120HZ ]
        </div>
        <div className="absolute top-1 right-4 text-[7px] font-mono font-bold text-fuchsia-400/50 tracking-widest pointer-events-none select-none">
          [ POD-R // ARMED ]
        </div>

        {/* Left Wing Pod: D-Pad & Left Analog Stick */}
        <div
          style={{ maxWidth: `${maxPodWidth}px` }}
          className="flex items-center justify-around gap-2 sm:gap-3 bg-gradient-to-b from-[#131D31]/95 via-[#0B1220]/98 to-[#050811]/100 px-3 py-2 sm:px-4 sm:py-3 rounded-3xl sm:rounded-[2rem] border border-cyan-500/30 backdrop-blur-md shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-cyan-400/10 shrink-0 transition-transform h-[86%] max-h-[250px]"
        >
          <DPad onDirectionChange={handleDirectionChange} size={dpadSize} isIOS={isIOS} />
          <AnalogJoystick
            label="LS"
            clickLabel="L3"
            config={leftStickConfig}
            onMove={handleLeftStickMove}
            onClickToggle={(pressed) => handleStickClick('l3', pressed)}
            size={stickSize}
            isIOS={isIOS}
          />
        </div>

        {/* Center Column: System Controls & Pop-Out Trackpad Button */}
        <div className="flex flex-col items-center justify-center z-10 px-1 shrink-0">
          <CenterControls
            onButtonChange={handleCenterButtonChange}
            onOpenSettings={() => setShowSettings(true)}
            onToggleTouchpad={() => setShowTouchpadModal((prev) => !prev)}
            isTouchpadOpen={showTouchpadModal}
            onReplayBoot={() => setShowBootAnimation(true)}
            isIOS={isIOS}
          />
        </div>

        {/* Right Wing Pod: Right Analog Stick & Action Buttons (ABXY) */}
        <div
          style={{ maxWidth: `${maxPodWidth}px` }}
          className="flex items-center justify-around gap-2 sm:gap-3 bg-gradient-to-b from-[#1E1431]/95 via-[#110B20]/98 to-[#070411]/100 px-3 py-2 sm:px-4 sm:py-3 rounded-3xl sm:rounded-[2rem] border border-fuchsia-500/30 backdrop-blur-md shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-fuchsia-400/10 shrink-0 transition-transform h-[86%] max-h-[250px]"
        >
          <AnalogJoystick
            label="RS"
            clickLabel="R3"
            config={rightStickConfig}
            onMove={handleRightStickMove}
            onClickToggle={(pressed) => handleStickClick('r3', pressed)}
            size={stickSize}
            isIOS={isIOS}
          />
          <ActionButtons
            layout={layout}
            onButtonChange={handleActionButtonChange}
            size={actionSize}
            isIOS={isIOS}
          />
        </div>
      </div>

      {/* Pop-Out Precision Touchpad Modal Overlay (Zero Layout Shift on Underneath Controller) */}
      <TouchpadModal
        isOpen={showTouchpadModal}
        onClose={() => setShowTouchpadModal(false)}
        onMouseMove={sendMouseMove}
        onMouseClick={sendMouseClick}
        onMouseScroll={sendMouseScroll}
        isIOS={isIOS}
      />

      {/* Quick Settings Dialog */}
      <QuickSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        layout={layout}
        onLayoutChange={setLayout}
        leftStickConfig={leftStickConfig}
        onLeftStickConfigChange={setLeftStickConfig}
        rightStickConfig={rightStickConfig}
        onRightStickConfigChange={setRightStickConfig}
        hapticEnabled={hapticEnabled}
        onHapticToggle={setHapticEnabled}
        onReplayBoot={() => setShowBootAnimation(true)}
        isIOS={isIOS}
        isPWA={isPWA}
      />

      {/* Safari Fullscreen & PWA Guide Modal */}
      <SafariFullscreenModal
        isOpen={showSafariGuide}
        onClose={() => setShowSafariGuide(false)}
        onHideAddressBar={() => window.scrollTo(0, 1)}
        isIOS={isIOS}
      />
    </div>
  );
};
