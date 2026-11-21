import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { WebSocketServer, WebSocket } from 'ws';
import QRCode from 'qrcode';
import {
  decodeControllerState,
  encodePongPacket,
  PacketType,
  PROTOCOL_VERSION,
  HandshakeRequestPayload,
  HandshakeResponsePayload,
  ConnectionStatus,
  ControllerState,
  INITIAL_CONTROLLER_STATE,
} from '@universal-gamepad/shared-protocol';
import { getAvailableNetworkInterfaces, NetworkInterfaceInfo } from './network';
import { SessionManager, PairingSession } from './session';
import { DriverManager, DriverStatusReport } from './driverManager';
import { InputEngine } from './inputEngine';
import { TransportManager, TransportStateReport } from './transportManager';
import { GAMEPAD_TESTER_BRIDGE_SCRIPT } from './bridgeScript';

export interface DesktopDashboardState {
  status: ConnectionStatus;
  interfaces: NetworkInterfaceInfo[];
  selectedInterface: string;
  qrCodeDataUrl: string;
  pairingUrl: string;
  session: PairingSession;
  driverReport: DriverStatusReport;
  transports?: TransportStateReport;
  connectedDevice?: {
    browser: string;
    os: string;
    ip: string;
    connectedAt: number;
  };
  metrics: {
    rttMs: number;
    packetCount: number;
    lastSequence: number;
    packetLoss: number;
  };
  latestGamepadState: ControllerState;
}

export class HostService {
  private app = express();
  private server: http.Server;
  private gamepadWss: WebSocketServer;
  private desktopWss: WebSocketServer;

  private sessionManager = new SessionManager();
  private inputEngine = new InputEngine();
  private transportManager = new TransportManager();
  private port = 8080;

  private currentStatus: ConnectionStatus = 'waiting';
  private selectedIp: string = '127.0.0.1';
  private qrCodeDataUrl: string = '';
  private pairingUrl: string = '';
  private connectedPhoneWs: WebSocket | null = null;
  private desktopSockets = new Set<WebSocket>();
  private currentTransports: TransportStateReport | null = null;
  private transportRefreshInterval: NodeJS.Timeout | null = null;

  private connectedDeviceMeta?: {
    browser: string;
    os: string;
    ip: string;
    connectedAt: number;
  };

  private packetCount = 0;
  private lastRtt = 0;
  private lastSeq = 0;
  private latestState: ControllerState = JSON.parse(JSON.stringify(INITIAL_CONTROLLER_STATE));

  constructor(port = 8080) {
    this.port = port;
    this.server = http.createServer(this.app);

    // Initialize WebSockets
    this.gamepadWss = new WebSocketServer({ noServer: true });
    this.desktopWss = new WebSocketServer({ noServer: true });

    this.setupHttpRoutes();
    this.setupUpgradeHandler();
    this.setupGamepadWebSocket();
    this.setupDesktopWebSocket();
  }

  private setupHttpRoutes(): void {
    // Parse JSON bodies
    this.app.use(express.json());

    // Enable CORS for local network development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', '*');
      next();
    });

    // API to get current session and network info
    this.app.get('/api/status', (req, res) => {
      res.json(this.getDashboardState());
    });

    // API to get multi-transport status (Wi-Fi, USB, Bluetooth)
    this.app.get('/api/transports', async (req, res) => {
      const transports = await this.refreshTransports();
      res.json(transports);
    });

    // API to setup Android USB port forwarding
    this.app.post('/api/transports/setup-usb', async (req, res) => {
      const result = await this.transportManager.setupAndroidUsbReverse(this.port);
      await this.refreshTransports();
      this.broadcastDashboardState();
      res.json(result);
    });

    // API to select active network interface
    this.app.post('/api/select-interface', async (req, res) => {
      const { ip } = req.body || {};
      if (ip) {
        this.selectedIp = ip;
        await this.updateQrCode();
        this.broadcastDashboardState();
      }
      res.json({ success: true, selectedInterface: this.selectedIp, pairingUrl: this.pairingUrl });
    });

    // API to rotate/regenerate pairing token
    this.app.post('/api/regenerate-token', async (req, res) => {
      this.sessionManager.generateNewSession();
      await this.updateQrCode();
      this.broadcastDashboardState();
      res.json({ success: true, session: this.sessionManager.getCurrentSession() });
    });

    // API to disconnect active phone
    this.app.post('/api/disconnect-device', (req, res) => {
      if (this.connectedPhoneWs) {
        this.connectedPhoneWs.close();
        this.connectedPhoneWs = null;
      }
      this.handlePhoneDisconnect();
      res.json({ success: true });
    });

    // Serve Universal Gamepad Browser Bridge for Gamepad Tester & Web Games
    this.app.get('/bridge.js', (req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(GAMEPAD_TESTER_BRIDGE_SCRIPT);
    });

    // Serve Desktop Dashboard from /dashboard
    const desktopDist = path.resolve(__dirname, '../../dist');
    if (fs.existsSync(desktopDist)) {
      this.app.use('/dashboard', express.static(desktopDist));
      this.app.get('/dashboard*', (req, res) => {
        res.sendFile(path.join(desktopDist, 'index.html'));
      });
    }

    // Serve built mobile-controller PWA directly from dist
    const mobileDist = path.resolve(__dirname, '../../../mobile-controller/dist');
    if (fs.existsSync(mobileDist)) {
      // If root is visited on desktop without a pairing token, redirect to dashboard
      this.app.get('/', (req, res, next) => {
        const hasToken = !!req.query.token;
        const ua = req.headers['user-agent'] || '';
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
        if (!hasToken && !isMobile && fs.existsSync(desktopDist)) {
          return res.redirect('/dashboard');
        }
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(path.join(mobileDist, 'index.html'));
      });

      this.app.use(express.static(mobileDist));
      this.app.get('*', (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(path.join(mobileDist, 'index.html'));
      });
    } else {
      this.app.get('/', (req, res) => {
        res.send(`
          <html>
            <body style="background:#0A0D14;color:#00F0FF;font-family:sans-serif;padding:2rem;">
              <h2>Universal Gamepad Service is Running</h2>
              <p>Please build the mobile-controller PWA: <code>npm run build --workspace=apps/mobile-controller</code></p>
            </body>
          </html>
        `);
      });
    }
  }

  private setupUpgradeHandler(): void {
    this.server.on('upgrade', (request, socket, head) => {
      const pathname = request.url?.split('?')[0];

      if (pathname === '/gamepad-ws') {
        this.gamepadWss.handleUpgrade(request, socket, head, (ws) => {
          this.gamepadWss.emit('connection', ws, request);
        });
      } else if (pathname === '/desktop-ws') {
        this.desktopWss.handleUpgrade(request, socket, head, (ws) => {
          this.desktopWss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });
  }

  private setupGamepadWebSocket(): void {
    this.gamepadWss.on('connection', (ws, request) => {
      const clientIp = request.socket.remoteAddress || 'unknown';

      ws.on('message', (message, isBinary) => {
        if (!isBinary) {
          // Handshake or control message
          try {
            const data = JSON.parse(message.toString());
            if (data.type === 'handshake_request') {
              const req = data as HandshakeRequestPayload;
              const validation = this.sessionManager.validatePairing(req.token, req.pin, clientIp);

              if (validation.valid) {
                this.connectedPhoneWs = ws;
                this.currentStatus = 'connected';
                const caps = req.deviceCapabilities || (req as any).deviceInfo || {};
                this.connectedDeviceMeta = {
                  browser: caps.browser || 'Mobile Safari',
                  os: (caps.os || 'iOS Device').toUpperCase(),
                  ip: clientIp,
                  connectedAt: Date.now(),
                };

                const response: HandshakeResponsePayload = {
                  type: 'handshake_response',
                  success: true,
                  assignedSlot: 1,
                  profile: 'xbox',
                  serverTime: Date.now(),
                  heartbeatIntervalMs: 1000,
                };
                ws.send(JSON.stringify(response));
                this.broadcastDashboardState();
              } else {
                const response: HandshakeResponsePayload = {
                  type: 'handshake_response',
                  success: false,
                  assignedSlot: 0,
                  profile: 'xbox',
                  error: validation.reason || 'Authentication failed',
                  serverTime: Date.now(),
                  heartbeatIntervalMs: 1000,
                };
                ws.send(JSON.stringify(response));
                ws.close();
              }
            } else if (data.type === 'mouse_move') {
              // Direct macOS cursor positioning from phone Touchpad!
              const dx = Number(data.dx) || 0;
              const dy = Number(data.dy) || 0;
              this.inputEngine.moveMouseNative(dx, dy);
            } else if (data.type === 'mouse_click') {
              // Direct Left or Right click from phone Touchpad!
              const btn = data.button === 'right' ? 'right' : 'left';
              this.inputEngine.clickMouseNative(btn, !!data.down);
            } else if (data.type === 'mouse_scroll') {
              // Direct scroll wheel from phone Touchpad!
              const dy = Number(data.deltaY) || 0;
              this.inputEngine.scrollMouseNative(dy);
            }
          } catch (err) {
            console.error('Invalid JSON message on gamepad-ws:', err);
          }
          return;
        }

        // Binary message handling
        const buf = message as Buffer;
        if (buf.length >= 8) {
          const pType = buf.readUInt8(2);

          // Ping / Pong
          if (pType === PacketType.PING) {
            const origTime = buf.readUInt32LE(4);
            const rtt = Math.max(0.5, Date.now() - origTime);
            this.lastRtt = rtt;
            const pong = encodePongPacket(origTime);
            ws.send(Buffer.from(pong));
            return;
          }

          // Gamepad Input Frame
          if (pType === PacketType.INPUT_STATE) {
            const decoded = decodeControllerState(buf);
            if (decoded) {
              this.packetCount++;
              this.lastSeq = decoded.sequence;
              this.latestState = decoded.state;
              this.inputEngine.processState(decoded.state);
              this.broadcastLiveGamepadState();
            }
          }
        }
      });

      ws.on('close', () => {
        if (this.connectedPhoneWs === ws) {
          this.handlePhoneDisconnect();
        }
      });

      ws.on('error', (err) => {
        console.warn('Smartphone WS error:', err);
      });
    });
  }

  private handlePhoneDisconnect(): void {
    this.connectedPhoneWs = null;
    this.currentStatus = 'waiting';
    this.connectedDeviceMeta = undefined;
    this.inputEngine.flushToNeutral();
    this.latestState = JSON.parse(JSON.stringify(INITIAL_CONTROLLER_STATE));
    this.broadcastDashboardState();
  }

  private setupDesktopWebSocket(): void {
    this.desktopWss.on('connection', (ws) => {
      this.desktopSockets.add(ws);
      ws.send(JSON.stringify({ type: 'init_state', data: this.getDashboardState() }));

      ws.on('close', () => {
        this.desktopSockets.delete(ws);
      });
    });
  }

  private broadcastDashboardState(): void {
    const payload = JSON.stringify({ type: 'status_update', data: this.getDashboardState() });
    for (const ws of this.desktopSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  private lastDashboardBroadcast = 0;

  private broadcastLiveGamepadState(): void {
    if (this.desktopSockets.size === 0) return;
    const now = Date.now();
    if (now - this.lastDashboardBroadcast < 33) return; // Cap dashboard updates at ~30 FPS to eliminate event loop lag
    this.lastDashboardBroadcast = now;

    const payload = JSON.stringify({
      type: 'gamepad_state',
      state: this.latestState,
      metrics: {
        rttMs: this.lastRtt,
        packetCount: this.packetCount,
        lastSequence: this.lastSeq,
      },
    });
    for (const ws of this.desktopSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  public async updateQrCode(): Promise<void> {
    const session = this.sessionManager.getCurrentSession();
    this.pairingUrl = `http://${this.selectedIp}:${this.port}/?host=${this.selectedIp}&port=${this.port}&session=${session.sessionId}&token=${session.token}&pin=${session.pin}`;
    this.qrCodeDataUrl = await QRCode.toDataURL(this.pairingUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: '#00F0FF',
        light: '#0A0D14',
      },
    });
  }

  public async refreshTransports(): Promise<TransportStateReport> {
    try {
      this.currentTransports = await this.transportManager.getTransportsStatus();
    } catch (err) {
      console.warn('Failed to refresh transports:', err);
    }
    return this.currentTransports!;
  }

  public getDashboardState(): DesktopDashboardState {
    const interfaces = getAvailableNetworkInterfaces();
    // Automatically correct selectedIp if it is not among active interfaces
    if (!interfaces.some((i) => i.address === this.selectedIp)) {
      const defaultIface = interfaces.find((i) => i.isDefault) || interfaces[0];
      this.selectedIp = defaultIface?.address || '127.0.0.1';
      this.updateQrCode();
    }
    return {
      status: this.currentStatus,
      interfaces,
      selectedInterface: this.selectedIp,
      qrCodeDataUrl: this.qrCodeDataUrl,
      pairingUrl: this.pairingUrl,
      session: this.sessionManager.getCurrentSession(),
      driverReport: DriverManager.checkDriverStatus(),
      transports: this.currentTransports || undefined,
      connectedDevice: this.connectedDeviceMeta,
      metrics: {
        rttMs: this.lastRtt,
        packetCount: this.packetCount,
        lastSequence: this.lastSeq,
        packetLoss: 0,
      },
      latestGamepadState: this.latestState,
    };
  }

  public async start(): Promise<void> {
    const interfaces = getAvailableNetworkInterfaces();
    this.selectedIp = interfaces[0]?.address || '127.0.0.1';
    await this.updateQrCode();
    await this.refreshTransports();

    this.transportRefreshInterval = setInterval(() => {
      this.refreshTransports().catch(() => {});
    }, 4000);

    return new Promise((resolve) => {
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`\n======================================================`);
        console.log(`🚀 UNIVERSAL GAMEPAD DESKTOP HOST RUNNING ON PORT ${this.port}`);
        console.log(`   🖥️  Computer Dashboard: http://localhost:${this.port}/dashboard`);
        console.log(`   📱 Phone Pairing URL:   ${this.pairingUrl}`);
        console.log(`   🔑 4-Digit Pairing PIN: ${this.sessionManager.getCurrentSession().pin}`);
        console.log(`======================================================\n`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    if (this.transportRefreshInterval) {
      clearInterval(this.transportRefreshInterval);
      this.transportRefreshInterval = null;
    }
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }
}
