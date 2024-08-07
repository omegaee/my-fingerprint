import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import { crx } from "@crxjs/vite-plugin"
import { manifest } from './manifest'
// import { type ManifestV3Export } from "@crxjs/vite-plugin"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), crx({manifest} as any)],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: { port: 3000, hmr: { port: 3000 } },
})
