import { expect, test } from '@playwright/test'
import { CHILD_PHOTO, logIn, openPage, toast } from './helpers'

test('a new parent signs up and is asked to confirm their email', async ({
  page,
}) => {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('Akinyi Odhiambo')
  await page.getByLabel('Phone number').fill('712345678')
  await page.getByLabel('Email').fill('akinyi.odhiambo@example.com')
  await page.getByLabel('Password', { exact: true }).fill('Safari#2026')
  await page.locator('#consent').check()
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(
    page.getByRole('heading', { name: 'Check your email' }),
  ).toBeVisible()
  await expect(page.getByText('akinyi.odhiambo@example.com')).toBeVisible()
})

test('signing up with an email that has an account is refused', async ({
  page,
}) => {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('Jane Mwangi')
  await page.getByLabel('Phone number').fill('722118340')
  await page.getByLabel('Email').fill('parent@example.com')
  await page.getByLabel('Password', { exact: true }).fill('Safari#2026')
  await page.locator('#consent').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('alert')).toContainText('already exists')
})

test('a parent adds a child, which waits for the transport office', async ({
  page,
}) => {
  await logIn(page, 'parent')
  await openPage(page, 'Children')
  await page.getByRole('link', { name: 'Add a child' }).click()

  // The form checks itself before anything is sent.
  await page.getByRole('button', { name: 'Save child' }).click()
  await expect(page.getByText("Enter your child's full name")).toBeVisible()

  await page.locator('#photo').setInputFiles(CHILD_PHOTO)
  await page.getByLabel('Full name').fill('Amani Mwangi')
  await page.getByLabel('Grade').selectOption('Grade 5')
  await page.locator('#pickup-address').fill('Kindaruma Rd, Kilimani')
  await page
    .locator('.leaflet-container')
    .first()
    .click({ position: { x: 150, y: 150 } })
  await page.getByRole('button', { name: 'Save child' }).click()

  await expect(toast(page, 'Amani is added')).toBeVisible()
  await expect(page).toHaveURL(/\/parent\/children$/)
  await expect(page.getByText(/Application sent/)).toBeVisible()
})
