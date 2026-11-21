import { JoystickConfig } from '@universal-gamepad/shared-protocol';

export interface AnalogPoint {
  x: number; // -1.0 to 1.0
  y: number; // -1.0 to 1.0
}

/**
 * Calculates radial deadzone and normalizes analog joystick inputs.
 * Uses genuine circular math to prevent diagonal clipping.
 */
export function applyRadialDeadzone(
  rawX: number,
  rawY: number,
  config: JoystickConfig
): AnalogPoint {
  // Invert axes if requested
  const inX = config.invertX ? -rawX : rawX;
  const inY = config.invertY ? -rawY : rawY;

  const magnitude = Math.hypot(inX, inY);

  // If inside deadzone, return pure zero
  if (magnitude <= config.deadzone) {
    return { x: 0, y: 0 };
  }

  // Circular clamping: clamp magnitude to 1.0
  const clampedMag = Math.min(1.0, magnitude);

  // Scaled radial calculation: re-scale the remaining range [deadzone, 1.0] to [0.0, 1.0]
  const normalizedMag = (clampedMag - config.deadzone) / (1.0 - config.deadzone);

  // Apply sensitivity curve
  let curveMag = normalizedMag;
  if (config.curve === 'exponential') {
    // Quadratic power curve for center precision + high edge responsiveness
    curveMag = Math.pow(normalizedMag, 1.75);
  } else if (config.curve === 's-curve') {
    // Sigmoidal smoothstep
    curveMag = normalizedMag * normalizedMag * (3 - 2 * normalizedMag);
  }

  // Apply custom sensitivity scalar (clamped to max 1.0 output)
  const finalMag = Math.min(1.0, curveMag * config.sensitivity);

  // Decompose back into normalized unit components
  const angle = Math.atan2(inY, inX);
  const outX = Math.cos(angle) * finalMag;
  const outY = Math.sin(angle) * finalMag;

  return {
    x: Math.round(outX * 1000) / 1000,
    y: Math.round(outY * 1000) / 1000,
  };
}

/**
 * Converts screen touch offset from joystick center to normalized raw values [-1.0, 1.0]
 */
export function touchOffsetToNormalized(
  deltaX: number,
  deltaY: number,
  maxRadius: number
): AnalogPoint {
  if (maxRadius <= 0) return { x: 0, y: 0 };

  const rawX = deltaX / maxRadius;
  // In screen coordinates Y goes down (+Y is down), in standard joystick +Y is UP
  const rawY = -deltaY / maxRadius;

  const distance = Math.hypot(rawX, rawY);
  if (distance > 1.0) {
    // Clamp to circle edge
    return {
      x: rawX / distance,
      y: rawY / distance,
    };
  }

  return { x: rawX, y: rawY };
}
