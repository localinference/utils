import { performance } from 'node:perf_hooks'
import { Tensor } from 'onnxruntime-web'
import { createInferenceSession, createTokenizer } from '../dist/index.js'
import { getIdentityModel, getTokenizerModel } from '../test/fixtures/models.js'

const formatResult = (name, iterations, durationMs) => {
  const opsPerSecond = iterations / (durationMs / 1000)
  const msPerOperation = durationMs / iterations

  console.log(
    `${name.padEnd(20)} ${opsPerSecond.toFixed(1)} ops/s (${msPerOperation.toFixed(3)} ms/op)`
  )
}

const measureSync = (name, iterations, fn) => {
  const start = performance.now()

  for (let index = 0; index < iterations; index += 1) {
    fn()
  }

  formatResult(name, iterations, performance.now() - start)
}

const measureAsync = async (name, iterations, fn) => {
  const start = performance.now()

  for (let index = 0; index < iterations; index += 1) {
    await fn()
  }

  formatResult(name, iterations, performance.now() - start)
}

console.log(
  `Environment: ${process.version} (${process.platform} ${process.arch})`
)

await measureAsync('tokenizer load', 5, async () => {
  const tokenizer = await createTokenizer(getTokenizerModel())

  if (tokenizer.encodeIds('hello world').length === 0) {
    throw new Error('tokenizer benchmark produced no tokens')
  }
})

const tokenizer = await createTokenizer(getTokenizerModel())

measureSync('tokenizer encode', 5000, () => {
  tokenizer.encodeIds('hello world')
})

await measureAsync('session create', 5, async () => {
  const session = await createInferenceSession(getIdentityModel())

  if ('release' in session && typeof session.release === 'function') {
    await session.release()
  }
})

const session = await createInferenceSession(getIdentityModel())
const input = new Tensor('float32', Float32Array.from([1]), [1])

try {
  await measureAsync('session run', 200, async () => {
    const outputs = await session.run({ input })

    if (outputs.output.data[0] !== 1) {
      throw new Error('session benchmark produced an unexpected result')
    }
  })
} finally {
  if ('release' in session && typeof session.release === 'function') {
    await session.release()
  }
}
