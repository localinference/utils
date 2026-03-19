import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  platform: 'neutral',
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  external: [
    'node:*',
    '@sctg/sentencepiece-js',
    '@sovereignbase/bytecodec',
    'onnxruntime-web',
    'onnxruntime-web/all',
  ],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' }
  },
})
