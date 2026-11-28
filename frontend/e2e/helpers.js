import { expect } from '@playwright/test'

// The sample accounts (src/data/sample-accounts.js). With the real API,
// these come from the test database's seed instead.
export const ACCOUNTS = {
  parent: { email: 'parent@example.com', name: 'Jane Mwangi', home: '/parent' },
  driver: {
    email: 'driver@example.com',
    name: 'Peter Otieno',
    home: '/driver',
  },
  admin: { email: 'admin@example.com', name: 'Grace Wanjiru', home: '/admin' },
}
export const PASSWORD = 'Fika2026!'

export const CHILD_PHOTO = new URL(
  './fixtures/child-photo.png',
  import.meta.url,
).pathname

// Fills in the log in page, which must already be open.
export async function fillLogIn(page, role) {
  await page.getByLabel('Email').fill(ACCOUNTS[role].email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${ACCOUNTS[role].home}$`))
}

export async function logIn(page, role) {
  await page.goto('/login')
  await fillLogIn(page, role)
}

// Through the account menu, so the page isn't reloaded: the mock server's
// changes (a new child, a placement) stay in memory for the next person
// who logs in, as they would in the database.
export async function logOut(page) {
  await page.locator('[aria-haspopup="menu"]').first().click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login$/)
}

// The menu is a sidebar on a computer; on a phone it opens from the
// "Open menu" button.
export async function openPage(page, name) {
  const link = page
    .getByRole('link', { name, exact: true })
    .filter({ visible: true })
  await expect(page.getByRole('main')).toBeVisible()
  if ((await link.count()) === 0) {
    await page.getByRole('button', { name: 'Open menu' }).click()
  }
  await link.first().click()
}

export function toast(page, text) {
  return page.locator('[data-sonner-toast]', { hasText: text }).first()
}
