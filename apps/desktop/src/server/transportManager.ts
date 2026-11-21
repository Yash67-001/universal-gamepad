import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { getAvailableNetworkInterfaces } from './network';
import {
  BLE_GAMEPAD_SERVICE_UUID,
  BLE_GAMEPAD_STATE_CHAR_UUID,
  BLE_GAMEPAD_CONTROL_CHAR_UUID,
  TransportStateReport,
} from '@universal-gamepad/shared-protocol';

export type { TransportStateReport };

const execAsync = promisify(exec);

export class TransportManager {
  private adbPath = '/Users/yashmalik0814gmail.com/Library/Android/sdk/platform-tools/adb';

  constructor() {
    // If adb is in default PATH, resolve it
    if (!fs.existsSync(this.adbPath)) {
      this.adbPath = 'adb';
    }
  }

  /**
   * Scans and returns live status for Wi-Fi, USB, and Bluetooth transport links
   */
  public async getTransportsStatus(): Promise<TransportStateReport> {
    const interfaces = getAvailableNetworkInterfaces();

    // 1. Wi-Fi
    const wifiIface = interfaces.find((i) => i.type === 'wifi') || interfaces[0];

    // 2. USB Wired Link
    const usbIface = interfaces.find((i) => i.type === 'usb');
    let isUsbCableConnected = false;
    let deviceType: 'ios' | 'android' | 'unknown' | 'none' = 'none';
    let deviceName = '';
    let adbForwarded = false;

    // Check iOS USB device via devicectl
    try {
      const { stdout } = await execAsync('xcrun devicectl list devices 2>/dev/null || true');
      if (stdout.includes('iPhone')) {
        isUsbCableConnected = true;
        deviceType = 'ios';
        deviceName = 'Apple iPhone (USB Connected)';
      }
    } catch {
      // Ignore
    }

    // Check Android USB device via adb
    try {
      const { stdout } = await execAsync(`${this.adbPath} devices 2>/dev/null || true`);
      const lines = stdout.split('\n').filter((l) => l.includes('\tdevice'));
      if (lines.length > 0) {
        isUsbCableConnected = true;
        deviceType = 'android';
        deviceName = `Android Device (${lines[0].split('\t')[0]})`;
      }
    } catch {
      // Ignore
    }

    if (usbIface) {
      isUsbCableConnected = true;
      if (deviceType === 'none') {
        deviceType = usbIface.address.startsWith('172.20.10.') ? 'ios' : 'android';
        deviceName = deviceType === 'ios' ? 'iPhone USB Hotspot' : 'Android USB Tether';
      }
    }

    // 3. Bluetooth status
    let isBluetoothSupported = true;
    let isBluetoothEnabled = false;
    const btIface = interfaces.find((i) => i.type === 'bluetooth');

    try {
      const { stdout } = await execAsync('system_profiler SPBluetoothDataType 2>/dev/null || true');
      if (stdout.includes('State: On')) {
        isBluetoothEnabled = true;
      }
    } catch {
      // Ignore
    }

    return {
      wifi: {
        isAvailable: !!wifiIface,
        ip: wifiIface?.address || '127.0.0.1',
        label: wifiIface?.label || 'Wi-Fi Wireless',
      },
      usb: {
        isSupported: true,
        isCableConnected: isUsbCableConnected,
        deviceType,
        deviceName: deviceName || (isUsbCableConnected ? 'Connected via USB Cable' : 'No USB Device Detected'),
        usbIp: usbIface ? usbIface.address : null,
        adbForwarded,
        instructions: [
          'For iPhone: Plug in USB cable. Under iPhone Settings > Personal Hotspot > Turn ON (USB only). Connects with < 0.3ms latency!',
          'For Android: Plug in USB cable. Under Settings > Network > USB Tethering > Turn ON (or enable USB Debugging).',
        ],
      },
      bluetooth: {
        isSupported: isBluetoothSupported,
        isEnabled: isBluetoothEnabled,
        hasPanInterface: !!btIface,
        bleServiceUuid: BLE_GAMEPAD_SERVICE_UUID,
        bleStateCharUuid: BLE_GAMEPAD_STATE_CHAR_UUID,
        bleControlCharUuid: BLE_GAMEPAD_CONTROL_CHAR_UUID,
        instructions: [
          'Direct Bluetooth PAN: Pair phone with computer in Bluetooth Settings > Enable Bluetooth Tethering on phone. Connects without any Wi-Fi!',
          'Web Bluetooth Low Energy (BLE): In Chrome, tap "Pair via Bluetooth" to connect directly via Bluetooth GATT.',
        ],
      },
    };
  }

  /**
   * Automates Android USB reverse port forwarding (adb reverse tcp:8080 tcp:8080)
   */
  public async setupAndroidUsbReverse(port = 8080): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`${this.adbPath} reverse tcp:${port} tcp:${port}`);
      return {
        success: true,
        message: `Android USB link established! http://localhost:${port} is now mapped directly through the USB cable.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Could not run adb reverse: ${msg}`,
      };
    }
  }
}
