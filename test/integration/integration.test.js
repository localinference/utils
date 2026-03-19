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
  const originalProcess = globalThis.process
  const originalDeno = globalThis.Deno
  const originalCreate = ort.InferenceSession.create
  const originalNumThreads = ort.env.wasm.numThreads

  globalThis.process = undefined
  globalThis.Deno = { version: { deno: '2.2.5' } }
  ort.InferenceSession.create = async () => {
    throw new Error('forced deno inference failure')
  }

  try {
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
  } finally {
    ort.InferenceSession.create = originalCreate
    ort.env.wasm.numThreads = originalNumThreads
    globalThis.Deno = originalDeno
    globalThis.process = originalProcess
  }
})

test('createInferenceSession wraps browser-branch initialization failures', async () => {
  const originalProcess = globalThis.process
  const originalCreate = ortAll.InferenceSession.create

  globalThis.process = undefined
  ortAll.InferenceSession.create = async () => {
    throw new Error('forced browser inference failure')
  }

  try {
    await assert.rejects(
      () => createInferenceSession(new Uint8Array([0, 1, 2])),
      (error) => {
        assert.ok(error instanceof LocalInferenceUtilsError)
        assert.equal(error.code, 'INFERENCE_SESSION_CREATE_FAILED')
        assert.ok(error.cause instanceof Error)
        return true
      }
    )
  } finally {
    ortAll.InferenceSession.create = originalCreate
    globalThis.process = originalProcess
  }
})
