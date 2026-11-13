import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: { jsx: 'automatic' },
  // Let the dev server read src/shared, which lives outside this folder
  server: { fs: { allow: ['..'] } },
});

