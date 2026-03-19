import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { EdgeRuntime } from 'edge-runtime'

const distEntryPath = path.resolve('dist/index.cjs')
const distEntryUrl = pathToFileURL(distEntryPath)
const distSource = await readFile(distEntryPath, 'utf8')
const nodeRequire = createRequire(distEntryUrl)

test('edge runtime uses the wasm-only inference path and reports no GPU acceleration', async () => {
  let usedWasmRuntime = false
  let usedBrowserRuntime = false
  let executionProviders

  const runtime = new EdgeRuntime({
    extend(context) {
      const module = { exports: {} }

      context.module = module
      context.exports = module.exports
      context.__filename = distEntryPath
      context.__dirname = path.dirname(distEntryPath)
      context.require = (specifier) => {
        if (specifier === 'onnxruntime-web') {
          return {
            env: { wasm: { numThreads: 0 } },
            InferenceSession: {
              async create(_model, options) {
                usedWasmRuntime = true
                executionProviders = options.executionProviders
                throw new Error('forced edge-runtime wasm inference failure')
              },
            },
          }
        }

        if (specifier === 'onnxruntime-web/all') {
          return {
            InferenceSession: {
              async create() {
                usedBrowserRuntime = true
                throw new Error('browser runtime should not be selected')
              },
            },
          }
        }

        if (specifier === '@sctg/sentencepiece-js') {
          return {
            SentencePieceProcessor: class SentencePieceProcessor {},
          }
        }

        if (specifier === '@sovereignbase/bytecodec') {
          return {
            toBase64String() {
              return ''
            },
          }
        }

        return nodeRequire(specifier)
      }

      return context
    },
  })

  runtime.evaluate(distSource)

  const utils = runtime.context.module.exports

  assert.equal(typeof utils.GPUAccelerationSupported, 'function')
  assert.equal(typeof utils.createInferenceSession, 'function')
  assert.equal(utils.GPUAccelerationSupported(), false)

  await assert.rejects(
    () => utils.createInferenceSession(new Uint8Array([0, 1, 2])),
    (error) => {
      assert.equal(error.name, 'LocalInferenceUtilsError')
      assert.equal(error.code, 'INFERENCE_SESSION_CREATE_FAILED')
      assert.equal(usedWasmRuntime, true)
      assert.equal(usedBrowserRuntime, false)
      assert.deepEqual(Array.from(executionProviders), ['wasm'])
      assert.ok(error.cause instanceof Error)
      return true
    }
  )
})
