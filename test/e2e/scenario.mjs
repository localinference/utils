import { getIdentityModel, getTokenizerModel } from '../fixtures/models.js'

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const TOTAL_E2E_CHECKS = 3

const expectWrappedInferenceError = async ({
  createInferenceSession,
  LocalInferenceUtilsError,
  runtime,
}) => {
  try {
    await createInferenceSession(new Uint8Array([0, 1, 2]))
  } catch (error) {
    assert(
      error instanceof LocalInferenceUtilsError,
      'expected LocalInferenceUtilsError for invalid ONNX model'
    )
    assert(
      error.code === 'INFERENCE_SESSION_CREATE_FAILED',
      `expected INFERENCE_SESSION_CREATE_FAILED, got ${error.code}`
    )
    return
  }

  throw new Error('expected invalid ONNX model bytes to reject')
}

export const runEndToEndScenario = async ({
  runtime,
  Tensor,
  createInferenceSession,
  createTokenizer,
  GPUAccelerationSupported,
  LocalInferenceUtilsError,
}) => {
  let passed = 0

  const tokenizer = await createTokenizer(getTokenizerModel())
  const pieces = tokenizer.encodePieces('hello world')

  assert(
    JSON.stringify(pieces) === JSON.stringify(['▁hello', '▁world']),
    `[e2e:${runtime}] unexpected token pieces: ${JSON.stringify(pieces)}`
  )
  assert(
    tokenizer.decodeIds(tokenizer.encodeIds('hello world')) === 'hello world',
    `[e2e:${runtime}] tokenizer roundtrip failed`
  )
  passed += 1

  const gpuAccelerationLikelyAvailable = GPUAccelerationSupported()
  assert(
    typeof gpuAccelerationLikelyAvailable === 'boolean',
    `[e2e:${runtime}] GPUAccelerationSupported() did not return a boolean`
  )

  if (runtime === 'node' || runtime === 'bun' || runtime === 'deno') {
    assert(
      gpuAccelerationLikelyAvailable === false,
      `[e2e:${runtime}] GPUAccelerationSupported() should return false`
    )
  }

  const session = await createInferenceSession(getIdentityModel())

  try {
    assert(
      JSON.stringify(session.inputNames) === JSON.stringify(['input']),
      `[e2e:${runtime}] unexpected input names: ${JSON.stringify(session.inputNames)}`
    )
    assert(
      JSON.stringify(session.outputNames) === JSON.stringify(['output']),
      `[e2e:${runtime}] unexpected output names: ${JSON.stringify(session.outputNames)}`
    )

    const outputs = await session.run({
      input: new Tensor('float32', Float32Array.from([17]), [1]),
    })

    assert(
      outputs.output.data[0] === 17,
      `[e2e:${runtime}] inference output mismatch: ${outputs.output.data[0]}`
    )
  } finally {
    if ('release' in session && typeof session.release === 'function') {
      await session.release()
    }
  }
  passed += 1

  await expectWrappedInferenceError({
    createInferenceSession,
    LocalInferenceUtilsError,
    runtime,
  })
  passed += 1

  return { passed, total: TOTAL_E2E_CHECKS }
}
