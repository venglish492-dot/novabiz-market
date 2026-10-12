import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, expect, test } from '@playwright/test'
import { ledgerTotal, onboard, quickAdd } from './helpers'

test('core features keep working with the network disabled', async ({ page, context }) => {
  await onboard(page)
  await quickAdd(page, 'Offline quest')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload() // let the service worker control the page

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mainframe' })).toBeVisible()
  await page.getByRole('button', { name: 'Complete Offline quest' }).click()
  await expect(page.getByRole('button', { name: 'Undo completion of Offline quest' })).toBeVisible()
  await page.goto('/#/reports')
  await expect(page.getByRole('heading', { name: 'Progress Reports' })).toBeVisible()
  await context.setOffline(false)
})

/** Simulates closing the browser AND stopping/restarting the local server. */
test('data persists after restarting the browser and the local server', async () => {
  const port = 4748
  const start = () => spawn('npx', ['vite', 'preview', '--port', String(port)], { stdio: 'ignore', detached: true })
  const stop = (p: ChildProcess) => {
    try {
      process.kill(-p.pid!)
    } catch {
      /* already stopped */
    }
  }
  const waitUp = async () => {
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(`http://localhost:${port}/`)).ok) return
      } catch {
        /* not up yet */
      }
      await new Promise((r) => setTimeout(r, 250))
    }
    throw new Error('server did not start')
  }
  const profile = mkdtempSync(join(tmpdir(), 'rs-profile-'))
  let server = start()
  try {
    await waitUp()
    let ctx = await chromium.launchPersistentContext(profile, { baseURL: `http://localhost:${port}`, executablePath: process.env.PW_CHROMIUM_PATH || undefined })
    let page = ctx.pages()[0] ?? (await ctx.newPage())
    await onboard(page, 'Persistent')
    await quickAdd(page, 'Survive restart')
    await page.getByRole('button', { name: 'Complete Survive restart' }).click()
    await expect(page.getByRole('button', { name: 'Undo completion of Survive restart' })).toBeVisible()
    const xp = await ledgerTotal(page)
    await ctx.close()

    stop(server)
    await new Promise((r) => setTimeout(r, 800))
    server = start()
    await waitUp()

    ctx = await chromium.launchPersistentContext(profile, { baseURL: `http://localhost:${port}`, executablePath: process.env.PW_CHROMIUM_PATH || undefined })
    page = ctx.pages()[0] ?? (await ctx.newPage())
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Undo completion of Survive restart' })).toBeVisible()
    await expect(page.getByText('Persistent').first()).toBeVisible()
    expect(await ledgerTotal(page)).toBe(xp)
    await ctx.close()
  } finally {
    stop(server)
    rmSync(profile, { recursive: true, force: true })
  }
})
