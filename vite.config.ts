import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import { crx } from "@crxjs/vite-plugin"
import { firefoxManifest, chromeManifest } from './manifest'
import { coreBundle } from "./plugins/core-bundle";
// import { type ManifestV3Export } from "@crxjs/vite-plugin"

const args = process.argv
const isFirefox = args.includes('--firefox')
const isNoMinify = args.includes('--no-minify')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    coreBundle({
      inputFilePath: 'src/core/index.ts',
      outputFilePath: 'src/core/output.js',
      functionName: 'coreInject',
      params: '_args',
    }),
    react(),
    crx({
      browser: isFirefox ? 'firefox' : 'chrome',
      manifest: isFirefox ? firefoxManifest : chromeManifest as any,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2022',
    minify: isNoMinify ? false : 'esbuild',
    sourcemap: (isFirefox && isNoMinify) ? true : undefined,
    outDir: isFirefox ? 'dist-firefox' : 'dist',
  },
  server: { port: 3200, hmr: { port: 3200 } },
})
