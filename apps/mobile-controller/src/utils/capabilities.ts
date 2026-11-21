import { DeviceCapabilities } from '@universal-gamepad/shared-protocol';

/**
 * Detects real hardware and browser capabilities without relying exclusively on UA strings
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const ua = navigator.userAgent || '';
  
  // OS Detection
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const os: 'ios' | 'android' | 'other' = isIOS ? 'ios' : isAndroid ? 'android' : 'other';

  // Browser detection
  let browser = 'Unknown Browser';
  if (/CriOS|Chrome/.test(ua)) browser = 'Chrome';
  else if (/FxiOS|Firefox/.test(ua)) browser = 'Firefox';
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Edg/.test(ua)) browser = 'Edge';
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';

  // Feature detection
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  const supportsVibration = typeof navigator.vibrate === 'function';
  const supportsWakeLock = 'wakeLock' in navigator;
  const supportsFullscreen = !!(
    document.fullscreenEnabled ||
    (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled
  );
  const supportsOrientationLock = 'orientation' in screen && 'lock' in (screen.orientation || {});

  return {
    browser,
    os,
    isPWA,
    supportsVibration,
    supportsWakeLock,
    supportsFullscreen,
    supportsOrientationLock,
    screenDimensions: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
  };
}
