import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Allow all origins - CORS configuration
        cors: {
          origin: '*',
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
          credentials: true
        },
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        },
        // Proxy Supabase requests to bypass CORS
        proxy: {
          '/supabase-storage': {
            target: 'https://gikpzgdmxjqapioutsmo.supabase.co',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/supabase-storage/, '/storage/v1/object/public'),
            configure: (proxy) => {
              proxy.on('error', (err) => {
                console.log('Proxy error:', err);
              });
              proxy.on('proxyReq', (proxyReq, req) => {
                console.log('Proxying:', req.url);
              });
            }
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'digital-logo.png'],
          manifest: {
            name: 'PH LifeBook',
            short_name: 'LifeBook',
            description: 'Digital Flipbook Application',
            theme_color: '#09090b',
            background_color: '#09090b',
            display: 'standalone',
            orientation: 'portrait-primary',
            start_url: '/',
            scope: '/',
            icons: [
              {
                src: 'pwa-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'pwa-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          devOptions: {
            enabled: true
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
          output: {
            manualChunks: {
              'three': ['three'],
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'pdf': ['pdfjs-dist'],
            }
          }
        }
      }
    };
});
