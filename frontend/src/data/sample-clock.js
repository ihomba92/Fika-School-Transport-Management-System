// The sample data describes one school morning, so the screens match the designs.
// The sample clock starts at that moment and then runs in real time, which lets
// you watch the bus move. When the back end arrives, screens use the real time.
export const SAMPLE_START = new Date('2026-10-13T06:52:00+03:00')

const pageOpenedAt = Date.now()

export function sampleNow() {
  return new Date(SAMPLE_START.getTime() + (Date.now() - pageOpenedAt))
}
