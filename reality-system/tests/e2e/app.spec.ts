import { expect, test } from '@playwright/test'
import { ledgerTotal, onboard, quickAdd } from './helpers'

test.describe('core flow', () => {
  test('quests, XP and preferences survive a reload; duplicate completion is impossible', async ({ page }) => {
    await onboard(page, 'Kai')
    await quickAdd(page, 'Write lab report')
    const complete = page.getByRole('button', { name: 'Complete Write lab report' })
    await complete.dblclick()
    await expect(page.getByRole('button', { name: 'Undo completion of Write lab report' })).toBeVisible()
    // onboarding achievement (10) + first quest achievement (10) + quest (20)
    expect(await ledgerTotal(page)).toBe(40)

    // change theme and turn off 3D
    await page.goto('/#/customize')
    await page.getByRole('button', { name: 'Apply Crimson Hunter' }).click()
    await page.getByRole('tab', { name: 'Motion & 3D' }).click()
    await page.getByRole('switch', { name: 'Enable 3D' }).click()

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'crimson-hunter')
    await page.goto('/#/overview')
    await expect(page.getByRole('button', { name: 'Undo completion of Write lab report' })).toBeVisible()
    await expect(page.locator('canvas[aria-hidden]').filter({ hasNot: page.locator('[role=img]') })).toHaveCount(1) // only the 2D background canvas
    expect(await ledgerTotal(page)).toBe(40)
    await expect(page.getByText('Kai', { exact: true }).first()).toBeVisible()
  })

  test('undo reverses XP through the ledger and allows re-completion', async ({ page }) => {
    await onboard(page)
    await quickAdd(page, 'Stretch')
    await page.getByRole('button', { name: 'Complete Stretch' }).click()
    await page.getByRole('button', { name: 'Undo completion of Stretch' }).click()
    await expect(page.getByRole('button', { name: 'Complete Stretch' })).toBeVisible()
    expect(await ledgerTotal(page)).toBe(20) // two achievements stay; quest XP reversed
    await page.goto('/#/status')
    await expect(page.getByText('Undo: Stretch')).toBeVisible()
  })

  test('navigation, command palette and dialogs work with the keyboard', async ({ page }) => {
    await onboard(page)
    await page.keyboard.press('Control+k')
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
    await page.keyboard.type('focus chamber')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Focus Chamber' })).toBeVisible()
    await page.keyboard.press('Shift+N')
    await expect(page.getByRole('dialog', { name: 'Quick add quest' })).toBeVisible()
    // typing N in a field must not reopen anything or be intercepted
    await page.getByLabel('Quest title').type('New Notes')
    await expect(page.getByLabel('Quest title')).toHaveValue('New Notes')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    for (const name of ['Quest Archive', 'Goals', 'Skill Tree', 'Calendar', 'Achievements', 'Progress Reports', 'Settings']) {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name }).click()
      await expect(page.locator('main h1')).toBeVisible()
    }
  })

  test('quest editor validates input', async ({ page }) => {
    await onboard(page)
    await page.goto('/#/quests')
    await page.getByRole('button', { name: 'New quest' }).click()
    await page.getByRole('button', { name: 'Create quest' }).click()
    await expect(page.getByText('Give the quest a title.')).toBeVisible()
    await page.getByLabel('Title').fill('Read chapter 4')
    await page.getByLabel('Quest type').selectOption('checklist')
    await page.getByLabel('Checklist item 1').fill('Skim')
    await page.getByRole('button', { name: 'Create quest' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'Open details for Read chapter 4' }).click()
    await page.getByRole('checkbox', { name: 'Skim' }).check()
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Undo completion', exact: true })).toBeVisible()
  })

  test('focus timer survives a reload and cancelled sessions award no XP', async ({ page }) => {
    await onboard(page)
    const before = await ledgerTotal(page)
    await page.goto('/#/focus')
    await page.getByRole('button', { name: /Start 25 min focus/ }).click()
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect(page.getByRole('timer')).toContainText(/24:5\d|25:00/)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('cancelled').first()).toBeVisible()
    expect(await ledgerTotal(page)).toBe(before)
  })

  test('level-up preview plays and can be skipped without changing data', async ({ page }) => {
    await onboard(page)
    const before = await ledgerTotal(page)
    await page.goto('/#/customize')
    await page.getByRole('tab', { name: 'Motion & 3D' }).click()
    await page.getByRole('radio', { name: 'Cinematic' }).click()
    await page.getByRole('button', { name: 'Preview level-up' }).click()
    await expect(page.getByRole('alertdialog', { name: 'Level up' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    expect(await ledgerTotal(page)).toBe(before)
  })

  test('backup export, full reset and import restore the data; invalid files are rejected', async ({ page }) => {
    await onboard(page, 'Backup Hero')
    await quickAdd(page, 'Quest to keep')
    await page.getByRole('button', { name: 'Complete Quest to keep' }).click()
    const xp = await ledgerTotal(page)

    await page.goto('/#/settings')
    await page.getByRole('tab', { name: 'Data & backups' }).click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export backup' }).click()
    const download = await downloadPromise
    const file = await download.path()

    // invalid file is rejected and nothing changes
    await page.getByLabel('Choose a backup file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') })
    await expect(page.getByText('This file is not a REALITY SYSTEM backup.')).toBeVisible()

    // reset everything
    await page.getByRole('button', { name: 'Reset ALL app data…' }).click()
    await page.getByLabel(/Type RESET to confirm/).fill('RESET')
    await page.getByRole('button', { name: 'Erase everything' }).click()
    await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
    await onboard(page, 'Temp')

    // import (replace)
    await page.goto('/#/settings')
    await page.getByRole('tab', { name: 'Data & backups' }).click()
    await page.getByLabel('Choose a backup file').setInputFiles(file!)
    await page.getByRole('radio', { name: 'Replace' }).click()
    await page.getByRole('button', { name: 'Replace my data' }).click()
    await expect(page.getByText('Backup imported')).toBeVisible()
    expect(await ledgerTotal(page)).toBe(xp)
    await page.goto('/#/archive')
    await expect(page.getByRole('button', { name: 'Quest to keep' })).toBeVisible()
    await expect(page.getByText('Backup Hero').first()).toBeVisible()
  })

  test('small screens use the bottom navigation @mobile', async ({ page }) => {
    await onboard(page)
    const nav = page.getByRole('navigation', { name: 'Main navigation' }).last()
    await expect(nav.getByRole('button', { name: 'Quests' })).toBeVisible()
    await nav.getByRole('button', { name: 'More' }).click()
    await page.getByRole('dialog', { name: 'All sections' }).getByRole('button', { name: 'Calendar' }).click()
    await expect(page.locator('main h1')).toHaveText(/Calendar/i)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
