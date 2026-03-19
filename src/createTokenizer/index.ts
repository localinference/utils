import { toBase64String } from '@sovereignbase/bytecodec'
import { SentencePieceProcessor } from '@sctg/sentencepiece-js'
import { LocalInferenceUtilsError } from '../.errors/class.js'

/**
 * Creates a SentencePiece tokenizer from a serialized model.
 *
 * @param model The serialized SentencePiece model bytes.
 * @returns A promise that fulfills with the loaded tokenizer.
 * @throws {LocalInferenceUtilsError} Thrown if the model bytes cannot be loaded.
 */
export async function createTokenizer(
  model: Uint8Array
): Promise<SentencePieceProcessor> {
  const tokenizer = new SentencePieceProcessor()

  try {
    await tokenizer.loadFromB64StringModel(toBase64String(model))
  } catch (cause) {
    throw new LocalInferenceUtilsError(
      'TOKENIZER_MODEL_LOAD_FAILED',
      'failed to load SentencePiece model',
      { cause }
    )
  }

  return tokenizer
}
