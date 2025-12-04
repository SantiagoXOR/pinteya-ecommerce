/**
 * Mock de Google Analytics para tests
 */

export const mockTrackEvent = jest.fn()

// Mock del módulo completo
jest.mock('@/lib/google-analytics', () => ({
  trackEvent: mockTrackEvent,
}))

export const resetAnalyticsMock = () => {
  mockTrackEvent.mockClear()
}

export const getAnalyticsCallsFor = (eventName: string) => {
  return mockTrackEvent.mock.calls.filter(call => call[0] === eventName)
}

