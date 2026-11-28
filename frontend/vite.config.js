import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // The offline page must never answer for the API.
      workbox: { navigateFallbackDenylist: [/^\/api\//] },
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Fika · School transport',
        short_name: 'Fika',
        description:
          'School transport management: live buses, routes, parents and fees.',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#121212',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // With VITE_API_URL=/api/v1, the browser calls this dev server and Vite
  // passes /api on to Flask. Front end and API then share one address, which
  // the refresh cookie needs (api/decisions/0001-sign-in-tokens.md).
  server: {
    proxy: { '/api': 'http://localhost:5000' },
  },
  preview: {
    proxy: { '/api': 'http://localhost:5000' },
  },
  // Vitest runs the unit tests; the e2e/ folder is Playwright's.
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
