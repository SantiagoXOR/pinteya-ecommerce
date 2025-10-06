// ===================================
// PINTEYA E-COMMERCE - SETUP DE VARIABLES DE ENTORNO PARA JEST
// ===================================

// Variables de entorno para tests
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key'
process.env.ANIMATION_TEST_MODE = 'true'
process.env.PERFORMANCE_TRACKING_ENABLED = 'true'

// Configuración de timeouts para tests de animaciones
jest.setTimeout(10000)

// Silenciar warnings específicos durante tests
const originalWarn = console.warn
console.warn = (...args) => {
  const message = args.join(' ')
  if (
    message.includes('React DevTools') ||
    message.includes('Framer Motion') ||
    message.includes('useLayoutEffect')
  ) {
    return
  }
  originalWarn(...args)
}
