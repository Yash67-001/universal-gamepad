import { Haptics, ImpactStyle } from '@capacitor/haptics';

let audioCtx: AudioContext | null = null;

/**
 * Initializes and unlocks Web Audio on user interaction (required by iOS Safari)
 */
export function unlockHapticAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch {}
}

export type HapticStrength = 'light' | 'medium' | 'heavy' | 'selection' | number;

/**
 * Universal Haptics Engine:
 * 1. Native Capacitor Haptics (Physical iPhone Taptic Engine & Native Android vibration)
 * 2. Hardware vibration API (Android browsers: Chrome, Edge, Samsung Internet)
 * 3. High-energy acoustic-tactile impulse (iOS Safari browser tactile illusion)
 */
export function triggerHaptic(
  strength: HapticStrength = 'medium',
  intensity = 1.0,
  isIOS = false
): void {
  // Map strength to Capacitor ImpactStyle & duration
  let impactStyle = ImpactStyle.Medium;
  let durationMs = 25;

  if (strength === 'light' || (typeof strength === 'number' && strength <= 15)) {
    impactStyle = ImpactStyle.Light;
    durationMs = 15;
  } else if (strength === 'heavy' || (typeof strength === 'number' && strength >= 30)) {
    impactStyle = ImpactStyle.Heavy;
    durationMs = 40;
  } else if (strength === 'selection') {
    impactStyle = ImpactStyle.Light;
    durationMs = 8;
  } else if (typeof strength === 'number') {
    durationMs = strength;
  }

  // 1. Physical iPhone Taptic Engine (Capacitor Native iOS App)
  try {
    Haptics.impact({ style: impactStyle }).catch(() => {});
  } catch {}

  // 2. Hardware vibration via navigator.vibrate (Android browsers)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(durationMs);
    } catch {}
  }

  // 3. High-Energy Acoustic-Tactile Impulse for iOS Mobile Safari
  // Produces a sharp mechanical transient pulse through iPhone stereo speakers
  // that vibrates the device chassis and fingertips like a physical switch
  try {
    unlockHapticAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const t = audioCtx.currentTime;

    if (strength === 'selection') {
      // Micro-tick for trackpad glide / dial rotation
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.008);

      gain.gain.setValueAtTime(0.3 * intensity, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.008);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.01);
      return;
    }

    // Dual-stage tactile snap for buttons, clicks and taps:
    // Stage 1: Sharp high-frequency transient spike (the "snap")
    const clickOsc = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    const snapFreq = strength === 'heavy' ? 2400 : strength === 'light' ? 1200 : 1800;

    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(snapFreq, t);
    clickOsc.frequency.exponentialRampToValueAtTime(300, t + 0.006);

    clickGain.gain.setValueAtTime(0.85 * intensity, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.006);

    clickOsc.connect(clickGain);
    clickGain.connect(audioCtx.destination);
    clickOsc.start(t);
    clickOsc.stop(t + 0.008);

    // Stage 2: Resonant low-frequency mechanical thud (vibrates iPhone chassis)
    const thudOsc = audioCtx.createOscillator();
    const thudGain = audioCtx.createGain();
    const duration = strength === 'heavy' ? 0.035 : strength === 'light' ? 0.018 : 0.024;
    const baseFreq = strength === 'heavy' ? 260 : strength === 'light' ? 180 : 210;

    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(baseFreq, t);
    thudOsc.frequency.exponentialRampToValueAtTime(65, t + duration);

    thudGain.gain.setValueAtTime(0.9 * intensity, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    thudOsc.connect(thudGain);
    thudGain.connect(audioCtx.destination);
    thudOsc.start(t);
    thudOsc.stop(t + duration + 0.005);
  } catch {}
}
