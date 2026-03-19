/*
 * Copyright 2026 Local Inference
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
