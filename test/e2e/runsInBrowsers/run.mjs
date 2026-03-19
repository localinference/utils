import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'

const getAvailablePort = async () =>
  new Promise((resolve, reject) => {
    const server = createServer()

    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()

      if (!address || typeof address === 'string') {
        server.close(() =>
          reject(new Error('failed to allocate browser test port'))
        )
        return
      }

      const { port } = address

      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve(port)
      })
    })
  })

const port = await getAvailablePort()
const env = {
  ...process.env,
  PLAYWRIGHT_TEST_PORT: String(port),
}
const baseURL = `http://127.0.0.1:${port}`

const delay = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration)
  })

const waitForServer = async (serverProcess) => {
  const timeoutAt = Date.now() + 30000

  while (Date.now() < timeoutAt) {
    if (serverProcess.exitCode !== null) {
      throw new Error(
        `browser test server exited early with code ${serverProcess.exitCode}`
      )
    }

    try {
      const response = await fetch(baseURL)

      if (response.ok) {
        return
      }
    } catch {}

    await delay(250)
  }

  throw new Error(`browser test server did not become ready at ${baseURL}`)
}

const serverProcess = spawn(process.execPath, ['test/e2e/server.mjs'], {
  env,
  stdio: 'inherit',
})

try {
  console.log('=== Browsers E2E ===')
  await waitForServer(serverProcess)

  const result = spawnSync(
    process.execPath,
    [
      'node_modules/playwright/cli.js',
      'test',
      '--config',
      'playwright.config.ts',
      'test/e2e/runsInBrowsers/package-name.spec.js',
    ],
    {
      env,
      stdio: 'inherit',
    }
  )

  if (result.error) {
    throw result.error
  }

  process.exit(result.status ?? 1)
} finally {
  serverProcess.kill()
}
