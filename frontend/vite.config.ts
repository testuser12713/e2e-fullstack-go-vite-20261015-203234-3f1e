/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    // Tests assert relative /api/... paths; keep an ambient VITE_API_BASE_URL
    // (e.g. exported from RUN.json for the running app) out of the test run.
    env: { VITE_API_BASE_URL: '' },
  },
});
