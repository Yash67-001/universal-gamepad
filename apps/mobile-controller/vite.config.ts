import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@universal-gamepad/shared-protocol': path.resolve(__dirname, '../../packages/shared-protocol/src'),
      '@universal-gamepad/controller-core': path.resolve(__dirname, '../../packages/controller-core/src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
