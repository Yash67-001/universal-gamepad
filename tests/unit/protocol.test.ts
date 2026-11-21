import { encodeControllerState, decodeControllerState, INITIAL_CONTROLLER_STATE, ControllerState } from '../../packages/shared-protocol/src';
import { applyRadialDeadzone, touchOffsetToNormalized, DEFAULT_PROFILES } from '../../packages/controller-core/src';

function runTests() {
  console.log('--- RUNNING UNIVERSAL GAMEPAD UNIT TESTS ---');
  let failures = 0;

  // Test 1: Binary Encoding & Decoding Round-Trip
  const testState: ControllerState = {
    buttons: {
      a: true,
      b: false,
      x: true,
      y: false,
      dpadUp: false,
      dpadDown: true,
      dpadLeft: false,
      dpadRight: false,
      l1: true,
      r1: false,
      l3: true,
      r3: false,
      start: true,
      select: false,
      home: false,
      turbo: true,
    },
    axes: {
      leftX: 0.75,
      leftY: -0.5,
      rightX: -0.25,
      rightY: 0.95,
    },
    triggers: {
      l2: 0.42,
      r2: 1.0,
    },
    timestamp: 1234567,
    sequence: 42,
  };

  const buffer = encodeControllerState(testState, 42);
  if (buffer.byteLength !== 20) {
    console.error(`FAIL: Expected 20-byte buffer, got ${buffer.byteLength}`);
    failures++;
  } else {
    console.log('PASS: Binary packet size is exactly 20 bytes');
  }

  const decoded = decodeControllerState(buffer);
  if (!decoded) {
    console.error('FAIL: Decoded packet is null');
    failures++;
  } else {
    const s = decoded.state;
    const assertBool = (name: string, actual: boolean, expected: boolean) => {
      if (actual !== expected) {
        console.error(`FAIL: Button ${name} mismatch: ${actual} vs ${expected}`);
        failures++;
      }
    };

    assertBool('A', s.buttons.a, true);
    assertBool('B', s.buttons.b, false);
    assertBool('X', s.buttons.x, true);
    assertBool('Y', s.buttons.y, false);
    assertBool('DpadDown', s.buttons.dpadDown, true);
    assertBool('L1', s.buttons.l1, true);
    assertBool('L3', s.buttons.l3, true);
    assertBool('Start', s.buttons.start, true);
    assertBool('Turbo', s.buttons.turbo, true);

    const assertFloat = (name: string, actual: number, expected: number, tolerance = 0.01) => {
      if (Math.abs(actual - expected) > tolerance) {
        console.error(`FAIL: Axis ${name} mismatch: ${actual} vs ${expected}`);
        failures++;
      }
    };

    assertFloat('leftX', s.axes.leftX, 0.75);
    assertFloat('leftY', s.axes.leftY, -0.5);
    assertFloat('rightX', s.axes.rightX, -0.25);
    assertFloat('rightY', s.axes.rightY, 0.95);
    assertFloat('l2', s.triggers.l2, 0.42);
    assertFloat('r2', s.triggers.r2, 1.0);

    if (decoded.sequence !== 42) {
      console.error(`FAIL: Sequence mismatch: ${decoded.sequence} vs 42`);
      failures++;
    } else {
      console.log('PASS: Binary serialization & deserialization round-trip verified');
    }
  }

  // Test 2: Deadzone calculations
  const xboxProfile = DEFAULT_PROFILES.xbox;
  // Inside deadzone (0.05 < 0.10)
  const deadRes = applyRadialDeadzone(0.05, 0.05, xboxProfile.leftStick);
  if (deadRes.x !== 0 || deadRes.y !== 0) {
    console.error(`FAIL: Expected deadzone filtering, got (${deadRes.x}, ${deadRes.y})`);
    failures++;
  } else {
    console.log('PASS: Deadzone filtering correctly zeroes small inputs');
  }

  // Outside deadzone
  const liveRes = applyRadialDeadzone(0.5, 0.0, xboxProfile.leftStick);
  if (liveRes.x <= 0 || liveRes.x > 1.0) {
    console.error(`FAIL: Expected valid normalized output, got ${liveRes.x}`);
    failures++;
  } else {
    console.log(`PASS: Analog deadzone curve correctly normalized 0.5 to ${liveRes.x}`);
  }

  // Circular clamping
  const touchOffset = touchOffsetToNormalized(120, 0, 100);
  if (Math.abs(touchOffset.x - 1.0) > 0.001) {
    console.error(`FAIL: Expected circular clamping to 1.0, got ${touchOffset.x}`);
    failures++;
  } else {
    console.log('PASS: Circular boundary clamping verified at 1.0');
  }

  console.log(`\nTEST RESULTS: ${failures === 0 ? 'ALL TESTS PASSED!' : `${failures} FAILURES`}`);
  if (failures > 0) process.exit(1);
}

runTests();
