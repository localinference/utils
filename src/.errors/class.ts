export type LocalInferenceUtilsErrorCode =
  | 'TOKENIZER_MODEL_LOAD_FAILED'
  | 'INFERENCE_SESSION_CREATE_FAILED'

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
