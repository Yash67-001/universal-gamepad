import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DesktopDashboardState,
} from './server/hostService';
import {
  ControllerProfileType,
  INITIAL_CONTROLLER_STATE,
  ControllerState,
} from '@universal-gamepad/shared-protocol';

import { Header } from './components/Header';
import { PairingCard } from './components/PairingCard';
import { ConnectedDeviceCard } from './components/ConnectedDeviceCard';
import { GamepadVisualizer } from './components/GamepadVisualizer';
import { ProfileSelector } from './components/ProfileSelector';
import { DriverCard } from './components/DriverCard';

export const App: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DesktopDashboardState | null>(null);
  const [liveGamepadState, setLiveGamepadState] = useState<ControllerState>(() =>
    JSON.parse(JSON.stringify(INITIAL_CONTROLLER_STATE))
  );
  const [liveMetrics, setLiveMetrics] = useState({ rttMs: 0, packetCount: 0, lastSequence: 0 });
  const [selectedProfile, setSelectedProfile] = useState<ControllerProfileType>('xbox');

  const wsRef = useRef<WebSocket | null>(null);
  const prevStatusRef = useRef<string>('waiting');

  // Play high-tech audio chime on successful controller connection
  const playConnectChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Dual-tone harmonic chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880.00, now + 0.12); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6 harmonic

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.12);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  // Monitor status transitions to trigger chime
  useEffect(() => {
    const currentStatus = dashboardData?.status || 'waiting';
    if (currentStatus === 'connected' && prevStatusRef.current !== 'connected') {
      playConnectChime();
    }
    prevStatusRef.current = currentStatus;
  }, [dashboardData?.status, playConnectChime]);

  // Connect to Desktop WebSocket
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname || '127.0.0.1'}:8080/desktop-ws`;
    const connectWs = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'init_state' || msg.type === 'status_update') {
              setDashboardData(msg.data);
              if (msg.data.latestGamepadState) {
                setLiveGamepadState(msg.data.latestGamepadState);
              }
              if (msg.data.metrics) {
                setLiveMetrics(msg.data.metrics);
              }
            } else if (msg.type === 'gamepad_state') {
              setLiveGamepadState(msg.state);
              if (msg.metrics) {
                setLiveMetrics(msg.metrics);
              }
            }
          } catch (err) {
            console.error('Error parsing desktop WS message:', err);
          }
        };

        ws.onclose = () => {
          // Reconnect after 2 seconds
          setTimeout(connectWs, 2000);
        };
      } catch (err) {
        console.warn('Desktop WS connection failed, falling back to HTTP fetch:', err);
      }
    };

    connectWs();

    // Fallback initial HTTP fetch
    fetch(`http://${window.location.hostname || '127.0.0.1'}:8080/api/status`)
      .then((r) => r.json())
      .then((data: DesktopDashboardState) => {
        setDashboardData(data);
        if (data.latestGamepadState) setLiveGamepadState(data.latestGamepadState);
        if (data.metrics) setLiveMetrics(data.metrics);
      })
      .catch(() => {});

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleRegenerateToken = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname || '127.0.0.1'}:8080/api/regenerate-token`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && dashboardData) {
        setDashboardData({
          ...dashboardData,
          session: data.session,
        });
      }
    } catch (err) {
      console.error('Failed to regenerate pairing token:', err);
    }
  };

  const handleSelectInterface = async (ip: string) => {
    try {
      const res = await fetch(`http://${window.location.hostname || '127.0.0.1'}:8080/api/select-interface`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();
      if (data.success && dashboardData) {
        setDashboardData({
          ...dashboardData,
          selectedInterface: data.selectedInterface,
          pairingUrl: data.pairingUrl,
        });
      }
    } catch (err) {
      console.error('Failed to select interface:', err);
    }
  };

  const handleDisconnectDevice = async () => {
    try {
      await fetch(`http://${window.location.hostname || '127.0.0.1'}:8080/api/disconnect-device`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to disconnect device:', err);
    }
  };

  const handleSetupUsb = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`http://${window.location.hostname || '127.0.0.1'}:8080/api/transports/setup-usb`, {
        method: 'POST',
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to setup USB reverse' };
    }
  };

  const handleRefreshTransports = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname || '127.0.0.1'}:8080/api/transports`);
      const transports = await res.json();
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          transports,
        });
      }
    } catch (err) {
      console.warn('Failed to refresh transports:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gamepad-bg text-slate-100 flex flex-col font-sans">
      <Header
        status={dashboardData?.status || 'waiting'}
        driverReport={dashboardData?.driverReport}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Pairing Panel + Connected Device Info */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <PairingCard
            status={dashboardData?.status || 'waiting'}
            qrCodeDataUrl={dashboardData?.qrCodeDataUrl || ''}
            pairingUrl={dashboardData?.pairingUrl || ''}
            pin={dashboardData?.session.pin || ''}
            interfaces={dashboardData?.interfaces || []}
            selectedInterface={dashboardData?.selectedInterface || '127.0.0.1'}
            transports={dashboardData?.transports}
            connectedDevice={dashboardData?.connectedDevice}
            metrics={liveMetrics}
            latestGamepadState={liveGamepadState}
            onSelectInterface={handleSelectInterface}
            onRegenerateToken={handleRegenerateToken}
            onRefreshTransports={handleRefreshTransports}
            onSetupUsb={handleSetupUsb}
            onDisconnect={handleDisconnectDevice}
          />

          <ConnectedDeviceCard
            device={dashboardData?.connectedDevice}
            metrics={liveMetrics}
            onDisconnect={handleDisconnectDevice}
          />
        </div>

        {/* Right Column (7 cols): Input Tester + Profile Selector + Driver Info */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <GamepadVisualizer state={liveGamepadState} />

          <ProfileSelector
            currentProfile={selectedProfile}
            onSelectProfile={setSelectedProfile}
          />

          <DriverCard report={dashboardData?.driverReport} />
        </div>
      </main>
    </div>
  );
};
