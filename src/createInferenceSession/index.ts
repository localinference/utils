import type { InferenceSession } from 'onnxruntime-web'
import { LocalInferenceUtilsError } from '../.errors/class.js'

type DenoGlobal = {
  Deno?: {
    version?: {
      deno?: string
    }
  }
}

const isNodeJs = (): boolean =>
  typeof process !== 'undefined' && !!process.versions?.node

const isDeno = (): boolean =>
  !!(globalThis as typeof globalThis & DenoGlobal).Deno?.version?.deno

const usesWasmRuntimeOnly = (): boolean => isNodeJs() || isDeno()

const getExecutionProviders = (): string[] =>
  usesWasmRuntimeOnly() ? ['wasm'] : ['webnn', 'webgpu', 'webgl', 'wasm']

const getInferenceSession = async (): Promise<
  (typeof import('onnxruntime-web'))['InferenceSession']
> => {
  if (usesWasmRuntimeOnly()) {
    const runtime = await import('onnxruntime-web')

    if (isDeno()) {
      runtime.env.wasm.numThreads = 1
    }

    return runtime.InferenceSession
  }

  const runtime = await import('onnxruntime-web/all')
  return runtime.InferenceSession
}

/**
 * Creates an ONNX Runtime inference session from a serialized model.
 *
 * In Node.js and Deno, the session uses the WASM execution provider. In
 * browser-like runtimes, the session prefers the WebNN, WebGPU, WebGL, and
 * WASM execution providers in that order.
 *
 * @param model The serialized ONNX model bytes.
 * @returns A promise that fulfills with the initialized inference session.
 * @throws {LocalInferenceUtilsError} Thrown if the model bytes cannot be loaded
 * into an ONNX Runtime session.
 */
export async function createInferenceSession(
  model: Uint8Array
): Promise<InferenceSession> {
  const Session = await getInferenceSession()

  try {
    return await Session.create(model, {
      executionProviders: getExecutionProviders(),
    })
  } catch (cause) {
    throw new LocalInferenceUtilsError(
      'INFERENCE_SESSION_CREATE_FAILED',
      'failed to create ONNX Runtime inference session',
      { cause }
    )
  }
}
