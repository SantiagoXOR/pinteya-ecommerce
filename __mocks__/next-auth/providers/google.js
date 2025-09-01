/**
 * Mock para next-auth/providers/google
 * Resuelve el error "TypeError: (0 , _google.default) is not a function"
 */

// Crear función que funcione correctamente
function mockGoogleProvider(config) {
  return {
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
  };
}

// Convertir a jest mock function
const mockGoogleProviderJest = jest.fn(mockGoogleProvider);

// Exportar como default y named export
module.exports = mockGoogleProviderJest;
module.exports.default = mockGoogleProviderJest;

// Para compatibilidad con ES modules
module.exports.__esModule = true;

// Exportar también como GoogleProvider para la nueva importación
module.exports.GoogleProvider = mockGoogleProviderJest;

// Compatibilidad adicional para diferentes formas de importación
Object.defineProperty(module.exports, 'default', {
  value: mockGoogleProviderJest,
  enumerable: true,
  configurable: true
});
