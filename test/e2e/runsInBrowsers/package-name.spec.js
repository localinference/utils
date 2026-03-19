import { expect, test } from '@playwright/test'

test('browser scenario passes in this project', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.goto('/test/e2e/runsInBrowsers/index.html')
  await page.waitForFunction(
    () => globalThis.__E2E_RESULT__?.status,
    undefined,
    {
      timeout: 60000,
    }
  )

  const result = await page.evaluate(() => globalThis.__E2E_RESULT__)

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
  expect(result).toEqual({ status: 'ok' })
})
