import { expect, Page } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, modKey } from './utils'

test('cycling TODO state', async ({ page, block }) => {
  await setSkipDoingSettingTo(page, false)
  await createRandomPage(page)

  await block.mustFill('foo')
  await block.enterNext()
  await block.mustFill('bar')
  await block.escapeEditing()
  await page.keyboard.press('ArrowUp', { delay: 10 })
  await page.keyboard.press('ArrowUp', { delay: 10 })
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowDown', { delay: 10 })
  await page.keyboard.up('Shift')
  await block.waitForSelectedBlocks(2)

  for (const state of ['later', 'now', 'done', '']) {
    await page.keyboard.press(modKey + '+Shift+Enter', { delay: 10 })
    await expect(page.locator('.block-content span >> nth=0')).toHaveClass(
      `inline ${state}`.trim()
    )
    await expect(page.locator('.block-content span >> nth=1')).toHaveClass(
      `inline ${state}`.trim()
    )
  }
})

test('cycling TODO state while editing', async ({ page, block }) => {
  await setSkipDoingSettingTo(page, false)
  await createRandomPage(page)

  await block.activeEditing(0)
  await block.mustFill('foobar')
  await expect(page.locator('textarea >> nth=0')).toHaveText('foobar')
  await expect(block.isEditing()).toBeTruthy()
  for (const state of ['LATER', 'NOW', 'DONE', '']) {
    await page.keyboard.press(modKey + '+Shift+Enter', { delay: 10 })
    await expect(page.locator('textarea >> nth=0')).toHaveText(
      `${state} foobar`
    )
  }
})

test('cycling TODO state (SCHEDULED)', async ({ page, block }) => {
  await setSkipDoingSettingTo(page, false)
  await createRandomPage(page)

  await block.mustFill(`LATER foobar\nSCHEDULED: <2000-01-01 Sat .+73y>`)
  await block.escapeEditing()
  await page.keyboard.press('ArrowDown', { delay: 10 })
  const stateSeq = [
    { state: 'now', scheduled: '<2000-01-01 Sat .+73y>' },
    { state: 'later', scheduled: '<2073-01-01 Sun .+73y>' },
    { state: 'now', scheduled: '<2073-01-01 Sun .+73y>' },
  ]
  for (const expected of stateSeq) {
    await page.keyboard.press(modKey + '+Shift+Enter', { delay: 10 })
    await expect(page.locator('.block-content span >> nth=0')).toHaveClass(
      `inline ${expected.state}`
    )
    await expect(
      page.locator('.block-content .timestamp >> nth=0')
    ).toContainText(`SCHEDULED: ${expected.scheduled}`)
  }
})

test('cycling TODO state (SCHEDULED) while editing', async ({
  page,
  block,
}) => {
  await setSkipDoingSettingTo(page, false)
  await createRandomPage(page)

  await block.activeEditing(0)
  await block.mustFill(`LATER foobar\nSCHEDULED: <2000-01-01 Sat .+73y>`)
  await expect(block.isEditing()).toBeTruthy()
  const stateSeq = [
    { state: 'NOW', scheduled: '<2000-01-01 Sat .+73y>' },
    { state: 'LATER', scheduled: '<2073-01-01 Sun .+73y>' },
    { state: 'NOW', scheduled: '<2073-01-01 Sun .+73y>' },
  ]
  for (const expected of stateSeq) {
    await page.keyboard.press(modKey + '+Shift+Enter', { delay: 10 })
    await expect(page.locator('textarea >> nth=0')).toHaveText(
      `${expected.state} foobar\nSCHEDULED: ${expected.scheduled}`
    )
  }
})

test('cycling TODO state (SCHEDULED, but not repeating)', async ({
  page,
  block,
}) => {
  await setSkipDoingSettingTo(page, false)
  await createRandomPage(page)

  await block.mustFill(`LATER foobar\nSCHEDULED: <2000-01-01 Sat>`)
  await block.escapeEditing()
  await page.keyboard.press('ArrowDown', { delay: 10 })
  const stateSeq = [
    { state: 'now', scheduled: '<2000-01-01 Sat>' },
    { state: 'done', scheduled: '<2000-01-01 Sat>' },
  ]
  for (const expected of stateSeq) {
    await page.keyboard.press(modKey + '+Shift+Enter', { delay: 10 })

    await expect(page.locator('.block-content span >> nth=0')).toHaveClass(
      `inline ${expected.state}`
    )
    await expect(
      page.locator('.block-content .timestamp >> nth=0')
    ).toContainText(`SCHEDULED: ${expected.scheduled}`)
  }
})

test('skipping NOW/DOING when this option is enabled', async ({
  page,
  block,
}) => {
  await setSkipDoingSettingTo(page, true)
  await createRandomPage(page)

  await block.mustFill(`LATER foobar`)
  await block.escapeEditing()
  await page.keyboard.press('ArrowDown', { delay: 10 })
  await page.keyboard.press(modKey + '+Shift+Enter', { delay: 10 })
  await expect(page.locator('.block-content span >> nth=0')).toHaveClass(
    `inline done`
  )
})

async function setSkipDoingSettingTo(page: Page, enabled: boolean) {
  await page.click('#head .toolbar-dots-btn')
  await page.click('#head .dropdown-wrapper >> text=Settings')
  await page.click('.settings-modal [data-id=plugins] a')

  const setting = page.locator(
    '[data-key=cycleTODOdwimSkipDoing] >> input[type=checkbox]'
  )

  await setting.setChecked(enabled)
  await page.waitForTimeout(1000)
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
}
