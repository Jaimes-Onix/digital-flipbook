import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
      plugins: [react()],
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
