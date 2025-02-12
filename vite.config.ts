import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import { crx } from "@crxjs/vite-plugin"
import { manifest } from './manifest'
import { coreBundle } from "./plugins/core-bundle";
// import { type ManifestV3Export } from "@crxjs/vite-plugin"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    coreBundle({
      inputFilePath: 'src/core/index.ts',
      outputFilePath: 'src/core/output.js',
      functionName: 'coreInject',
      params: '_local',
    }),
    react(),
    crx({manifest} as any),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2022'
  },
  server: { port: 3000, hmr: { port: 3000 } },
})
