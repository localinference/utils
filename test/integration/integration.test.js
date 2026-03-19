import assert from 'node:assert/strict'
import test from 'node:test'
import * as ort from 'onnxruntime-web'
import { Tensor } from 'onnxruntime-web'
import * as ortAll from 'onnxruntime-web/all'
import {
  createInferenceSession,
  LocalInferenceUtilsError,
} from '../../dist/index.js'
import { getIdentityModel } from '../fixtures/models.js'

const withGlobalOverrides = async (overrides, run) => {
  const originals = new Map()

  try {
    for (const [key, value] of Object.entries(overrides)) {
      originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value,
      })
    }

    await run()
  } finally {
    for (const [key, descriptor] of originals.entries()) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor)
      } else {
        Reflect.deleteProperty(globalThis, key)
      }
    }
  }
}

test('createInferenceSession creates a runnable identity model session', async () => {
  const session = await createInferenceSession(getIdentityModel())

  try {
    assert.deepEqual(session.inputNames, ['input'])
    assert.deepEqual(session.outputNames, ['output'])

    const outputs = await session.run({
      input: new Tensor('float32', Float32Array.from([42]), [1]),
    })

    assert.equal(outputs.output.data[0], 42)
  } finally {
    if ('release' in session && typeof session.release === 'function') {
      await session.release()
    }
  }
})

test('createInferenceSession wraps ONNX Runtime initialization failures', async () => {
  await assert.rejects(
    () => createInferenceSession(new Uint8Array([0, 1, 2])),
    (error) => {
      assert.ok(error instanceof LocalInferenceUtilsError)
      assert.equal(error.code, 'INFERENCE_SESSION_CREATE_FAILED')
      assert.ok(error.cause instanceof Error)
      return true
    }
  )
})

test('createInferenceSession wraps deno-branch initialization failures', async () => {
  const originalCreate = ort.InferenceSession.create
  const originalNumThreads = ort.env.wasm.numThreads

  ort.InferenceSession.create = async (_model, options) => {
    assert.deepEqual(options.executionProviders, ['wasm'])
    throw new Error('forced deno inference failure')
  }

  try {
    await withGlobalOverrides(
      {
        process: undefined,
        Deno: { version: { deno: '2.2.5' } },
      },
      async () => {
        await assert.rejects(
          () => createInferenceSession(new Uint8Array([0, 1, 2])),
          (error) => {
            assert.ok(error instanceof LocalInferenceUtilsError)
            assert.equal(error.code, 'INFERENCE_SESSION_CREATE_FAILED')
            assert.equal(ort.env.wasm.numThreads, 1)
            assert.ok(error.cause instanceof Error)
            return true
          }
        )
      }
    )
  } finally {
    ort.InferenceSession.create = originalCreate
    ort.env.wasm.numThreads = originalNumThreads
  }
})

test('createInferenceSession wraps browser-branch initialization failures', async () => {
  const originalCreate = ortAll.InferenceSession.create

  ortAll.InferenceSession.create = async (_model, options) => {
    assert.deepEqual(options.executionProviders, [
      'webnn',
      'webgpu',
      'webgl',
      'wasm',
    ])
    throw new Error('forced browser inference failure')
  }

  try {
    await withGlobalOverrides(
      {
        process: undefined,
        Deno: undefined,
        navigator: {
          gpu: { requestAdapter() {} },
        },
      },
      async () => {
        await assert.rejects(
          () => createInferenceSession(new Uint8Array([0, 1, 2])),
          (error) => {
            assert.ok(error instanceof LocalInferenceUtilsError)
            assert.equal(error.code, 'INFERENCE_SESSION_CREATE_FAILED')
            assert.ok(error.cause instanceof Error)
            return true
          }
        )
      }
    )
  } finally {
    ortAll.InferenceSession.create = originalCreate
  }
})

test('createInferenceSession uses the wasm execution provider list when browser GPU APIs are unavailable', async () => {
  const originalWasmCreate = ort.InferenceSession.create
  const originalBrowserCreate = ortAll.InferenceSession.create
  let usedBrowserRuntime = false

  try {
    ort.InferenceSession.create = async (_model, options) => {
      assert.deepEqual(options.executionProviders, ['wasm'])
      throw new Error('forced wasm-only inference failure')
    }
    ortAll.InferenceSession.create = async () => {
      usedBrowserRuntime = true
      throw new Error('browser runtime should not have been selected')
    }

    await withGlobalOverrides(
      {
        process: undefined,
        Deno: undefined,
        navigator: {},
        OffscreenCanvas: undefined,
        document: undefined,
      },
      async () => {
        await assert.rejects(
          () => createInferenceSession(new Uint8Array([0, 1, 2])),
          (error) => {
            assert.ok(error instanceof LocalInferenceUtilsError)
            assert.equal(error.code, 'INFERENCE_SESSION_CREATE_FAILED')
            assert.equal(usedBrowserRuntime, false)
            assert.ok(error.cause instanceof Error)
            return true
          }
        )
      }
    )
  } finally {
    ort.InferenceSession.create = originalWasmCreate
    ortAll.InferenceSession.create = originalBrowserCreate
  }
})
