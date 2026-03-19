// tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'dist-cjs',
  platform: 'node',
  target: 'node22',
  dts: false,
  sourcemap: true,
  splitting: false,
  clean: false,
  external: ['onnxruntime-web', 'onnxruntime-web/all'],
  noExternal: ['@sctg/sentencepiece-js', '@sovereignbase/bytecodec'],
  outExtension() {
    return { js: '.cjs' }
  },
})
