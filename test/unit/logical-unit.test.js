import assert from 'node:assert/strict'
import test from 'node:test'
import { SentencePieceProcessor } from '@sctg/sentencepiece-js'
import { createTokenizer, LocalInferenceUtilsError } from '../../dist/index.js'
import { getTokenizerModel } from '../fixtures/models.js'

test('LocalInferenceUtilsError uses the code as the default detail', () => {
  const error = new LocalInferenceUtilsError('TOKENIZER_MODEL_LOAD_FAILED')

  assert.equal(error.code, 'TOKENIZER_MODEL_LOAD_FAILED')
  assert.equal(
    error.message,
    '{@localinference/utils} TOKENIZER_MODEL_LOAD_FAILED'
  )
  assert.equal(error.name, 'LocalInferenceUtilsError')
})

test('createTokenizer loads a serialized SentencePiece model', async () => {
  const tokenizer = await createTokenizer(getTokenizerModel())

  assert.deepEqual(tokenizer.encodePieces('hello world'), ['▁hello', '▁world'])
  assert.equal(
    tokenizer.decodeIds(tokenizer.encodeIds('hello world')),
    'hello world'
  )
})

test('createTokenizer wraps SentencePiece loading failures', async () => {
  const originalLoad = SentencePieceProcessor.prototype.loadFromB64StringModel

  SentencePieceProcessor.prototype.loadFromB64StringModel = async () => {
    throw new Error('forced SentencePiece failure')
  }

  try {
    await assert.rejects(
      () => createTokenizer(new Uint8Array([0, 1, 2])),
      (error) => {
        assert.ok(error instanceof LocalInferenceUtilsError)
        assert.equal(error.code, 'TOKENIZER_MODEL_LOAD_FAILED')
        assert.ok(error.cause instanceof Error)
        return true
      }
    )
  } finally {
    SentencePieceProcessor.prototype.loadFromB64StringModel = originalLoad
  }
})
