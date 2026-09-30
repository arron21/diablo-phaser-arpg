import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@scenes': path.resolve(__dirname, './src/scenes'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@ui': path.resolve(__dirname, './src/ui')
    }
  },
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: 'esnext',
    sourcemap: true
  }
});
