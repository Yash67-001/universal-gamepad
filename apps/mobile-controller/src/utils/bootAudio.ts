import { triggerHaptic } from './haptics';

/**
 * Synthesizes a high-tech console boot-up audio sequence and Taptic pulses
 * using Web Audio API (zero external asset files needed).
 */
export function playBootChime(isIOS = true): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 1. Deep Sub-Bass Rumble (Ignition)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, now);
    subOsc.frequency.exponentialRampToValueAtTime(110, now + 0.6);
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.1);

    // Trigger initial tactile rumble on iPhone Taptic engine
    triggerHaptic('medium', 0.8, isIOS);

    // 2. Ascending Cyber Arpeggio (System Online)
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
    notes.forEach((freq, idx) => {
      const noteTime = now + 0.15 + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });

    // 3. Final Power-Lock Chord (All Controls Engaged)
    const chordTime = now + 0.85;
    [880, 1108.73, 1318.51, 1760].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chordTime);
      gain.gain.setValueAtTime(0, chordTime);
      gain.gain.linearRampToValueAtTime(0.18, chordTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(chordTime);
      osc.stop(chordTime + 0.85);
    });

    // Secondary heavy haptic pulse on final ignition lock
    setTimeout(() => {
      triggerHaptic('heavy', 1.0, isIOS);
    }, 850);
  } catch {
    // Silently proceed if browser autoplay is constrained
  }
}
