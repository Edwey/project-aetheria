import { defineConfig } from 'vitest/config';
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
  test: {
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts', 'app/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
