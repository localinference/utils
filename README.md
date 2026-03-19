[![npm version](https://img.shields.io/npm/v/@localinference/utils)](https://www.npmjs.com/package/@localinference/utils)
[![CI](https://github.com/localinference/utils/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/localinference/utils/actions/workflows/ci.yaml)
[![codecov](https://codecov.io/gh/localinference/utils/branch/master/graph/badge.svg)](https://codecov.io/gh/localinference/utils)
[![license](https://img.shields.io/npm/l/@localinference/utils)](LICENSE)

# utils

Local Inference internal utils package to avoid boilerplate across codebases.

## Compatibility

- Runtimes: Node >= 22; Bun and Deno via npm compatibility; Browsers and browser web workers with WebAssembly; service-worker-style edge runtimes for package loading, GPU-detection fallback, and wasm-path selection smoke coverage.
- Module formats: ESM and CommonJS.
- Required globals / APIs: `Uint8Array`; browser runtimes need ONNX Runtime Web compatible backends such as `WebNN`, `WebGPU`, `WebGL`, or `WebAssembly`.
- TypeScript: bundled types.

## Goals

- Remove repeated setup code for SentencePiece and ONNX Runtime Web.
- Prefer the strongest available browser inference backend while still working in Node-based tooling.
- Keep the public surface intentionally small and side-effect free.
- Normalize failures into explicit `LocalInferenceUtilsError` codes.

## Installation

```sh
npm install @localinference/utils
# or
pnpm add @localinference/utils
# or
yarn add @localinference/utils
# or
bun add @localinference/utils
# or
deno add jsr:@localinference/utils
# or
vlt install jsr:@localinference/utils
```

## Usage

### Check whether browser GPU acceleration is likely available

```ts
import { GPUAccelerationSupported } from '@localinference/utils'

if (GPUAccelerationSupported()) {
  console.log('Browser GPU acceleration APIs look available')
}
```

### Load a tokenizer

```ts
import { createTokenizer } from '@localinference/utils'

const tokenizer = await createTokenizer(modelBytes)

const ids = tokenizer.encodeIds('hello world')
const text = tokenizer.decodeIds(ids)
```

### Create an inference session

```ts
import { Tensor } from 'onnxruntime-web'
import { createInferenceSession } from '@localinference/utils'

const session = await createInferenceSession(modelBytes)

const outputs = await session.run({
  input: new Tensor('float32', Float32Array.from([1]), [1]),
})
```

## Runtime behavior

### Node / Bun / Deno

`createInferenceSession()` uses the `onnxruntime-web` runtime with the `wasm` execution provider. In Deno, it also forces single-threaded wasm to avoid runtime worker failures. `createTokenizer()` loads the serialized SentencePiece model directly from bytes.

### Browsers / Web Workers

`GPUAccelerationSupported()` is a heuristic boolean probe for browser and browser-worker contexts. It checks for `WebNN`, `WebGPU`, and `WebGL`. `createInferenceSession()` only loads `onnxruntime-web/all` and prefers `webnn`, `webgpu`, `webgl`, then `wasm` when that probe returns `true`. Otherwise it stays on the `wasm` path. Browser builds must make the ONNX Runtime Web wasm assets reachable to the app.

### Cloudflare Workers / Edge runtimes

This package is smoke-tested in a service-worker-style edge runtime through `edge-runtime`. That coverage verifies that the package loads, `GPUAccelerationSupported()` returns `false`, and `createInferenceSession()` selects the wasm-only path instead of browser GPU providers.

That is narrower than full cross-platform inference support. Real ONNX execution still depends on each edge platform's WebAssembly loading model and asset rules, so Cloudflare Workers, Vercel Edge, and similar runtimes should still be validated in the exact deployment target before being treated as a production inference environment.

### Validation & errors

Failures are wrapped in `LocalInferenceUtilsError` with stable `code` values:

- `TOKENIZER_MODEL_LOAD_FAILED`
- `INFERENCE_SESSION_CREATE_FAILED`

The original dependency error is preserved as `error.cause`.

### Caching semantics

This package does not cache tokenizers or inference sessions. Each call creates a fresh runtime object.

## Tests

- Command: `npm test`
- Coverage runner: `node test/run-coverage.mjs`
- Coverage result: `100%` statements, branches, functions, and lines
- Runtime e2e coverage:
  - Node
  - Bun
  - Deno
  - Vercel Edge Runtime (`GPUAccelerationSupported()` / wasm-path smoke)
  - Chromium
  - Firefox
  - WebKit
  - Mobile Chrome (`Pixel 5`)
  - Mobile Safari (`iPhone 12`)
- CI matrix: Node `22.x` and `24.x`

`npm test` builds the package, runs the `node:test` unit/integration suite under `c8`, then runs the end-to-end smoke suite against the built package across all supported runtimes above.

## Benchmarks

- Command: `npm run bench`
- Environment: `Node v22.14.0 (win32 x64)`
- Workload: serialized SentencePiece tokenizer load/encode plus ONNX Runtime session create/run against the included identity model fixture
- Results:
  - tokenizer load: `7.9 ops/s` (`127.049 ms/op`)
  - tokenizer encode: `48509.3 ops/s` (`0.021 ms/op`)
  - session create: `10.6 ops/s` (`94.519 ms/op`)
  - session run: `8891.1 ops/s` (`0.112 ms/op`)

Results vary by machine.

## License

Apache-2.0
