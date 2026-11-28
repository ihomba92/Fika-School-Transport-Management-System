import { expect, test } from '@playwright/test'
import { logIn, openPage, toast } from './helpers'

// M-Pesa: the parent sends the request, Fika waits while they enter their
// PIN on the phone (the mock "answers" after a few seconds), then shows the
// receipt. Baraka owes KES 2,500 in the sample data.

test('a parent pays the balance by M-Pesa', async ({ page }) => {
  await logIn(page, 'parent')
  await openPage(page, 'Payments')
  await page.getByRole('button', { name: 'Pay balance' }).click()

  // More than is owed is refused before anything is sent.
  await page.locator('#amount').fill('3000')
  await page.getByRole('button', { name: 'Send payment request' }).click()
  await expect(page.locator('#amount-error')).toBeVisible()

  await page.locator('#amount').fill('2500')
  await page.getByRole('button', { name: 'Send payment request' }).click()
  await expect(toast(page, 'Check your phone')).toBeVisible()
  await expect(toast(page, 'Payment received')).toContainText(
    'M-Pesa receipt',
    {
      timeout: 15_000,
    },
  )

  // Nothing left to pay, and the receipt is listed.
  await expect(page.getByRole('button', { name: 'Pay balance' })).toHaveCount(0)
  await expect(page.getByLabel(/^Download receipt/).first()).toBeVisible()
})
