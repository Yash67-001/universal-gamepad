/**
 * Universal Gamepad - Normalized Input Types
 */

export interface ControllerButtons {
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  l1: boolean; // Left Bumper
  r1: boolean; // Right Bumper
  l3: boolean; // Left Stick Click
  r3: boolean; // Right Stick Click
  start: boolean;
  select: boolean;
  home: boolean;
  turbo: boolean;
}

export interface ControllerAxes {
  leftX: number;  // -1.0 to 1.0 (left negative, right positive)
  leftY: number;  // -1.0 to 1.0 (down negative, up positive)
  rightX: number; // -1.0 to 1.0
  rightY: number; // -1.0 to 1.0
}

export interface ControllerTriggers {
  l2: number; // 0.0 to 1.0
  r2: number; // 0.0 to 1.0
}

export interface ControllerState {
  buttons: ControllerButtons;
  axes: ControllerAxes;
  triggers: ControllerTriggers;
  timestamp: number;
  sequence: number;
}

export const INITIAL_CONTROLLER_STATE: ControllerState = {
  buttons: {
    a: false,
    b: false,
    x: false,
    y: false,
    dpadUp: false,
    dpadDown: false,
    dpadLeft: false,
    dpadRight: false,
    l1: false,
    r1: false,
    l3: false,
    r3: false,
    start: false,
    select: false,
    home: false,
    turbo: false,
  },
  axes: {
    leftX: 0,
    leftY: 0,
    rightX: 0,
    rightY: 0,
  },
  triggers: {
    l2: 0,
    r2: 0,
  },
  timestamp: 0,
  sequence: 0,
};

export enum PacketType {
  INPUT_STATE = 0x01,
  PING = 0x02,
  PONG = 0x03,
  HAPTIC = 0x04,
  HANDSHAKE_REQUEST = 0x05,
  HANDSHAKE_RESPONSE = 0x06,
  DISCONNECT = 0x07,
}

export interface DeviceCapabilities {
  browser: string;
  os: 'ios' | 'android' | 'other';
  deviceModel?: string;
  isPWA: boolean;
  supportsVibration: boolean;
  supportsWakeLock: boolean;
  supportsFullscreen: boolean;
  supportsOrientationLock: boolean;
  screenDimensions: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  hasTouch: boolean;
  maxTouchPoints: number;
}

export interface HandshakeRequestPayload {
  type: 'handshake_request';
  protocolVersion: number;
  sessionId: string;
  token?: string;
  pin?: string;
  deviceCapabilities: DeviceCapabilities;
  clientTime: number;
}

export interface HandshakeResponsePayload {
  type: 'handshake_response';
  success: boolean;
  assignedSlot: number; // Player 1, Player 2
  profile: ControllerProfileType;
  error?: string;
  serverTime: number;
  heartbeatIntervalMs: number;
}

export type ConnectionStatus =
  | 'initializing'
  | 'waiting'
  | 'pairing'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'driver_unavailable'
  | 'permission_required'
  | 'unsupported_configuration';

export type ControllerProfileType =
  | 'xbox'
  | 'playstation'
  | 'nintendo'
  | 'racing'
  | 'arcade'
  | 'kbm'
  | 'generic'
  | 'custom';

export type SensitivityLevel = 'low' | 'normal' | 'high' | 'custom';

export interface JoystickConfig {
  deadzone: number; // 0.0 to 0.4 (default 0.10)
  sensitivity: number; // 0.5 to 2.0 (default 1.0)
  curve: 'linear' | 'exponential' | 's-curve';
  invertX: boolean;
  invertY: boolean;
}

export interface ControllerProfile {
  id: string;
  name: string;
  type: ControllerProfileType;
  leftStick: JoystickConfig;
  rightStick: JoystickConfig;
  triggerDeadzone: number;
  hapticEnabled: boolean;
  hapticIntensity: number; // 0.0 to 1.0
  buttonMappings?: Record<string, string>; // for KBM mode
}

export interface LatencyReport {
  rttMs: number;
  jitterMs: number;
  packetsSent: number;
  packetsReceived: number;
  packetLossPercent: number;
  lastUpdated: number;
}

export interface DriverStatusReport {
  platform: 'win32' | 'darwin' | 'linux';
  mode: 'mode_a_virtual_gamepad' | 'mode_b_input_synthesis';
  isDriverInstalled: boolean;
  driverName: string;
  driverVersion?: string;
  permissionGranted: boolean;
  statusMessage: string;
}

export type TransportChannel = 'wifi' | 'usb' | 'bluetooth_ble' | 'bluetooth_pan';

export interface TransportStatusReport {
  channel: TransportChannel;
  title: string;
  isAvailable: boolean;
  isConnected: boolean;
  details: string;
  latencyRating: string;
}

export interface TransportStateReport {
  wifi: {
    isAvailable: boolean;
    ip: string;
    label: string;
  };
  usb: {
    isSupported: boolean;
    isCableConnected: boolean;
    deviceType: 'ios' | 'android' | 'unknown' | 'none';
    deviceName: string;
    usbIp: string | null;
    adbForwarded: boolean;
    instructions: string[];
  };
  bluetooth: {
    isSupported: boolean;
    isEnabled: boolean;
    hasPanInterface: boolean;
    bleServiceUuid: string;
    bleStateCharUuid: string;
    bleControlCharUuid: string;
    instructions: string[];
  };
}

// Low-Latency Bluetooth GATT Service & Characteristic UUIDs
export const BLE_GAMEPAD_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const BLE_GAMEPAD_STATE_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
export const BLE_GAMEPAD_CONTROL_CHAR_UUID = '0000ffe2-0000-1000-8000-00805f9b34fb';
