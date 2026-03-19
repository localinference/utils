import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const host = '127.0.0.1'
const port = Number(process.env.PLAYWRIGHT_TEST_PORT ?? '4173')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
}

const resolveRequestPath = (pathname) => {
  const normalized =
    pathname === '/' ? '/test/e2e/runsInBrowsers/index.html' : pathname
  const localPath = path.normalize(path.join(root, normalized))

  if (!localPath.startsWith(root)) {
    throw new Error('path traversal is not allowed')
  }

  return localPath
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${host}:${port}`)
    const filePath = resolveRequestPath(url.pathname)
    const body = await readFile(filePath)
    const extension = path.extname(filePath)

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
    })
    response.end(body)
  } catch (error) {
    const status = /ENOENT/.test(String(error)) ? 404 : 500
    response.writeHead(status, {
      'Content-Type': 'text/plain; charset=utf-8',
    })
    response.end(status === 404 ? 'Not found' : 'Internal server error')
  }
})

server.listen(port, host, () => {
  console.log(
    `@localinference/utils test server running at http://${host}:${port}`
  )
})

const stopServer = () => {
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', stopServer)
process.on('SIGTERM', stopServer)
