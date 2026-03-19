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

type DenoGlobal = {
  Deno?: {
    version?: {
      deno?: string
    }
  }
}

type NavigatorWithAcceleration = Navigator & {
  gpu?: {
    requestAdapter?: unknown
  }
  ml?: {
    createContext?: unknown
  }
}

type CanvasLike = {
  getContext?: (...args: unknown[]) => unknown
}

const isNodeJs = (): boolean =>
  typeof process !== 'undefined' && !!process.versions?.node

export const isDeno = (): boolean =>
  !!(globalThis as typeof globalThis & DenoGlobal).Deno?.version?.deno

const getNavigator = (): NavigatorWithAcceleration | undefined =>
  globalThis.navigator as NavigatorWithAcceleration | undefined

const hasWebNN = (): boolean =>
  typeof getNavigator()?.ml?.createContext === 'function'

const hasWebGPU = (): boolean =>
  typeof getNavigator()?.gpu?.requestAdapter === 'function'

const hasWebGLContext = (canvas: CanvasLike | null | undefined): boolean =>
  !!(
    canvas?.getContext?.('webgl2') ??
    canvas?.getContext?.('webgl') ??
    canvas?.getContext?.('experimental-webgl')
  )

const hasWebGL = (): boolean => {
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      return hasWebGLContext(new OffscreenCanvas(1, 1) as unknown as CanvasLike)
    }

    if (typeof document !== 'undefined') {
      return hasWebGLContext(document.createElement('canvas') as CanvasLike)
    }
  } catch {
    return false
  }

  return false
}

/**
 * Indicates whether the current runtime likely exposes GPU-backed browser APIs.
 *
 * This probe is intended for browsers and browser web workers. In Node.js,
 * Bun, Deno, and other server-style runtimes, it always returns `false`.
 *
 * @returns `true` when WebNN, WebGPU, or WebGL appears to be available;
 * otherwise `false`.
 */
export function GPUAccelerationSupported(): boolean {
  if (isNodeJs() || isDeno()) {
    return false
  }

  return hasWebNN() || hasWebGPU() || hasWebGL()
}
