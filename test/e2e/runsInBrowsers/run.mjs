import { spawnSync } from 'node:child_process'

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
    stdio: 'inherit',
  }
)

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
