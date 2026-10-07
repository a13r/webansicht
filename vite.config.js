import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Matches modules inside the given top-level node_modules packages
const vendor = (...pkgs) =>
  new RegExp(`[\\\\/]node_modules[\\\\/](${pkgs.map((p) => p.replace('/', '[\\\\/]')).join('|')})[\\\\/]`);

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
      process.env.BASEMAP_URL || '/basemap'
    ),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.TEST': JSON.stringify(process.env.TEST || false),
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(import.meta.dirname, 'public'),
    emptyOutDir: true,
    sourcemap: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-ol', test: vendor('ol') },
            { name: 'vendor-react', test: vendor('react', 'react-dom', 'react-router', 'react-router-dom') },
            { name: 'vendor-ui', test: vendor('react-bootstrap', 'bootstrap', 'react-toastify') },
            { name: 'vendor-mobx', test: vendor('mobx', 'mobx-react') },
            { name: 'vendor-moment', test: vendor('moment', 'moment-timezone') },
            { name: 'vendor-feathers', test: vendor('@feathersjs/feathers', '@feathersjs/socketio-client', '@feathersjs/authentication-client', 'socket.io-client') },
          ],
        },
      },
    },
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
      '/basemap': {
        target: 'https://basemap.at',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/basemap/, ''),
      },
    },
  },
});
