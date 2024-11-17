import path from 'path'
import { expect } from '@playwright/test'
import { test } from './fixtures'
import { callPageAPI } from './utils'

test('verifying the plugin is installed', async ({ page }) => {
  await page.waitForTimeout(1_000)
  await page.keyboard.press('Escape')
  await page.keyboard.press('t+p')
  await expect(page.locator('.installed h3 span')).toHaveText(
    'logseq-cycle-todo-dwim'
  )
})
