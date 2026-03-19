import { createRequire } from 'node:module'
import { runEndToEndScenario } from '../scenario.mjs'

const require = createRequire(import.meta.url)

const runAndReport = async (moduleFormat, loadRuntime) => {
  const { Tensor, utils } = await loadRuntime()
  const { passed, total } = await runEndToEndScenario({
    runtime: 'bun',
    Tensor,
    ...utils,
  })

  console.log(`bun ${moduleFormat}: ${passed}/${total} passed`)
}

console.log('=== Bun E2E ===')

await runAndReport('esm', async () => {
  const [{ Tensor }, utils] = await Promise.all([
    import('onnxruntime-web'),
    import('../../../dist/index.js'),
  ])

  return { Tensor, utils }
})

await runAndReport('cjs', async () => {
  const { Tensor } = require('onnxruntime-web')
  const utils = require('../../../dist/index.cjs')

  return { Tensor, utils }
})
