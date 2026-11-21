import { HostService } from '../../apps/desktop/src/server/hostService';

async function testHttpServing() {
  console.log('--- TESTING HTTP PWA SERVING & API ENDPOINTS ---');
  const hostService = new HostService(8998);
  await hostService.start();

  try {
    // 1. Fetch Root as Mobile Phone / QR code scan (Should serve Mobile PWA HTML)
    const resMobile = await fetch('http://127.0.0.1:8998/?token=test1234', {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
    });
    const mobileHtml = await resMobile.text();
    if (!mobileHtml.includes('<title>Universal Gamepad</title>')) {
      throw new Error(`Failed to serve mobile controller PWA: ${mobileHtml.slice(0, 200)}`);
    }
    console.log('PASS: Mobile client / QR scan accurately receives the Universal Gamepad Mobile Controller PWA');

    // 2. Fetch Dashboard as Desktop Computer (Should serve Desktop Companion Dashboard)
    const resDesktop = await fetch('http://127.0.0.1:8998/dashboard');
    const desktopHtml = await resDesktop.text();
    if (!desktopHtml.includes('Universal Gamepad - Desktop Companion')) {
      throw new Error(`Failed to serve desktop companion: ${desktopHtml.slice(0, 200)}`);
    }
    console.log('PASS: Desktop browser accurately receives the Desktop Companion Dashboard');

    // 3. Fetch API Status
    const resApi = await fetch('http://127.0.0.1:8998/api/status');
    const apiJson = await resApi.json();
    if (!apiJson.session || !apiJson.session.pin) {
      throw new Error('API /api/status missing session or PIN');
    }
    console.log(`PASS: /api/status returned valid session with PIN: ${apiJson.session.pin}`);

    // 4. Test Token Regeneration API
    const resRegen = await fetch('http://127.0.0.1:8998/api/regenerate-token', { method: 'POST' });
    const regenJson = await resRegen.json();
    if (!regenJson.success || !regenJson.session) {
      throw new Error('Token regeneration failed');
    }
    console.log(`PASS: Token regeneration endpoint succeeded. New PIN: ${regenJson.session.pin}`);

    console.log('\nALL HTTP & PWA ENDPOINTS VERIFIED SUCCESSFULLY!');
  } finally {
    await hostService.stop();
  }
}

testHttpServing()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('HTTP Test Failure:', err);
    process.exit(1);
  });
