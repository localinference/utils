import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { EdgeRuntime } from 'edge-runtime'

const distEntryPath = path.resolve('dist/index.js')
const distSource = await readFile(distEntryPath, 'utf8')

const transformEsmForEdgeRuntime = (source) =>
  source
    .replace(
      'import { toBase64String } from "@sovereignbase/bytecodec";',
      'const { toBase64String } = await __import("@sovereignbase/bytecodec");'
    )
    .replace(
      'import { SentencePieceProcessor } from "@sctg/sentencepiece-js";',
      'const { SentencePieceProcessor } = await __import("@sctg/sentencepiece-js");'
    )
    .replace(
      'return import("onnxruntime-web/all");',
      'return __import("onnxruntime-web/all");'
    )
    .replace(
      'const runtime = await import("onnxruntime-web");',
      'const runtime = await __import("onnxruntime-web");'
    )
    .replace(
      /export\s*\{\s*GPUAccelerationSupported,\s*LocalInferenceUtilsError,\s*createInferenceSession,\s*createTokenizer\s*\};/,
      'return { GPUAccelerationSupported, LocalInferenceUtilsError, createInferenceSession, createTokenizer };'
    )

const runtime = new EdgeRuntime({
  extend(context) {
    let usedWasmRuntime = false
    let usedBrowserRuntime = false
    let executionProviders

    class SentencePieceProcessor {
      async loadFromB64StringModel(model) {
        this.loadedModel = model
      }
    }

    context.__edgeTestState = {
      getExecutionProviders() {
        return executionProviders
      },
      usedBrowserRuntime() {
        return usedBrowserRuntime
      },
      usedWasmRuntime() {
        return usedWasmRuntime
      },
    }

    context.__import = async (specifier) => {
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
        return { SentencePieceProcessor }
      }

      if (specifier === '@sovereignbase/bytecodec') {
        return {
          toBase64String() {
            return 'edge-tokenizer-model'
          },
        }
      }

      throw new Error(`unexpected edge-runtime import: ${specifier}`)
    }

    return context
  },
})

runtime.evaluate(`
globalThis.__utilsPromise = (async (__import) => {
${transformEsmForEdgeRuntime(distSource)}
})(globalThis.__import);
`)

const utils = await runtime.context.__utilsPromise
const state = runtime.context.__edgeTestState

let passed = 0
const total = 3

const tokenizer = await utils.createTokenizer(new Uint8Array([1, 2, 3]))
assert.equal(tokenizer.loadedModel, 'edge-tokenizer-model')
passed += 1

assert.equal(utils.GPUAccelerationSupported(), false)
passed += 1

await assert.rejects(
  () => utils.createInferenceSession(new Uint8Array([0, 1, 2])),
  (error) => {
    assert.equal(error.name, 'LocalInferenceUtilsError')
    assert.equal(error.code, 'INFERENCE_SESSION_CREATE_FAILED')
    assert.equal(state.usedWasmRuntime(), true)
    assert.equal(state.usedBrowserRuntime(), false)
    assert.deepEqual(Array.from(state.getExecutionProviders()), ['wasm'])
    assert.ok(error.cause instanceof Error)
    return true
  }
)
passed += 1

console.log('=== Edge Runtimes E2E ===')
console.log(`edge-runtime esm: ${passed}/${total} passed`)
