import zlib
import struct
import math
import os
import subprocess

def create_png(width, height, get_pixel_func, output_path):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend((r, g, b, a))

    # Compress raw data with zlib
    compressed = zlib.compress(bytes(raw_data), 9)

    # Build PNG chunks
    png = bytearray(b'\x89PNG\r\n\x1a\n')

    def make_chunk(chunk_type, data):
        length = len(data)
        crc = zlib.crc32(chunk_type + data) & 0xffffffff
        return struct.pack('>I', length) + chunk_type + data + struct.pack('>I', crc)

    # IHDR
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(make_chunk(b'IHDR', ihdr))

    # IDAT
    png.extend(make_chunk(b'IDAT', compressed))

    # IEND
    png.extend(make_chunk(b'IEND', b''))

    with open(output_path, 'wb') as f:
        f.write(png)

def clamp(val, min_v=0, max_v=255):
    return max(min_v, min(max_v, int(val)))

def generate_gamepad_pixel(x, y, w, h):
    # Normalized coordinates [-1, 1]
    nx = (x - w / 2) / (w / 2)
    ny = (y - h / 2) / (h / 2)

    # Distance for squircle app icon boundary (radius ~ 0.88, exponent 4)
    squircle = math.pow(abs(nx), 3.8) + math.pow(abs(ny), 3.8)
    if squircle > 0.82:
        return (0, 0, 0, 0) # transparent outside squircle

    # Border glow
    if squircle > 0.76:
        glow_t = (squircle - 0.76) / (0.82 - 0.76)
        r = clamp(0 * (1 - glow_t) + 0)
        g = clamp(240 * (1 - glow_t))
        b = clamp(255 * (1 - glow_t))
        return (r, g, b, 255)

    # Background gradient
    bg_grad = (ny + 1) / 2
    r_bg = clamp(11 + bg_grad * 15)
    g_bg = clamp(14 + bg_grad * 18)
    b_bg = clamp(20 + bg_grad * 28)

    # Gamepad body shape: ellipse and grips
    # Center body: circle at (0, -0.05) radius 0.42
    # Left grip: circle at (-0.42, 0.22) radius 0.28
    # Right grip: circle at (0.42, 0.22) radius 0.28
    dist_center = math.hypot(nx, ny + 0.05) / 0.44
    dist_left_grip = math.hypot(nx + 0.40, ny - 0.18) / 0.32
    dist_right_grip = math.hypot(nx - 0.40, ny - 0.18) / 0.32

    in_gamepad = (dist_center < 1.0) or (dist_left_grip < 1.0) or (dist_right_grip < 1.0) or (abs(nx) < 0.48 and abs(ny + 0.02) < 0.28)

    if not in_gamepad:
        return (r_bg, g_bg, b_bg, 255)

    # Gamepad surface gradient
    gp_grad = (ny + 0.5) / 1.0
    r_gp = clamp(24 + gp_grad * 12)
    g_gp = clamp(30 + gp_grad * 15)
    b_gp = clamp(44 + gp_grad * 20)

    # D-Pad on Left: centered at (-0.32, -0.02)
    dpad_x = nx + 0.32
    dpad_y = ny + 0.02
    in_dpad_v = (abs(dpad_x) < 0.04 and abs(dpad_y) < 0.12)
    in_dpad_h = (abs(dpad_x) < 0.12 and abs(dpad_y) < 0.04)
    if in_dpad_v or in_dpad_h:
        return (0, 240, 255, 255)

    # Left Stick: centered at (-0.18, 0.18)
    ls_dist = math.hypot(nx + 0.18, ny - 0.18)
    if ls_dist < 0.08:
        if ls_dist < 0.035:
            return (0, 240, 255, 255)
        return (40, 50, 70, 255)
    elif ls_dist < 0.095:
        return (0, 240, 255, 255) # Outer ring

    # Right Stick: centered at (0.18, 0.18)
    rs_dist = math.hypot(nx - 0.18, ny - 0.18)
    if rs_dist < 0.08:
        if rs_dist < 0.035:
            return (0, 240, 255, 255)
        return (40, 50, 70, 255)
    elif rs_dist < 0.095:
        return (0, 240, 255, 255) # Outer ring

    # ABXY Face Buttons on Right: centered at (0.32, -0.02)
    btn_x = nx - 0.32
    btn_y = ny + 0.02
    # Y - Top (0, -0.08)
    if math.hypot(btn_x, btn_y + 0.08) < 0.035:
        return (251, 191, 36, 255) # Amber
    # A - Bottom (0, 0.08)
    if math.hypot(btn_x, btn_y - 0.08) < 0.035:
        return (52, 211, 153, 255) # Green
    # X - Left (-0.08, 0)
    if math.hypot(btn_x + 0.08, btn_y) < 0.035:
        return (56, 189, 248, 255) # Blue
    # B - Right (0.08, 0)
    if math.hypot(btn_x - 0.08, btn_y) < 0.035:
        return (251, 113, 133, 255) # Red

    # Center Guide button: (0, -0.05)
    if math.hypot(nx, ny + 0.05) < 0.045:
        return (0, 240, 255, 255)

    return (r_gp, g_gp, b_gp, 255)

def main():
    os.makedirs('build/iconset.iconset', exist_ok=True)
    base_png = 'build/icon_1024.png'
    print('Generating high-resolution 1024x1024 Gamepad icon...')
    create_png(1024, 1024, generate_gamepad_pixel, base_png)
    print('Base PNG generated successfully.')

    # Resize into Apple iconset standards using sips
    sizes = [
        ('icon_16x16.png', 16),
        ('icon_16x16@2x.png', 32),
        ('icon_32x32.png', 32),
        ('icon_32x32@2x.png', 64),
        ('icon_128x128.png', 128),
        ('icon_128x128@2x.png', 256),
        ('icon_256x256.png', 256),
        ('icon_256x256@2x.png', 512),
        ('icon_512x512.png', 512),
        ('icon_512x512@2x.png', 1024),
    ]

    for fname, size in sizes:
        dst = os.path.join('build/iconset.iconset', fname)
        subprocess.run(['sips', '-z', str(size), str(size), base_png, '--out', dst], check=True, stdout=subprocess.DEVNULL)

    print('Converting iconset to AppIcon.icns with iconutil...')
    subprocess.run(['iconutil', '-c', 'icns', 'build/iconset.iconset', '-o', 'build/AppIcon.icns'], check=True)
    print('AppIcon.icns generated successfully!')

if __name__ == '__main__':
    main()
