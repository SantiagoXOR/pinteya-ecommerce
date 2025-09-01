/**
 * Mock para @/auth - Funciones de autenticación enterprise
 * Usado en tests para simular autenticación NextAuth
 */

const mockAuth = jest.fn(() => Promise.resolve(null));
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockHandlers = {
  GET: jest.fn(),
  POST: jest.fn(),
};

module.exports = {
  auth: mockAuth,
  signIn: mockSignIn,
  signOut: mockSignOut,
  handlers: mockHandlers,

  // Helpers para configurar mocks en tests
  __setMockAuth: (authResult) => {
    mockAuth.mockResolvedValue(authResult);
  },

  __resetMocks: () => {
    mockAuth.mockReset();
    mockAuth.mockResolvedValue(null);
    mockSignIn.mockReset();
    mockSignOut.mockReset();
  }
};

// Para compatibilidad con ES modules
module.exports.__esModule = true;
module.exports.default = module.exports;
