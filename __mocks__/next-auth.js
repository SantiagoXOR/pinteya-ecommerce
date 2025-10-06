/**
 * Mock centralizado para next-auth
 * Usado en tests para evitar problemas de módulos ES6
 */

const mockAuth = jest.fn(() => Promise.resolve(null))

// Mock para funciones de autenticación enterprise
const mockGetAuthenticatedUser = jest.fn(() => Promise.resolve(null))
const mockGetAuthenticatedAdmin = jest.fn(() => Promise.resolve(null))

// Mock para NextAuth constructor
const mockNextAuth = jest.fn(() => ({
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
  auth: mockAuth,
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Asegurar que NextAuth funcione como función
const NextAuthMock = function (config) {
  return mockNextAuth(config)
}

// Agregar propiedades necesarias
NextAuthMock.handlers = { GET: jest.fn(), POST: jest.fn() }
NextAuthMock.auth = mockAuth
NextAuthMock.signIn = jest.fn()
NextAuthMock.signOut = jest.fn()

module.exports = NextAuthMock

// Exportar también como default
module.exports.default = NextAuthMock

// Funciones adicionales
module.exports.auth = mockAuth
module.exports.getAuthenticatedUser = mockGetAuthenticatedUser
module.exports.getAuthenticatedAdmin = mockGetAuthenticatedAdmin

// Helpers para tests
module.exports.__setMockAuth = authResult => {
  mockAuth.mockResolvedValue(authResult)
}

module.exports.__setMockAuthenticatedUser = userResult => {
  mockGetAuthenticatedUser.mockResolvedValue(userResult)
}

module.exports.__setMockAuthenticatedAdmin = adminResult => {
  mockGetAuthenticatedAdmin.mockResolvedValue(adminResult)
}

module.exports.__resetMocks = () => {
  mockAuth.mockReset()
  mockGetAuthenticatedUser.mockReset()
  mockGetAuthenticatedAdmin.mockReset()

  // Restaurar valores por defecto
  mockAuth.mockResolvedValue(null)
  mockGetAuthenticatedUser.mockResolvedValue(null)
  mockGetAuthenticatedAdmin.mockResolvedValue(null)
}
