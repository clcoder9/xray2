import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/*.png',
        'icons/*.svg',
        'models/wasm/*',
        'models/*.task',
        'dev-samples/*'
      ],
      manifest: {
        name: 'Anatomy Lens',
        short_name: 'AnatomyLens',
        description: 'On-device camera-based X-ray anatomy learning lens for fitness and physiotherapy.',
        theme_color: '#060a12',
        background_color: '#060a12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,task,jpg,webp}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  build: {
    target: 'es2022',
    sourcemap: false
  }
});
