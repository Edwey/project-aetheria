import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'packages/core/src'),
      '@sim': path.resolve(__dirname, 'packages/sim/src'),
      '@render': path.resolve(__dirname, 'packages/render/src'),
      '@ui': path.resolve(__dirname, 'packages/ui/src'),
      '@assets': path.resolve(__dirname, 'packages/assets/src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'rapier': ['@dimforge/rapier3d'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
