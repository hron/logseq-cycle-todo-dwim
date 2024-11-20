import path from 'path'
import { expect } from '@playwright/test'
import { test } from './fixtures'
import { callPageAPI, createRandomPage, modKey } from './utils'

test('cycling TODO state', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('foobar')
  await block.escapeEditing()
  await page.keyboard.press('ArrowDown', { delay: 10 })
  for (const state of ['later', 'now', 'done', '']) {
    await page.keyboard.press(modKey + '+Enter', { delay: 10 })
    await expect(page.locator('.block-content span >> nth=0')).toHaveClass(
      `inline ${state}`.trim()
    )
  }

  await block.activeEditing(0)
  await block.mustFill('foobar')
  await expect(page.locator('textarea >> nth=0')).toHaveText('foobar')
  await expect(block.isEditing()).toBeTruthy()
  for (const state of ['LATER', 'NOW', 'DONE', '']) {
    await page.keyboard.press(modKey + '+Enter', { delay: 10 })
    await expect(page.locator('textarea >> nth=0')).toHaveText(
      `${state} foobar`
    )
  }
})

test('cycling TODO state (SCHEDULED)', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill(`LATER foobar\nSCHEDULED: <2000-01-01 Sat .+73y>`)
  await block.escapeEditing()
  await page.keyboard.press('ArrowDown', { delay: 10 })
  let stateSeq = [
    { state: 'now', scheduled: '<2000-01-01 Sat .+73y>' },
    { state: 'later', scheduled: '<2073-01-01 Sun .+73y>' },
    { state: 'now', scheduled: '<2073-01-01 Sun .+73y>' },
  ]
  for (const expected of stateSeq) {
    await page.keyboard.press(modKey + '+Enter', { delay: 10 })
    await expect(page.locator('.block-content span >> nth=0')).toHaveClass(
      `inline ${expected.state}`
    )
    await expect(
      page.locator('.block-content .timestamp >> nth=0')
    ).toContainText(expected.scheduled)
  }

  await block.activeEditing(0)
  await block.mustFill(`LATER foobar\nSCHEDULED: <2000-01-01 Sat .+73y>`)
  stateSeq = [
    { state: 'NOW', scheduled: '<2000-01-01 Sat .+73y>' },
    { state: 'LATER', scheduled: '<2073-01-01 Sun .+73y>' },
    { state: 'NOW', scheduled: '<2073-01-01 Sun .+73y>' },
  ]
  for (const expected of stateSeq) {
    await page.keyboard.press(modKey + '+Enter', { delay: 10 })
    await expect(page.locator('textarea >> nth=0')).toHaveText(
      `${expected.state} foobar\nSCHEDULED: ${expected.scheduled}`
    )
  }
})
