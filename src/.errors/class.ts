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

/**
 * Stable error codes exposed by `@localinference/utils`.
 */
export type LocalInferenceUtilsErrorCode =
  | 'TOKENIZER_MODEL_LOAD_FAILED'
  | 'INFERENCE_SESSION_CREATE_FAILED'

/**
 * Error type thrown by `@localinference/utils`.
 *
 * The `code` property is part of the public contract and can be used for
 * programmatic error handling across tokenizer and inference helpers.
 */
export class LocalInferenceUtilsError extends Error {
  readonly code: LocalInferenceUtilsErrorCode

  constructor(
    code: LocalInferenceUtilsErrorCode,
    message?: string,
    options?: ErrorOptions
  ) {
    const detail = message ?? code
    super(`{@localinference/utils} ${detail}`, options)
    this.code = code
    this.name = 'LocalInferenceUtilsError'
  }
}
