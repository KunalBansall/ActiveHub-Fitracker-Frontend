import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rewriteAll from 'vite-plugin-rewrite-all';

export default defineConfig({
  plugins: [react(), rewriteAll()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}); 