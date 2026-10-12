import { expect, type Page } from '@playwright/test'

/** Runs the first-launch flow: skip the intro, name the player, finish setup. */
export async function onboard(page: Page, name = 'Tester') {
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await page.getByLabel('Display name').fill(name)
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText(`step ${i + 2} of 7`, { exact: false })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Enter the system' }).click()
  await expect(page.getByRole('heading', { name: 'Mainframe' })).toBeVisible()
}

export async function quickAdd(page: Page, title: string) {
  await page.getByRole('button', { name: 'Quick add quest' }).first().click()
  await page.getByLabel('Quest title').fill(title)
  await page.getByRole('button', { name: 'Add quest', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

/** Reads the lifetime XP straight from IndexedDB (independent of the UI). */
export async function ledgerTotal(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const req = indexedDB.open('reality-system')
        req.onerror = () => reject(req.error)
        req.onsuccess = () => {
          const get = req.result.transaction('ledger').objectStore('ledger').getAll()
          get.onsuccess = () => {
            resolve((get.result as Array<{ amount: number }>).reduce((n, e) => n + e.amount, 0))
            req.result.close()
          }
        }
      }),
  )
}
