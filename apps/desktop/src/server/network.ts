import os from 'os';

export interface NetworkInterfaceInfo {
  name: string;
  address: string;
  family: 'IPv4' | 'IPv6';
  isDefault: boolean;
  type: 'wifi' | 'ethernet' | 'usb' | 'bluetooth' | 'hotspot' | 'other';
  label: string;
}

/**
 * Discovers active non-internal IPv4 interfaces across Wi-Fi, USB, and Bluetooth
 */
export function getAvailableNetworkInterfaces(): NetworkInterfaceInfo[] {
  const interfaces = os.networkInterfaces();
  const results: NetworkInterfaceInfo[] = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;

    const lowerName = name.toLowerCase();

    // Filter out virtual/docker/vm internal bridges (except hotspot/usb)
    if (
      lowerName.includes('docker') ||
      lowerName.includes('veth') ||
      lowerName.includes('br-') ||
      lowerName.includes('vmnet') ||
      lowerName.includes('utun') ||
      lowerName.includes('llw0') ||
      lowerName.includes('awdl0')
    ) {
      continue;
    }

    for (const net of netList) {
      // Look for non-internal IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        let type: 'wifi' | 'ethernet' | 'usb' | 'bluetooth' | 'hotspot' | 'other' = 'other';
        let label = 'Local Area Network';

        // 1. USB Tethering / USB Ethernet detection
        if (
          lowerName.includes('usb') ||
          lowerName.includes('rndis') ||
          net.address.startsWith('172.20.10.') || // Apple iOS USB Personal Hotspot
          net.address.startsWith('192.168.42.') || // Android USB Tethering
          net.address.startsWith('169.254.')     // USB Link-Local Direct Ethernet
        ) {
          type = 'usb';
          label = '⚡ USB Wired Link';
        }
        // 2. Bluetooth Personal Area Network (PAN)
        else if (
          lowerName.includes('bnep') ||
          lowerName.includes('bt') ||
          lowerName.includes('bluetooth')
        ) {
          type = 'bluetooth';
          label = '🔵 Bluetooth PAN Link';
        }
        // 3. Wi-Fi
        else if (
          lowerName.includes('wi-fi') ||
          lowerName.includes('wlan') ||
          lowerName === 'en0'
        ) {
          type = 'wifi';
          label = '📶 Wi-Fi Wireless';
        }
        // 4. Physical Ethernet
        else if (
          lowerName.includes('eth') ||
          lowerName.includes('en1') ||
          lowerName.includes('lan')
        ) {
          type = 'ethernet';
          label = '🔌 Wired Ethernet';
        }
        // 5. Software Hotspot / Bridge
        else if (lowerName.includes('bridge') || lowerName.includes('ap')) {
          type = 'hotspot';
          label = '📡 Computer Hotspot';
        }

        results.push({
          name,
          address: net.address,
          family: 'IPv4',
          isDefault: results.length === 0,
          type,
          label,
        });
      }
    }
  }

  // Fallback to localhost if no active interface found
  if (results.length === 0) {
    results.push({
      name: 'Loopback',
      address: '127.0.0.1',
      family: 'IPv4',
      isDefault: true,
      type: 'other',
      label: 'Localhost (Self)',
    });
  }

  return results;
}
