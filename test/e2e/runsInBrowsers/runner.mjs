import { clean_30k_b64, SentencePieceProcessor } from '@sctg/sentencepiece-js'
import { Tensor } from 'onnxruntime-web'
import {
  createInferenceSession,
  createTokenizer,
  LocalInferenceUtilsError,
} from '../../../dist/index.js'
import { IDENTITY_MODEL_B64 } from '../../fixtures/model-base64.js'

const decodeBase64 = (value) => {
  const raw = atob(value)
  const bytes = new Uint8Array(raw.length)

  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index)
  }

  return bytes
}

const setResult = (result) => {
  globalThis.__E2E_RESULT__ = result
  document.querySelector('#status').textContent =
    result.status === 'ok'
      ? 'Browser scenario passed'
      : 'Browser scenario failed'
  document.querySelector('#details').textContent = JSON.stringify(
    result,
    null,
    2
  )
}

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const runBrowserScenario = async () => {
  const tokenizer = await createTokenizer(decodeBase64(clean_30k_b64))
  assert(
    JSON.stringify(tokenizer.encodePieces('hello world')) ===
      JSON.stringify(['▁hello', '▁world']),
    'createTokenizer() did not produce expected pieces'
  )
  assert(
    tokenizer.decodeIds(tokenizer.encodeIds('hello world')) === 'hello world',
    'createTokenizer() did not roundtrip text'
  )

  const directTokenizer = new SentencePieceProcessor()
  await directTokenizer.loadFromB64StringModel(clean_30k_b64)
  assert(
    JSON.stringify(directTokenizer.encodePieces('hello world')) ===
      JSON.stringify(['▁hello', '▁world']),
    'direct SentencePiece smoke check failed'
  )

  const session = await createInferenceSession(decodeBase64(IDENTITY_MODEL_B64))

  try {
    const outputs = await session.run({
      input: new Tensor('float32', Float32Array.from([23]), [1]),
    })

    assert(outputs.output.data[0] === 23, 'browser inference output mismatch')
  } finally {
    if ('release' in session && typeof session.release === 'function') {
      await session.release()
    }
  }

  try {
    await createInferenceSession(new Uint8Array([0, 1, 2]))
    throw new Error('invalid ONNX bytes should have rejected')
  } catch (error) {
    assert(
      error instanceof LocalInferenceUtilsError,
      'invalid ONNX bytes did not throw LocalInferenceUtilsError'
    )
    assert(
      error.code === 'INFERENCE_SESSION_CREATE_FAILED',
      `unexpected browser inference error code: ${error.code}`
    )
  }
}

try {
  await runBrowserScenario()
  setResult({ status: 'ok' })
} catch (error) {
  console.error(error)
  setResult({
    status: 'error',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })
}
