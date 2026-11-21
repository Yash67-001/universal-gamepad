import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ControllerState,
  ConnectionStatus,
  LatencyReport,
  INITIAL_CONTROLLER_STATE,
  encodeControllerState,
  encodePingPacket,
  calculateRttMs,
  PacketType,
  PROTOCOL_VERSION,
  HandshakeRequestPayload,
  HandshakeResponsePayload,
} from '@universal-gamepad/shared-protocol';
import { detectDeviceCapabilities } from '../utils/capabilities';

interface UseGamepadSocketResult {
  status: ConnectionStatus;
  latency: LatencyReport;
  errorMessage: string | null;
  serverParams: { host: string; port: number; session: string; hasToken: boolean };
  sendInputState: (state: ControllerState) => void;
  sendMouseMove: (dx: number, dy: number) => void;
  sendMouseClick: (button: 'left' | 'right', down: boolean) => void;
  sendMouseScroll: (deltaY: number) => void;
  connectWithPin: (pin: string, hostOverride?: string, portOverride?: number) => void;
  disconnect: () => void;
}

export function useGamepadSocket(): UseGamepadSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latency, setLatency] = useState<LatencyReport>({
    rttMs: 0,
    jitterMs: 0,
    packetsSent: 0,
    packetsReceived: 0,
    packetLossPercent: 0,
    lastUpdated: Date.now(),
  });

  const socketRef = useRef<WebSocket | null>(null);
  const sequenceRef = useRef<number>(0);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read URL parameters
  const getParamsFromUrl = useCallback(() => {
    if (typeof window === 'undefined') {
      return { host: '', port: 8080, token: '', pin: '', session: '', hasToken: false };
    }
    const params = new URLSearchParams(window.location.search);
    const currentHostname = window.location.hostname;
    // Prefer window.location.hostname when accessed over LAN IP because that host is guaranteed reachable
    const isLocalhost = !currentHostname || currentHostname === 'localhost' || currentHostname === '127.0.0.1';
    const host = !isLocalhost ? currentHostname : (params.get('host') || '127.0.0.1');
    const port = parseInt(params.get('port') || window.location.port || '8080', 10);
    const token = params.get('token') || '';
    const pin = params.get('pin') || '';
    const session = params.get('session') || '';
    return { host, port, token, pin, session, hasToken: !!token || !!pin };
  }, []);

  const [serverParams] = useState(getParamsFromUrl);
  const autoConnectAttempted = useRef(false);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const connectToHost = useCallback(
    (host: string, port: number, pin = '', token = '', session = '') => {
      disconnect();
      setStatus('pairing');
      setErrorMessage(null);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${host}:${port}/gamepad-ws`;

      try {
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';
        socketRef.current = ws;

        ws.onopen = () => {
          // Send Handshake with PIN or Token
          const caps = detectDeviceCapabilities();
          const handshake: HandshakeRequestPayload = {
            type: 'handshake_request',
            protocolVersion: PROTOCOL_VERSION,
            sessionId: session || serverParams.session,
            token,
            pin,
            deviceCapabilities: caps,
            clientTime: Date.now(),
          };
          ws.send(JSON.stringify(handshake));
        };

        ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'handshake_response') {
                const res = msg as HandshakeResponsePayload;
                if (res.success) {
                  setStatus('connected');
                  setErrorMessage(null);
                  if (typeof window !== 'undefined') {
                    if (pin) localStorage.setItem('ug_last_pin', pin);
                    if (token) localStorage.setItem('ug_last_token', token);
                    localStorage.setItem('ug_last_host', host);
                  }
                } else {
                  console.error('Handshake failed:', res.error);
                  setStatus('disconnected');
                  setErrorMessage(res.error || 'Authentication failed. Please check the PIN.');
                }
              }
            } catch (err) {
              console.error('Failed to parse text frame:', err);
            }
            return;
          }

          // Binary message handling
          if (event.data instanceof ArrayBuffer) {
            const view = new DataView(event.data);
            if (view.byteLength >= 8) {
              const pType = view.getUint8(2);
              if (pType === PacketType.PONG) {
                const origTimestamp = view.getUint32(4, true);
                const rtt = calculateRttMs(origTimestamp);
                setLatency((prev) => ({
                  ...prev,
                  rttMs: rtt,
                  packetsSent: packetsSentRef.current,
                  packetsReceived: prev.packetsReceived + 1,
                  lastUpdated: Date.now(),
                }));
              }
            }
          }
        };

        ws.onerror = () => {
          setStatus('disconnected');
          setErrorMessage('Could not connect to computer. Ensure you are on the same Wi-Fi/network.');
        };

        ws.onclose = () => {
          setStatus('disconnected');
          if (pingTimerRef.current) {
            clearInterval(pingTimerRef.current);
            pingTimerRef.current = null;
          }
        };

        // Ping Loop every 1 second
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const pingBuf = encodePingPacket();
            ws.send(pingBuf);
          }
        }, 1000);
      } catch (err) {
        console.error('WebSocket connection error:', err);
        setStatus('disconnected');
        setErrorMessage('Failed to open connection. Please verify IP address.');
      }
    },
    [disconnect, serverParams.session]
  );

  const connectWithPin = useCallback(
    (pin: string, hostOverride?: string, portOverride?: number) => {
      const h = hostOverride || serverParams.host || window.location.hostname || '127.0.0.1';
      const p = portOverride || serverParams.port || 8080;
      connectToHost(h, p, pin, '', serverParams.session);
    },
    [connectToHost, serverParams]
  );

  // Auto-connect on mount if token, pin in URL, or saved session exists
  useEffect(() => {
    if (autoConnectAttempted.current) return;
    autoConnectAttempted.current = true;

    const params = getParamsFromUrl();
    const savedPin = typeof window !== 'undefined' ? localStorage.getItem('ug_last_pin') || '' : '';
    const pinToUse = params.pin || savedPin;

    if (params.token || pinToUse) {
      connectToHost(params.host, params.port, pinToUse, params.token, params.session);
    }
  }, [connectToHost, getParamsFromUrl]);

  const packetsSentRef = useRef<number>(0);

  const sendInputState = useCallback((state: ControllerState) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    sequenceRef.current = (sequenceRef.current + 1) & 0xff;
    packetsSentRef.current++;
    const buffer = encodeControllerState(state, sequenceRef.current);
    socketRef.current.send(buffer);
  }, []);

  const sendMouseMove = useCallback((dx: number, dy: number) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: 'mouse_move', dx, dy }));
  }, []);

  const sendMouseClick = useCallback((button: 'left' | 'right', down: boolean) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: 'mouse_click', button, down }));
  }, []);

  const sendMouseScroll = useCallback((deltaY: number) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: 'mouse_scroll', deltaY }));
  }, []);

  return {
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
  };
}
