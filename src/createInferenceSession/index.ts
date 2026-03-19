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

import type { InferenceSession } from 'onnxruntime-web'
import { LocalInferenceUtilsError } from '../.errors/class.js'
import {
  GPUAccelerationSupported,
  isDeno,
} from '../GPUAccelerationSupported/index.js'

const getExecutionProviders = (useGPUAcceleration: boolean): string[] =>
  useGPUAcceleration ? ['webnn', 'webgpu', 'webgl', 'wasm'] : ['wasm']

const getRuntime = async (
  useGPUAcceleration: boolean
): Promise<typeof import('onnxruntime-web')> => {
  if (useGPUAcceleration) {
    return import('onnxruntime-web/all')
  }

  const runtime = await import('onnxruntime-web')

  if (isDeno()) {
    runtime.env.wasm.numThreads = 1
  }

  return runtime
}

/**
 * Creates an ONNX Runtime inference session from a serialized model.
 *
 * In Node.js, Bun, Deno, and runtimes without likely browser GPU acceleration,
 * the session uses the WASM execution provider. In browser-like runtimes that
 * appear to expose WebNN, WebGPU, or WebGL, it prefers those execution
 * providers before falling back to WASM.
 *
 * @param model The serialized ONNX model bytes.
 * @returns A promise that fulfills with the initialized inference session.
 * @throws {LocalInferenceUtilsError} Thrown if the model bytes cannot be loaded
 * into an ONNX Runtime session.
 */
export async function createInferenceSession(
  model: Uint8Array
): Promise<InferenceSession> {
  const useGPUAcceleration = GPUAccelerationSupported()
  const executionProviders = getExecutionProviders(useGPUAcceleration)
  const runtime = await getRuntime(useGPUAcceleration)

  try {
    return await runtime.InferenceSession.create(model, {
      executionProviders,
    })
  } catch (cause) {
    throw new LocalInferenceUtilsError(
      'INFERENCE_SESSION_CREATE_FAILED',
      'failed to create ONNX Runtime inference session',
      { cause }
    )
  }
}
