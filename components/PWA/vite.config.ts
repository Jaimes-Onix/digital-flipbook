import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../../', ''); // Load env from root
  
  return {
    plugins: [
      react(),
      mkcert(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'digital-logo.png'],
        manifest: {
          name: 'PH LifeBook Mobile',
          short_name: 'LifeBook',
          description: 'Mobile Companion for Digital Library',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'digital-logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'digital-logo.png',
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
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      }
    },
    server: {
      port: 3001,
      host: true,
      https: {},
      proxy: {
        '/supabase-storage': {
          target: 'https://gikpzgdmxjqapioutsmo.supabase.co',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/supabase-storage/, '/storage/v1/object/public'),
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 2000,
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
