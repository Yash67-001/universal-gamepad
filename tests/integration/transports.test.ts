import assert from 'assert';
import http from 'http';
import { HostService } from '../../apps/desktop/src/server/hostService';

async function fetchJson(url: string, options: any = {}) {
  return new Promise<any>((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTransportsTest() {
  console.log('\n--- TESTING MULTI-TRANSPORT API (WI-FI, USB, BLUETOOTH) ---');
  const testPort = 8997;
  const host = new HostService(testPort);

  try {
    await host.start();

    // 1. Test GET /api/transports
    const transports = await fetchJson(`http://127.0.0.1:${testPort}/api/transports`);
    assert(transports.wifi, 'Transports must include Wi-Fi section');
    assert(transports.usb, 'Transports must include USB section');
    assert(transports.bluetooth, 'Transports must include Bluetooth section');
    assert.strictEqual(typeof transports.usb.isCableConnected, 'boolean');
    assert.strictEqual(typeof transports.bluetooth.isEnabled, 'boolean');
    console.log('PASS: /api/transports returned full Wi-Fi, USB, and Bluetooth status');
    console.log(`      Wi-Fi IP: ${transports.wifi.ip}`);
    console.log(`      USB Device: ${transports.usb.deviceName} (Cable Connected: ${transports.usb.isCableConnected})`);
    console.log(`      Bluetooth Active: ${transports.bluetooth.isEnabled}`);

    // 2. Test GET /api/status contains transports
    const status = await fetchJson(`http://127.0.0.1:${testPort}/api/status`);
    assert(status.interfaces && status.interfaces.length > 0, 'Interfaces must be present');
    assert(status.session && status.session.pin, 'PIN must be present');
    console.log('PASS: /api/status verified with interfaces and active session');

    // 3. Test POST /api/transports/setup-usb
    const usbResult = await fetchJson(`http://127.0.0.1:${testPort}/api/transports/setup-usb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert(typeof usbResult.success === 'boolean', 'USB reverse setup must return success boolean');
    console.log(`PASS: /api/transports/setup-usb responded: ${usbResult.message}`);

    console.log('\n======================================================');
    console.log('MULTI-TRANSPORT API TESTS: 100% PASSED!');
    console.log('======================================================\n');
  } finally {
    await host.stop();
  }
}

runTransportsTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
