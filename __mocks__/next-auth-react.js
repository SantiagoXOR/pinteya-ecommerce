/**
 * Mock centralizado para next-auth/react
 * Usado en tests para evitar problemas de módulos ES6
 */

const mockUseSession = jest.fn(() => ({
  data: null,
  status: 'unauthenticated',
}))

const mockSignIn = jest.fn(() => Promise.resolve())
const mockSignOut = jest.fn(() => Promise.resolve())
const mockGetProviders = jest.fn(() => Promise.resolve({}))

module.exports = {
  useSession: mockUseSession,
  signIn: mockSignIn,
  signOut: mockSignOut,
  getProviders: mockGetProviders,

  // Helpers para tests
  __setMockSession: session => {
    mockUseSession.mockReturnValue(session)
  },

  __resetMocks: () => {
    mockUseSession.mockReset()
    mockSignIn.mockReset()
    mockSignOut.mockReset()
    mockGetProviders.mockReset()

    // Restaurar valores por defecto
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
  },
}
