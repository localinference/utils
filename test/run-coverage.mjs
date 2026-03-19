import { spawnSync } from 'node:child_process'
import fg from 'fast-glob'

const testFiles = (
  await fg(['test/unit/**/*.test.js', 'test/integration/**/*.test.js'], {
    onlyFiles: true,
  })
).sort()

if (testFiles.length === 0) {
  throw new Error('no test files found')
}

const result = spawnSync(
  process.execPath,
  [
    './node_modules/c8/bin/c8.js',
    '--reporter=text',
    '--reporter=lcov',
    '--report-dir',
    'coverage',
    process.execPath,
    '--test',
    ...testFiles,
  ],
  {
    stdio: 'inherit',
  }
)

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
