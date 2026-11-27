import { defineConfig, devices } from '@playwright/test'

// End-to-end tests: the main journeys, clicked through in a real browser
// (e2e/*.spec.js). They run against a production build served by
// `vite preview`, with the mock server answering until VITE_API_URL points
// at Flask; then the same tests check the real API.
//
//   npm run test:e2e           all journeys, phone and desktop
//   npm run test:e2e -- --ui   watch them run, step by step
const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // The sample clock and the screens are in Nairobi time.
    timezoneId: 'Africa/Nairobi',
    locale: 'en-KE',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Parents and drivers use phones; the office uses a computer.
    {
      name: 'phone',
      use: { ...devices['Pixel 7'] },
      testIgnore: /office-/,
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
