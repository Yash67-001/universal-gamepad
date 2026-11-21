import { ControllerState, PacketType, INITIAL_CONTROLLER_STATE } from './types';

export const PROTOCOL_MAGIC_BYTE_1 = 0x55; // 'U'
export const PROTOCOL_MAGIC_BYTE_2 = 0x47; // 'G'
export const PROTOCOL_VERSION = 1;
export const BINARY_PACKET_SIZE = 20;

export enum ButtonBit {
  A = 1 << 0,
  B = 1 << 1,
  X = 1 << 2,
  Y = 1 << 3,
  DPAD_UP = 1 << 4,
  DPAD_DOWN = 1 << 5,
  DPAD_LEFT = 1 << 6,
  DPAD_RIGHT = 1 << 7,
  L1 = 1 << 8,
  R1 = 1 << 9,
  L3 = 1 << 10,
  R3 = 1 << 11,
  START = 1 << 12,
  SELECT = 1 << 13,
  HOME = 1 << 14,
  TURBO = 1 << 15,
}

/**
 * Encodes a normalized ControllerState into a 20-byte ArrayBuffer
 */
export function encodeControllerState(state: ControllerState, sequence: number): ArrayBuffer {
  const buffer = new ArrayBuffer(BINARY_PACKET_SIZE);
  const view = new DataView(buffer);

  // [0..1] Magic Header
  view.setUint8(0, PROTOCOL_MAGIC_BYTE_1);
  view.setUint8(1, PROTOCOL_MAGIC_BYTE_2);

  // [2] Packet Type
  view.setUint8(2, PacketType.INPUT_STATE);

  // [3] Sequence
  view.setUint8(3, sequence & 0xff);

  // [4..7] Timestamp (uint32 ms)
  view.setUint32(4, (state.timestamp || Date.now()) >>> 0, true);

  // [8..9] Button Bitmask (uint16)
  let buttonMask = 0;
  const b = state.buttons;
  if (b.a) buttonMask |= ButtonBit.A;
  if (b.b) buttonMask |= ButtonBit.B;
  if (b.x) buttonMask |= ButtonBit.X;
  if (b.y) buttonMask |= ButtonBit.Y;
  if (b.dpadUp) buttonMask |= ButtonBit.DPAD_UP;
  if (b.dpadDown) buttonMask |= ButtonBit.DPAD_DOWN;
  if (b.dpadLeft) buttonMask |= ButtonBit.DPAD_LEFT;
  if (b.dpadRight) buttonMask |= ButtonBit.DPAD_RIGHT;
  if (b.l1) buttonMask |= ButtonBit.L1;
  if (b.r1) buttonMask |= ButtonBit.R1;
  if (b.l3) buttonMask |= ButtonBit.L3;
  if (b.r3) buttonMask |= ButtonBit.R3;
  if (b.start) buttonMask |= ButtonBit.START;
  if (b.select) buttonMask |= ButtonBit.SELECT;
  if (b.home) buttonMask |= ButtonBit.HOME;
  if (b.turbo) buttonMask |= ButtonBit.TURBO;

  view.setUint16(8, buttonMask, true);

  // [10..11] Triggers (0-255)
  const l2Byte = Math.max(0, Math.min(255, Math.round(state.triggers.l2 * 255)));
  const r2Byte = Math.max(0, Math.min(255, Math.round(state.triggers.r2 * 255)));
  view.setUint8(10, l2Byte);
  view.setUint8(11, r2Byte);

  // [12..19] Axes (-32768 to 32767)
  const clampInt16 = (val: number) => Math.max(-32768, Math.min(32767, Math.round(val * 32767)));
  view.setInt16(12, clampInt16(state.axes.leftX), true);
  view.setInt16(14, clampInt16(state.axes.leftY), true);
  view.setInt16(16, clampInt16(state.axes.rightX), true);
  view.setInt16(18, clampInt16(state.axes.rightY), true);

  return buffer;
}

/**
 * Decodes a 20-byte ArrayBuffer or Node Buffer into a normalized ControllerState
 */
export function decodeControllerState(buffer: ArrayBuffer | ArrayBufferView): { state: ControllerState; sequence: number } | null {
  let view: DataView;
  if (buffer instanceof DataView) {
    view = buffer;
  } else if (buffer instanceof ArrayBuffer) {
    view = new DataView(buffer);
  } else if (ArrayBuffer.isView(buffer)) {
    view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else {
    return null;
  }

  if (view.byteLength < BINARY_PACKET_SIZE) {
    return null;
  }

  // Check Magic
  if (view.getUint8(0) !== PROTOCOL_MAGIC_BYTE_1 || view.getUint8(1) !== PROTOCOL_MAGIC_BYTE_2) {
    return null;
  }

  const packetType = view.getUint8(2);
  if (packetType !== PacketType.INPUT_STATE) {
    return null;
  }

  const sequence = view.getUint8(3);
  const timestamp = view.getUint32(4, true);
  const buttonMask = view.getUint16(8, true);

  const l2 = view.getUint8(10) / 255.0;
  const r2 = view.getUint8(11) / 255.0;

  const leftX = view.getInt16(12, true) / 32767.0;
  const leftY = view.getInt16(14, true) / 32767.0;
  const rightX = view.getInt16(16, true) / 32767.0;
  const rightY = view.getInt16(18, true) / 32767.0;

  const state: ControllerState = {
    buttons: {
      a: (buttonMask & ButtonBit.A) !== 0,
      b: (buttonMask & ButtonBit.B) !== 0,
      x: (buttonMask & ButtonBit.X) !== 0,
      y: (buttonMask & ButtonBit.Y) !== 0,
      dpadUp: (buttonMask & ButtonBit.DPAD_UP) !== 0,
      dpadDown: (buttonMask & ButtonBit.DPAD_DOWN) !== 0,
      dpadLeft: (buttonMask & ButtonBit.DPAD_LEFT) !== 0,
      dpadRight: (buttonMask & ButtonBit.DPAD_RIGHT) !== 0,
      l1: (buttonMask & ButtonBit.L1) !== 0,
      r1: (buttonMask & ButtonBit.R1) !== 0,
      l3: (buttonMask & ButtonBit.L3) !== 0,
      r3: (buttonMask & ButtonBit.R3) !== 0,
      start: (buttonMask & ButtonBit.START) !== 0,
      select: (buttonMask & ButtonBit.SELECT) !== 0,
      home: (buttonMask & ButtonBit.HOME) !== 0,
      turbo: (buttonMask & ButtonBit.TURBO) !== 0,
    },
    axes: {
      leftX: Math.max(-1.0, Math.min(1.0, leftX)),
      leftY: Math.max(-1.0, Math.min(1.0, leftY)),
      rightX: Math.max(-1.0, Math.min(1.0, rightX)),
      rightY: Math.max(-1.0, Math.min(1.0, rightY)),
    },
    triggers: {
      l2: Math.max(0, Math.min(1.0, l2)),
      r2: Math.max(0, Math.min(1.0, r2)),
    },
    timestamp,
    sequence,
  };

  return { state, sequence };
}

/**
 * Calculates accurate RTT difference between current time and a uint32 timestamp
 */
export function calculateRttMs(origTimestampUint32: number): number {
  const nowUint32 = Date.now() >>> 0;
  const diff = nowUint32 >= origTimestampUint32
    ? nowUint32 - origTimestampUint32
    : 0xffffffff - origTimestampUint32 + nowUint32;
  return Math.max(0.5, Math.min(5000, diff));
}

/**
 * Encodes a Ping packet (8 bytes)
 */
export function encodePingPacket(timestamp?: number): ArrayBuffer {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint8(0, PROTOCOL_MAGIC_BYTE_1);
  view.setUint8(1, PROTOCOL_MAGIC_BYTE_2);
  view.setUint8(2, PacketType.PING);
  view.setUint8(3, 0); // reserved
  const ts = (timestamp || Date.now()) >>> 0;
  view.setUint32(4, ts, true);
  return buffer;
}

/**
 * Encodes a Pong packet (8 bytes)
 */
export function encodePongPacket(origTimestamp: number): ArrayBuffer {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint8(0, PROTOCOL_MAGIC_BYTE_1);
  view.setUint8(1, PROTOCOL_MAGIC_BYTE_2);
  view.setUint8(2, PacketType.PONG);
  view.setUint8(3, 0); // reserved
  view.setUint32(4, origTimestamp >>> 0, true);
  return buffer;
}
