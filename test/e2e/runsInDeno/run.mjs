import { runEndToEndScenario } from '../scenario.mjs'

const [{ Tensor }, utils] = await Promise.all([
  import('onnxruntime-web'),
  import('../../../dist/index.js'),
])

const { passed, total } = await runEndToEndScenario({
  runtime: 'deno',
  Tensor,
  ...utils,
})

console.log('=== Deno E2E ===')
console.log(`deno esm: ${passed}/${total} passed`)
