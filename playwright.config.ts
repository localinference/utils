import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_TEST_PORT ?? '4173')
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: 'test/e2e/runsInBrowsers',
  timeout: 120000,
  use: {
    baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
})
