import { expect, test } from '@playwright/test'
import {
  CHILD_PHOTO,
  fillLogIn,
  logIn,
  logOut,
  openPage,
  toast,
} from './helpers'

// One journey across two accounts, in one browser tab: what the parent adds
// is what the office sees, and what the office decides is what the parent
// sees. The tab is never reloaded, so the mock server's changes last, as
// they would in the database.

test('the office accepts a new child and places them on a bus', async ({
  page,
}) => {
  // The parent applies.
  await logIn(page, 'parent')
  await page.goto('/parent/children/new')
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
  await logOut(page)

  // The office accepts the application…
  await fillLogIn(page, 'admin')
  await openPage(page, 'New applications')
  const application = page.locator('article', { hasText: 'Amani Mwangi' })
  await expect(application).toContainText('Applied today')
  await expect(application).toContainText('Senior pickup (06:00)')
  await application.getByRole('button', { name: 'Accept' }).click()
  await expect(toast(page, 'Amani is accepted')).toBeVisible()
  await expect(application).toHaveCount(0)

  // …and places the child with the suggested route and bus.
  await openPage(page, 'Routes & assignment')
  const group = page
    .locator('li, article', { hasText: 'Amani Mwangi' })
    .filter({
      has: page.getByRole('button', { name: 'Approve' }),
    })
  await group.last().getByRole('button', { name: 'Approve' }).click()
  await expect(toast(page, 'are on')).toBeVisible()

  // The student list now shows them on a bus.
  await openPage(page, 'Students')
  await page.getByRole('searchbox').fill('Amani')
  const row = page.locator('tr', { hasText: 'Amani Mwangi' })
  await expect(row).toContainText(/Bus \d\d/)
  await logOut(page)

  // The parent sees the bus and the pickup time.
  await fillLogIn(page, 'parent')
  await openPage(page, 'Children')
  // The smallest box holding both Amani's name and the bus times: the card.
  const card = page
    .locator('div', {
      has: page.getByRole('heading', { name: 'Amani Mwangi' }),
    })
    .filter({ hasText: 'Bus times' })
    .last()
  await expect(card).toContainText('06:00 pickup · 15:45 drop-off')
  await expect(page.getByText(/Application sent/)).toHaveCount(0)
})

test('the office declines an application with a reason, then reconsiders', async ({
  page,
}) => {
  await logIn(page, 'admin')
  await openPage(page, 'New applications')
  const first = page.locator('article').first()
  const name = (await first.locator('h3, h2, p').first().innerText()).trim()

  await first.getByRole('button', { name: 'Decline' }).click()
  await page.getByRole('button', { name: 'Decline application' }).click()
  await expect(page.locator('#decline-error')).toBeVisible()
  await page
    .getByRole('button', { name: 'Our buses near you are full this term.' })
    .click()
  await page.getByRole('button', { name: 'Decline application' }).click()
  await expect(toast(page, 'declined')).toBeVisible()

  await page.getByRole('button', { name: 'Reconsider' }).first().click()
  await expect(page.locator('article', { hasText: name }).first()).toBeVisible()
})
