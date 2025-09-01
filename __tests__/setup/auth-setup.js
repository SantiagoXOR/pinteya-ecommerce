/**
 * Setup específico para autenticación en tests
 * Resuelve problemas de importación de NextAuth y Google Provider
 */

// Mock NextAuth antes de cualquier importación
jest.mock('next-auth', () => {
  const mockAuth = jest.fn(() => Promise.resolve(null));
  const mockSignIn = jest.fn();
  const mockSignOut = jest.fn();
  const mockHandlers = {
    GET: jest.fn(),
    POST: jest.fn(),
  };

  const mockNextAuth = jest.fn(() => ({
    handlers: mockHandlers,
    auth: mockAuth,
    signIn: mockSignIn,
    signOut: mockSignOut,
  }));

  return {
    __esModule: true,
    default: mockNextAuth,
    auth: mockAuth,
    signIn: mockSignIn,
    signOut: mockSignOut,
    handlers: mockHandlers,
  };
});

// Mock Google Provider antes de cualquier importación
jest.mock('next-auth/providers/google', () => {
  const mockGoogleProvider = jest.fn((config) => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
    clientId: config?.clientId || 'mock-google-client-id',
    clientSecret: config?.clientSecret || 'mock-google-client-secret',
    authorization: {
      url: 'https://accounts.google.com/oauth/authorize',
      params: {
        scope: 'openid email profile',
        response_type: 'code',
      },
    },
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
    profile: jest.fn((profile) => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    })),
  }));

  return {
    __esModule: true,
    default: mockGoogleProvider,
  };
});

// Mock del archivo auth.ts completo
jest.mock('@/auth', () => {
  const mockAuth = jest.fn(() => Promise.resolve(null));
  const mockSignIn = jest.fn();
  const mockSignOut = jest.fn();
  const mockHandlers = {
    GET: jest.fn(),
    POST: jest.fn(),
  };

  return {
    __esModule: true,
    auth: mockAuth,
    signIn: mockSignIn,
    signOut: mockSignOut,
    handlers: mockHandlers,
    default: {
      auth: mockAuth,
      signIn: mockSignIn,
      signOut: mockSignOut,
      handlers: mockHandlers,
    },
  };
});
