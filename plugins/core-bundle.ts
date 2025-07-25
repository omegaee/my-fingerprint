import { Plugin } from 'vite';
import { rollup } from 'rollup';
import { watch } from 'chokidar';
import { writeFileSync } from 'fs';

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
// import terser from '@rollup/plugin-terser';

type CoreBundleOptions = {
  inputFilePath: string
  outputFilePath: string
  functionName: string
  params: string
}

export const coreBundle = (options: CoreBundleOptions): Plugin => ({
  name: 'core-bundle',
  async buildStart() {
    await bundle(options);
  },
  configureServer(server) {
    const watcher = watch([options.inputFilePath], { persistent: true });
    watcher.on('change', async () => {
      await bundle(options);
      server.ws.send({ type: 'full-reload' });
    });
  }
})

async function bundle({ inputFilePath, outputFilePath, functionName, params }: CoreBundleOptions) {
  const bundle = await rollup({
    input: inputFilePath,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        compilerOptions: {
          isolatedModules: false,
          preserveConstEnums: false,
        },
      }),
    ],
  });
  const { output } = await bundle.generate({
    format: 'es',
    inlineDynamicImports: true,
  });
  const bundledCode = output[0].code;
  const wrappedCode = `export function ${functionName}(${params}) {\n${bundledCode}\n}`

  writeFileSync(outputFilePath, wrappedCode);
}

export default coreBundle;