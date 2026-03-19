import { InferenceSession } from 'onnxruntime-web/all'

/**
 * Creates an ONNX Runtime inference session from a serialized model.
 *
 * The session prefers the WebNN, WebGPU, WebGL, and WASM execution
 * providers in that order.
 *
 * @param model The serialized ONNX model bytes.
 * @returns A promise that fulfills with the initialized inference session.
 */
export async function createInferenceSession(
  model: Uint8Array
): Promise<InferenceSession> {
  return await InferenceSession.create(model, {
    executionProviders: ['webnn', 'webgpu', 'webgl', 'wasm'],
  })
}
