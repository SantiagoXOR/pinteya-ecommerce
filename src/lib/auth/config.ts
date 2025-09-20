// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// Re-exportar auth con configuración de runtime
export { auth, signIn, signOut, handlers } from '@/auth';