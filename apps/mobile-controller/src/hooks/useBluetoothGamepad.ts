import { useState, useRef, useCallback } from 'react';
import {
  ControllerState,
  encodeControllerState,
  BLE_GAMEPAD_SERVICE_UUID,
  BLE_GAMEPAD_STATE_CHAR_UUID,
} from '@universal-gamepad/shared-protocol';

export interface UseBluetoothGamepadResult {
  isSupported: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  errorMessage: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  sendInputState: (state: ControllerState) => void;
}

export function useBluetoothGamepad(): UseBluetoothGamepadResult {
  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deviceRef = useRef<any>(null);
  const serverRef = useRef<any>(null);
  const stateCharRef = useRef<any>(null);
  const seqRef = useRef(0);

  const disconnect = useCallback(() => {
    if (serverRef.current && serverRef.current.connected) {
      serverRef.current.disconnect();
    }
    deviceRef.current = null;
    serverRef.current = null;
    stateCharRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    setDeviceName(null);
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setErrorMessage(
        'Web Bluetooth is not supported in this browser. On iOS Safari, please use Bluetooth PAN or USB Mode.'
      );
      return false;
    }

    setIsConnecting(true);
    setErrorMessage(null);

    try {
      // Prompt user to select Bluetooth Gamepad receiver
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: [BLE_GAMEPAD_SERVICE_UUID] }],
        optionalServices: [BLE_GAMEPAD_SERVICE_UUID],
      });

      deviceRef.current = device;
      setDeviceName(device.name || 'Universal Gamepad Host');

      device.addEventListener('gattserverdisconnected', () => {
        disconnect();
      });

      // Connect to GATT Server
      const server = await device.gatt.connect();
      serverRef.current = server;

      // Get Gamepad Service
      const service = await server.getPrimaryService(BLE_GAMEPAD_SERVICE_UUID);

      // Get Controller State Characteristic
      const stateChar = await service.getCharacteristic(BLE_GAMEPAD_STATE_CHAR_UUID);
      stateCharRef.current = stateChar;

      setIsConnected(true);
      setIsConnecting(false);
      return true;
    } catch (err: any) {
      console.warn('Web Bluetooth connection failed or cancelled:', err);
      setIsConnecting(false);
      if (err.name !== 'NotFoundError') {
        setErrorMessage(err.message || 'Bluetooth connection failed');
      }
      return false;
    }
  }, [isSupported, disconnect]);

  const sendInputState = useCallback((state: ControllerState) => {
    if (!stateCharRef.current || !isConnected) return;

    seqRef.current = (seqRef.current + 1) & 0xff;
    const buffer = encodeControllerState(state, seqRef.current);

    try {
      if (typeof stateCharRef.current.writeValueWithoutResponse === 'function') {
        stateCharRef.current.writeValueWithoutResponse(buffer);
      } else {
        stateCharRef.current.writeValue(buffer);
      }
    } catch (err) {
      console.warn('Failed to transmit BLE packet:', err);
    }
  }, [isConnected]);

  return {
    isSupported,
    isConnected,
    isConnecting,
    deviceName,
    errorMessage,
    connect,
    disconnect,
    sendInputState,
  };
}
