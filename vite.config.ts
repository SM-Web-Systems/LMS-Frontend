import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const extraAllowedHosts =
  process.env.VITE_DEV_ALLOWED_HOSTS?.split(',')
    .map((h) => h.trim())
    .filter(Boolean) ?? []

const allowedHosts = [
  'localhost',
  '.localhost',
  '127.0.0.1',
  'lms.smwebsystems.com',
  ...extraAllowedHosts,
]

// Base path the app is served under. Set VITE_BASE_PATH=/learn/ when the app is
// reverse-proxied into the marketing site (smwebsystems.com/learn); defaults to
// root for the standalone lms.smwebsystems.com deployment.
const basePath = process.env.VITE_BASE_PATH || '/'

// https://vitejs.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    strictPort: false,
    allowedHosts,
  },
  preview: {
    host: true,
    strictPort: false,
    port: 5173,
    allowedHosts,
  },
})
