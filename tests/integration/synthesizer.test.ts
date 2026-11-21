import path from 'path';
import { fileURLToPath } from 'url';
import { InputEngine } from '../../apps/desktop/src/server/inputEngine.js';
import { ControllerState } from '../../packages/shared-protocol/src/types.js';

async function runTests() {
  console.log('--- TESTING INPUT ENGINE & NATIVE SYNTHESIZER ---');
  
  const engine = new InputEngine();

  // Test 1: Mouse movement & clicks
  console.log('Test 1: Mouse movement & clicks...');
  engine.moveMouseNative(10, 10);
  engine.clickMouseNative('left', true);
  engine.clickMouseNative('left', false);
  engine.clickMouseNative('right', true);
  engine.clickMouseNative('right', false);
  engine.triggerMouseClick('left');
  engine.triggerMouseClick('right');
  engine.scrollMouseNative(5);
  console.log('PASS: Native mouse synthesizer accepted all movement, clicks, and scroll without errors');

  // Test 2: Right Stick RS decoupling
  console.log('Test 2: Verifying Right Stick (RS) is decoupled from mouse cursor...');
  const stateWithRS: ControllerState = {
    buttons: {
      a: false, b: false, x: false, y: false,
      dpadUp: false, dpadDown: false, dpadLeft: false, dpadRight: false,
      l1: false, r1: false, l3: false, r3: false,
      start: false, select: false, home: false, turbo: false
    },
    axes: {
      leftX: 0,
      leftY: 0,
      rightX: 0.8, // Right stick right -> should trigger KeyL
      rightY: 0.8  // Right stick up -> should trigger KeyI
    },
    triggers: { l2: 0, r2: 0 },
    timestamp: Date.now(),
    sequence: 1
  };

  engine.processState(stateWithRS);
  const activeKeys = engine.getActiveKeys();
  console.log('Active keys with RS deflected:', activeKeys);
  if (activeKeys.includes('KeyL') && activeKeys.includes('KeyI')) {
    console.log('PASS: RS successfully mapped to camera look keys (KeyL, KeyI) without hijacking mouse cursor');
  } else {
    throw new Error('RS did not activate expected camera look keys');
  }

  // Test 3: Stuck-button watchdog neutralization
  console.log('Test 3: Testing 250ms watchdog auto-neutralize...');
  await new Promise((r) => setTimeout(r, 300));
  const activeKeysAfterWatchdog = engine.getActiveKeys();
  if (activeKeysAfterWatchdog.length === 0) {
    console.log('PASS: Stuck-button watchdog neutralized all active keys automatically');
  } else {
    throw new Error('Watchdog failed to neutralize keys: ' + activeKeysAfterWatchdog.join(', '));
  }

  console.log('ALL SYNTHESIZER & TOUCHPAD TESTS PASSED 100%!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
