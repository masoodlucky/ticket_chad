import { defineConfig } from 'vite';
import { resolve } from 'path';
import environment from 'vite-plugin-environment';

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  plugins: [
    environment('all', { prefix: 'CANISTER_' }),
    environment('all', { prefix: 'DFX_' }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4943',
        changeOrigin: true,
      },
    },
  },
});
