import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'web',
  publicDir: false,
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, 'web'),
    },
    extensions: ['.js', '.jsx', '.json'],
  },
  define: {
    'process.env.BASEMAP_URL': JSON.stringify(
      process.env.BASEMAP_URL || 'https://rkhe4.n.roteskreuz.at/basemap'
    ),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.TEST': JSON.stringify(process.env.TEST || false),
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(import.meta.dirname, 'public'),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3030',
        ws: true,
      },
      '/export.xlsx': 'http://localhost:3030',
      '/export.tar': 'http://localhost:3030',
      '/import.tar': 'http://localhost:3030',
      '/transports.xlsx': 'http://localhost:3030',
    },
  },
});
