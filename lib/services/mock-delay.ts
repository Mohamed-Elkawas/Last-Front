/** Simulates network latency; remove when wiring real `fetch`. */
export function mockDelay(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
