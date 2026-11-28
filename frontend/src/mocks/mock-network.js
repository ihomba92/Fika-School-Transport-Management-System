// Mock services wait a moment before answering, like a real network request,
// so loading states (spinners, disabled buttons) can be seen and tested.
export function simulateNetwork(delayMs = 600) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}
