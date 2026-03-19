import assert from 'node:assert/strict'
import test from 'node:test'
import { GPUAccelerationSupported } from '../../dist/index.js'

const withGlobalOverrides = async (overrides, run) => {
  const originals = new Map()

  try {
    for (const [key, value] of Object.entries(overrides)) {
      originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value,
      })
    }

    await run()
  } finally {
    for (const [key, descriptor] of originals.entries()) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor)
      } else {
        Reflect.deleteProperty(globalThis, key)
      }
    }
  }
}

test('GPUAccelerationSupported returns false in Node.js even with browser GPU stubs', async () => {
  await withGlobalOverrides(
    {
      navigator: {
        gpu: { requestAdapter() {} },
        ml: { createContext() {} },
      },
      OffscreenCanvas: class {
        getContext() {
          return {}
        }
      },
      document: {
        createElement() {
          return {
            getContext() {
              return {}
            },
          }
        },
      },
    },
    () => {
      assert.equal(GPUAccelerationSupported(), false)
    }
  )
})

test('GPUAccelerationSupported returns false in Deno', async () => {
  await withGlobalOverrides(
    {
      process: undefined,
      Deno: { version: { deno: '2.2.5' } },
      navigator: {
        gpu: { requestAdapter() {} },
        ml: { createContext() {} },
      },
    },
    () => {
      assert.equal(GPUAccelerationSupported(), false)
    }
  )
})

test('GPUAccelerationSupported detects WebNN', async () => {
  await withGlobalOverrides(
    {
      process: undefined,
      Deno: undefined,
      navigator: {
        ml: { createContext() {} },
      },
      OffscreenCanvas: undefined,
      document: undefined,
    },
    () => {
      assert.equal(GPUAccelerationSupported(), true)
    }
  )
})

test('GPUAccelerationSupported detects WebGPU', async () => {
  await withGlobalOverrides(
    {
      process: undefined,
      Deno: undefined,
      navigator: {
        gpu: { requestAdapter() {} },
      },
      OffscreenCanvas: undefined,
      document: undefined,
    },
    () => {
      assert.equal(GPUAccelerationSupported(), true)
    }
  )
})

test('GPUAccelerationSupported detects WebGL in web workers', async () => {
  await withGlobalOverrides(
    {
      process: undefined,
      Deno: undefined,
      navigator: {},
      OffscreenCanvas: class {
        getContext(contextId) {
          return contextId === 'webgl2' ? {} : null
        }
      },
      document: undefined,
    },
    () => {
      assert.equal(GPUAccelerationSupported(), true)
    }
  )
})

test('GPUAccelerationSupported detects WebGL in document environments', async () => {
  await withGlobalOverrides(
    {
      process: undefined,
      Deno: undefined,
      navigator: {},
      OffscreenCanvas: undefined,
      document: {
        createElement(tagName) {
          assert.equal(tagName, 'canvas')
          return {
            getContext(contextId) {
              return contextId === 'webgl' ? {} : null
            },
          }
        },
      },
    },
    () => {
      assert.equal(GPUAccelerationSupported(), true)
    }
  )
})

test('GPUAccelerationSupported detects legacy experimental WebGL', async () => {
  await withGlobalOverrides(
    {
      process: undefined,
      Deno: undefined,
      navigator: {},
      OffscreenCanvas: undefined,
      document: {
        createElement() {
          return {
            getContext(contextId) {
              return contextId === 'experimental-webgl' ? {} : null
            },
          }
        },
      },
    },
    () => {
      assert.equal(GPUAccelerationSupported(), true)
    }
  )
})

test('GPUAccelerationSupported returns false without GPU-capable browser APIs', async () => {
  await withGlobalOverrides(
    {
      process: undefined,
      Deno: undefined,
      navigator: {},
      OffscreenCanvas: undefined,
      document: undefined,
    },
    () => {
      assert.equal(GPUAccelerationSupported(), false)
    }
  )
})

test('GPUAccelerationSupported swallows WebGL probing failures', async () => {
  await withGlobalOverrides(
    {
      process: undefined,
      Deno: undefined,
      navigator: {},
      OffscreenCanvas: undefined,
      document: {
        createElement() {
          throw new Error('forced canvas failure')
        },
      },
    },
    () => {
      assert.equal(GPUAccelerationSupported(), false)
    }
  )
})
