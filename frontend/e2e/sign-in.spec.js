import { expect, test } from '@playwright/test'
import { ACCOUNTS, PASSWORD, fillLogIn, logIn, logOut } from './helpers'

// Signing in and staying signed in (api/decisions/0001-sign-in-tokens.md):
// the access token is only in memory, so a reload must sign the person
// back in from the refresh cookie.

test('a wrong password says so, without saying which part was wrong', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(ACCOUNTS.parent.email)
  await page.getByLabel('Password', { exact: true }).fill('not-the-password')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Email or password is incorrect.',
  )
  await expect(page).toHaveURL(/\/login$/)
})

test('a page that needs signing in sends you to log in, then back to it', async ({
  page,
}) => {
  await page.goto('/parent/payments')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email').fill(ACCOUNTS.parent.email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/parent\/payments$/)
})

test('reloading the page keeps you signed in; logging out ends it', async ({
  page,
}) => {
  await logIn(page, 'parent')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL(/\/parent$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await logOut(page)
  await page.goto('/parent')
  await expect(page).toHaveURL(/\/login$/)
})

test('each role only reaches its own pages', async ({ page }) => {
  await logIn(page, 'parent')
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/parent$/)
})

test('the token never goes into localStorage', async ({ page }) => {
  await logIn(page, 'driver')
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }))
  // The mock server keeps its stand-in for the HttpOnly cookie under its
  // own key; no access token may be stored anywhere.
  expect(stored).not.toMatch(/accessToken|mock\.ey/)
})

test('a signed-out person can log in after logging out', async ({ page }) => {
  await logIn(page, 'admin')
  await logOut(page)
  await fillLogIn(page, 'driver')
})
