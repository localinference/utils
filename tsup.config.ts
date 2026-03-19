// tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'dist-cjs',
  platform: 'node',
  target: 'node22',
  dts: false,
  sourcemap: false,
  splitting: false,
  clean: true,
  external: ['onnxruntime-web', 'onnxruntime-web/all'],
  noExternal: ['@sctg/sentencepiece-js', '@sovereignbase/bytecodec'],
  outExtension() {
    return { js: '.cjs' }
  },
})
