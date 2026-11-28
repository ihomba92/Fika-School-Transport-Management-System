import { expect, test } from '@playwright/test'
import { logIn, toast } from './helpers'

// The driver's day on Bus 03. The sample clock opens at 06:52, in the middle
// of the senior pickup: six of nine students are already marked, and Brian
// was marked absent at his stop.

// The trip page's "6 of 9 marked", as numbers.
async function progress(page) {
  const text = await page
    .getByText(/\d+ of \d+ marked/i)
    .first()
    .innerText()
  const [, done, total] = text.match(/(\d+) of (\d+)/i)
  return { done: Number(done), total: Number(total) }
}

// Marks students with `label` until the whole trip is marked. Before each
// click, `pick(page)` may mark someone else instead (and return true).
async function markEveryone(page, label, pick = async () => false) {
  await expect(page.getByText(/\d+ of \d+ marked/i).first()).toBeVisible()
  for (let i = 0; i < 40; i += 1) {
    const before = await progress(page)
    if (before.done === before.total) return
    if (!(await pick(page))) {
      await page
        .getByRole('button', { name: label, exact: true })
        .first()
        .click()
    }
    await expect
      .poll(async () => (await progress(page)).done)
      .toBeGreaterThan(before.done)
  }
  throw new Error(`Could not mark everyone ${label}`)
}

async function endTrip(page) {
  await page.getByRole('button', { name: 'End trip' }).click()
  await page.getByRole('button', { name: 'End trip' }).last().click()
  await expect(page).toHaveURL(/\/driver$/)
}

test('a pickup: mark everyone, then end the trip', async ({ page }) => {
  await logIn(page, 'driver')
  await expect(page.getByText(/senior pickup is running/)).toBeVisible()

  await page.getByRole('link', { name: 'Continue senior pickup' }).click()
  await expect(page).toHaveURL(/\/driver\/trip$/)
  await markEveryone(page, 'Picked up')
  await endTrip(page)

  await expect(page.getByText(/junior pickup starts at 08:00/)).toBeVisible()
})

test('absent at pickup stays absent through boarding and drop-off', async ({
  page,
}) => {
  await logIn(page, 'driver')

  // Finish the senior pickup, then do the junior pickup with Liam absent.
  await page.getByRole('link', { name: 'Continue senior pickup' }).click()
  await markEveryone(page, 'Picked up')
  await endTrip(page)

  await page.getByRole('button', { name: 'Start junior pickup' }).click()
  await expect(page).toHaveURL(/\/driver\/trip$/)
  await markEveryone(page, 'Picked up', async () => {
    const liam = page
      .locator('li', { hasText: 'Liam Karanja' })
      .getByRole('button', { name: 'Absent', exact: true })
    if ((await liam.count()) === 0) return false
    await liam.click()
    return true
  })
  await endTrip(page)

  // At school, the boarding check already shows Liam as absent.
  await expect(
    page.getByText(/Check the students onto the bus first/),
  ).toBeVisible()
  const boarding = page.locator('#boarding')
  await expect(boarding.locator('article', { hasText: 'Liam' })).toContainText(
    'Absent this morning',
  )

  // The drop-off can't start until everyone expected is checked.
  const onBoard = boarding.getByRole('button', {
    name: 'On board',
    exact: true,
  })
  for (let left = await onBoard.count(); left > 0; left -= 1) {
    await onBoard.first().click()
    await expect(onBoard).toHaveCount(left - 1)
  }
  await expect(boarding.getByRole('status')).toContainText(
    'Everyone is checked',
  )

  await page.locator('section').first().getByRole('button').click()
  await expect(page).toHaveURL(/\/driver\/trip$/)
  // No "Absent" on a drop-off: who is on the bus was settled at school.
  await expect(
    page.getByRole('button', { name: 'Absent', exact: true }),
  ).toHaveCount(0)
  await markEveryone(page, 'Dropped off')
  await endTrip(page)
})

test('a child not at boarding is reported to the office', async ({ page }) => {
  await logIn(page, 'driver')
  const boarding = page.locator('#boarding')
  await boarding
    .getByRole('button', { name: 'Senior drop-off', exact: true })
    .click()
  await expect(boarding.locator('article', { hasText: 'Brian' })).toContainText(
    'Absent this morning',
  )
  await boarding
    .locator('article', { hasText: 'Sharon' })
    .getByRole('button', { name: 'Not here' })
    .click()
  await expect(toast(page, 'Sharon Chebet is not on the bus')).toContainText(
    'The transport office is told straight away.',
  )
})
