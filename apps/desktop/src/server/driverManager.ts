import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';

export interface DriverStatusReport {
  platform: 'win32' | 'darwin' | 'linux';
  mode: 'mode_a_virtual_gamepad' | 'mode_b_input_synthesis';
  isDriverInstalled: boolean;
  driverName: string;
  driverVersion?: string;
  permissionGranted: boolean;
  statusMessage: string;
}

export class DriverManager {
  public static checkDriverStatus(): DriverStatusReport {
    const platform = os.platform() as 'win32' | 'darwin' | 'linux';

    if (platform === 'win32') {
      // Check for ViGEmBus
      let isViGEmInstalled = false;
      try {
        const out = execSync('sc query ViGEmBus', { stdio: 'pipe' }).toString();
        isViGEmInstalled = out.includes('RUNNING') || out.includes('STATE');
      } catch {
        // Alternative check file system
        const driverPath = 'C:\\Windows\\System32\\drivers\\ViGEmBus.sys';
        isViGEmInstalled = fs.existsSync(driverPath);
      }

      if (isViGEmInstalled) {
        return {
          platform: 'win32',
          mode: 'mode_a_virtual_gamepad',
          isDriverInstalled: true,
          driverName: 'Nefarius ViGEmBus (Virtual Gamepad Emulation Bus)',
          permissionGranted: true,
          statusMessage: 'ViGEmBus active. True Xbox 360 virtual gamepad available.',
        };
      } else {
        return {
          platform: 'win32',
          mode: 'mode_b_input_synthesis',
          isDriverInstalled: false,
          driverName: 'ViGEmBus Not Detected',
          permissionGranted: true,
          statusMessage: 'Running in Mode B (Input Synthesis). Install ViGEmBus for Mode A.',
        };
      }
    }

    if (platform === 'darwin') {
      // On macOS, Mode B is the sanctioned path without custom Apple-entitled DriverKit DEXT
      return {
        platform: 'darwin',
        mode: 'mode_b_input_synthesis',
        isDriverInstalled: true,
        driverName: 'macOS Accessibility & Input Synthesizer',
        permissionGranted: true,
        statusMessage: 'Mode B active. Input synthesized via macOS WindowServer.',
      };
    }

    return {
      platform: 'linux',
      mode: 'mode_b_input_synthesis',
      isDriverInstalled: true,
      driverName: 'Linux uinput / X11 Synthesizer',
      permissionGranted: true,
      statusMessage: 'Mode B active.',
    };
  }
}
