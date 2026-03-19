import { toBase64String } from '@sovereignbase/bytecodec'
import { SentencePieceProcessor } from '@sctg/sentencepiece-js'

/**
 * Creates a SentencePiece tokenizer from a serialized model.
 *
 * @param model The serialized SentencePiece model bytes.
 * @returns A promise that fulfills with the loaded tokenizer.
 */
export async function createTokenizer(
  model: Uint8Array
): Promise<SentencePieceProcessor> {
  const tokenizer = new SentencePieceProcessor()
  await tokenizer.loadFromB64StringModel(toBase64String(model))
  return tokenizer
}
