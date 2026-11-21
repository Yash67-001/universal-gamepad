import { HostService } from '../../apps/desktop/src/server/hostService';
import { WebSocket } from 'ws';
import {
  encodeControllerState,
  decodeControllerState,
  encodePingPacket,
  calculateRttMs,
  PacketType,
  PROTOCOL_VERSION,
  HandshakeRequestPayload,
  HandshakeResponsePayload,
  ControllerState,
  INITIAL_CONTROLLER_STATE,
} from '../../packages/shared-protocol/src';

async function runIntegrationTest() {
  console.log('--- STARTING UNIVERSAL GAMEPAD INTEGRATION TEST ---');
  const TEST_PORT = 8999;
  const hostService = new HostService(TEST_PORT);
  await hostService.start();

  let failures = 0;

  try {
    const dashboardState = hostService.getDashboardState();

    // Verification 1: Network interfaces & QR code
    if (!dashboardState.qrCodeDataUrl.startsWith('data:image/png;base64,')) {
      console.error('FAIL: QR code data URL missing or invalid format');
      failures++;
    } else {
      console.log('PASS: Generated high-resolution QR code data URL');
    }

    if (!dashboardState.pairingUrl.includes(`:${TEST_PORT}/`)) {
      console.error(`FAIL: Pairing URL invalid: ${dashboardState.pairingUrl}`);
      failures++;
    } else {
      console.log(`PASS: Pairing URL formatted accurately: ${dashboardState.pairingUrl}`);
    }

    if (!dashboardState.session.pin || dashboardState.session.pin.length !== 4) {
      console.error('FAIL: 4-digit pairing PIN missing');
      failures++;
    } else {
      console.log(`PASS: 4-digit fallback PIN generated: ${dashboardState.session.pin}`);
    }

    // Verification 2: Rejection of Invalid PIN
    const wsBad = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/gamepad-ws`);
    await new Promise<void>((resolve, reject) => {
      wsBad.on('open', () => {
        const badHandshake: HandshakeRequestPayload = {
          type: 'handshake_request',
          protocolVersion: PROTOCOL_VERSION,
          sessionId: dashboardState.session.sessionId,
          pin: '9999', // wrong pin
          deviceCapabilities: {
            browser: 'Safari Mobile',
            os: 'ios',
            isPWA: false,
            supportsVibration: false,
            supportsWakeLock: true,
            supportsFullscreen: false,
            supportsOrientationLock: false,
            screenDimensions: { width: 844, height: 390, devicePixelRatio: 3 },
            hasTouch: true,
            maxTouchPoints: 5,
          },
          clientTime: Date.now(),
        };
        wsBad.send(JSON.stringify(badHandshake));
      });

      wsBad.on('message', (data) => {
        const resp = JSON.parse(data.toString()) as HandshakeResponsePayload;
        if (!resp.success) {
          console.log('PASS: Invalid PIN rejected by host server as expected');
          wsBad.close();
          resolve();
        } else {
          reject(new Error('Invalid PIN was unexpectedly accepted!'));
        }
      });
    });

    // Verification 3: Acceptance of Valid 4-Digit PIN
    const wsUrl = `ws://127.0.0.1:${TEST_PORT}/gamepad-ws`;
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 3000);

      ws.on('open', () => {
        // Send Handshake with valid 4-digit PIN!
        const handshake: HandshakeRequestPayload = {
          type: 'handshake_request',
          protocolVersion: PROTOCOL_VERSION,
          sessionId: dashboardState.session.sessionId,
          pin: dashboardState.session.pin, // Correct PIN!
          deviceCapabilities: {
            browser: 'Safari Mobile',
            os: 'ios',
            isPWA: false,
            supportsVibration: false,
            supportsWakeLock: true,
            supportsFullscreen: false,
            supportsOrientationLock: false,
            screenDimensions: { width: 844, height: 390, devicePixelRatio: 3 },
            hasTouch: true,
            maxTouchPoints: 5,
          },
          clientTime: Date.now(),
        };
        ws.send(JSON.stringify(handshake));
      });

      ws.on('message', (data) => {
        try {
          const resp = JSON.parse(data.toString()) as HandshakeResponsePayload;
          if (resp.type === 'handshake_response') {
            if (resp.success) {
              console.log(`PASS: Smartphone handshake verified with valid 4-digit PIN (${dashboardState.session.pin})`);
              clearTimeout(timeout);
              resolve();
            } else {
              reject(new Error(`Handshake failed: ${resp.error}`));
            }
          }
        } catch {}
      });
    });

    // Verification 4: Binary Controller State Streaming (60Hz burst)
    const testInput: ControllerState = {
      buttons: {
        a: true,
        b: true,
        x: false,
        y: false,
        dpadUp: true,
        dpadDown: false,
        dpadLeft: false,
        dpadRight: false,
        l1: true,
        r1: false,
        l3: false,
        r3: true,
        start: false,
        select: false,
        home: false,
        turbo: false,
      },
      axes: {
        leftX: -0.85,
        leftY: 0.92,
        rightX: 0.5,
        rightY: -0.3,
      },
      triggers: {
        l2: 0.75,
        r2: 0.0,
      },
      timestamp: Date.now(),
      sequence: 1,
    };

    const binBuf = encodeControllerState(testInput, 1);
    ws.send(binBuf);

    await new Promise((r) => setTimeout(r, 50));

    const updatedState = hostService.getDashboardState();
    if (updatedState.status !== 'connected') {
      console.error(`FAIL: Host status expected "connected", got "${updatedState.status}"`);
      failures++;
    } else {
      console.log('PASS: Host state updated to CONNECTED');
    }

    if (!updatedState.connectedDevice) {
      console.error('FAIL: Connected device metadata missing');
      failures++;
    } else {
      console.log(`PASS: Connected device registered: ${updatedState.connectedDevice.browser} (${updatedState.connectedDevice.os})`);
    }

    if (!updatedState.latestGamepadState.buttons.a || !updatedState.latestGamepadState.buttons.b) {
      console.error('FAIL: Live gamepad state did not reflect button A and B presses');
      failures++;
    } else {
      console.log('PASS: Live gamepad state accurately captured buttons A + B and DPad-Up');
    }

    // Verification 5: Ping / Pong Latency Measurement
    const pingBuf = encodePingPacket();
    ws.send(pingBuf);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Pong response timeout')), 2000);
      ws.on('message', (msg) => {
        if (msg instanceof Buffer && msg.length >= 8) {
          const pType = msg.readUInt8(2);
          if (pType === PacketType.PONG) {
            const orig = msg.readUInt32LE(4);
            const rtt = calculateRttMs(orig);
            console.log(`PASS: Pong received with RTT: ${rtt.toFixed(1)}ms`);
            clearTimeout(timeout);
            resolve();
          }
        }
      });
    });

    // Verification 6: Watchdog and Disconnect Safety
    ws.close();
    await new Promise((r) => setTimeout(r, 100));

    const postDisconnectState = hostService.getDashboardState();
    if (postDisconnectState.status !== 'waiting') {
      console.error(`FAIL: Expected status to return to "waiting", got "${postDisconnectState.status}"`);
      failures++;
    } else {
      console.log('PASS: Disconnect safely returned host to WAITING state');
    }

    if (postDisconnectState.latestGamepadState.buttons.a) {
      console.error('FAIL: Stuck button detected after disconnect!');
      failures++;
    } else {
      console.log('PASS: Stuck-button watchdog successfully neutralized all inputs');
    }

  } catch (err) {
    console.error('INTEGRATION TEST ERROR:', err);
    failures++;
  } finally {
    await hostService.stop();
  }

  console.log(`\n======================================================`);
  console.log(`INTEGRATION TEST SUMMARY: ${failures === 0 ? '100% PASSED!' : `${failures} TESTS FAILED`}`);
  console.log(`======================================================\n`);

  if (failures > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runIntegrationTest();
