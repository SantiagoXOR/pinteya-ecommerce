# 🛠️ EJEMPLOS DE IMPLEMENTACIÓN - CORRECCIONES CLERK & SUPABASE

## 📋 ÍNDICE DE CORRECCIONES

1. [🛡️ Middleware Modernizado](#middleware-modernizado)
2. [🗄️ Supabase SSR](#supabase-ssr)
3. [🎣 Hooks de Autenticación](#hooks-de-autenticación)
4. [⚙️ Configuración Unificada](#configuración-unificada)
5. [🧪 Tests Corregidos](#tests-corregidos)

---

## 🛡️ MIDDLEWARE MODERNIZADO

### **Archivo: `src/middleware.ts` (REEMPLAZAR COMPLETAMENTE)**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Definir rutas con patrones oficiales
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isPublicRoute = createRouteMatcher([
  '/',
  '/shop(.*)',
  '/search(.*)',
  '/product(.*)',
  '/category(.*)',
  '/about',
  '/contact',
  '/signin(.*)',
  '/signup(.*)',
  '/sso-callback(.*)',
  // APIs públicas
  '/api/products(.*)',
  '/api/categories(.*)',
  '/api/payments/webhook',
  '/api/auth/webhook',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Proteger rutas admin con verificación automática de roles
  if (isAdminRoute(req)) {
    await auth.protect({ role: 'admin' })
  }
  
  // Proteger otras rutas autenticadas
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Patrón oficial simplificado
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**Beneficios:**
- ✅ **90% menos código** - De 277 líneas a 25 líneas
- ✅ **Performance mejorada** - Sin doble verificación
- ✅ **Patrón oficial** - Siguiendo documentación de Clerk v5
- ✅ **Mantenibilidad** - Código estándar y limpio

---

## 🗄️ SUPABASE SSR

### **1. Instalar Dependencia**
```bash
npm install @supabase/ssr
```

### **2. Cliente Server: `utils/supabase/server.ts` (NUEVO ARCHIVO)**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### **3. Cliente Browser: `utils/supabase/client.ts` (NUEVO ARCHIVO)**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### **4. Middleware Supabase: `utils/supabase/middleware.ts` (NUEVO ARCHIVO)**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No remover auth.getUser()
  const { data: { user } } = await supabase.auth.getUser()

  return supabaseResponse
}
```

### **5. Integrar en Middleware Principal: `src/middleware.ts` (ACTUALIZAR)**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { updateSession } from '@/utils/supabase/middleware'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isPublicRoute = createRouteMatcher([
  '/', '/shop(.*)', '/signin(.*)', '/signup(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Actualizar sesión de Supabase
  await updateSession(req)
  
  // Proteger rutas con Clerk
  if (isAdminRoute(req)) {
    await auth.protect({ role: 'admin' })
  }
  
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

---

## 🎣 HOOKS DE AUTENTICACIÓN

### **Hook Moderno: `src/hooks/useAuthWithRoles.ts` (NUEVO ARCHIVO)**

```typescript
'use client'

import { useAuth, useUser } from '@clerk/nextjs'

export interface AuthWithRoles {
  // Estado básico
  userId: string | null
  user: any
  isLoaded: boolean
  
  // Roles y permisos
  isAdmin: boolean
  isModerator: boolean
  isCustomer: boolean
  
  // Permisos específicos
  canManageProducts: boolean
  canManageOrders: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  canAccessAdminPanel: boolean
  
  // Métodos de verificación
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
}

export function useAuthWithRoles(): AuthWithRoles {
  const { userId, has, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  
  const isLoaded = authLoaded && userLoaded
  
  // Verificaciones automáticas con Clerk
  const isAdmin = has({ role: 'admin' })
  const isModerator = has({ role: 'moderator' })
  const isCustomer = has({ role: 'customer' })
  
  // Permisos específicos
  const canManageProducts = has({ permission: 'products:manage' })
  const canManageOrders = has({ permission: 'orders:manage' })
  const canManageUsers = has({ permission: 'users:manage' })
  const canViewAnalytics = has({ permission: 'analytics:view' })
  const canAccessAdminPanel = isAdmin || isModerator
  
  // Métodos de verificación
  const hasRole = (role: string) => has({ role })
  const hasPermission = (permission: string) => has({ permission })
  const hasAnyPermission = (permissions: string[]) => 
    permissions.some(permission => has({ permission }))
  
  return {
    userId,
    user,
    isLoaded,
    isAdmin,
    isModerator,
    isCustomer,
    canManageProducts,
    canManageOrders,
    canManageUsers,
    canViewAnalytics,
    canAccessAdminPanel,
    hasRole,
    hasPermission,
    hasAnyPermission,
  }
}
```

### **Migración de useUserRole: `src/hooks/useUserRole.ts` (ACTUALIZAR)**

```typescript
'use client'

import { useAuthWithRoles } from './useAuthWithRoles'

/**
 * @deprecated Use useAuthWithRoles instead
 * Hook de compatibilidad para migración gradual
 */
export function useUserRole() {
  const auth = useAuthWithRoles()
  
  // Mapear a la interfaz anterior para compatibilidad
  return {
    userProfile: auth.user ? {
      id: auth.userId,
      clerk_user_id: auth.userId,
      email: auth.user.emailAddresses?.[0]?.emailAddress,
      role_id: auth.isAdmin ? 'admin' : 'customer',
      is_active: true,
      user_roles: {
        role_name: auth.isAdmin ? 'admin' : 'customer',
        description: '',
        permissions: {},
      }
    } : null,
    role: auth.isAdmin ? { role_name: 'admin', description: '', permissions: {} } : null,
    isLoading: !auth.isLoaded,
    error: null,
    hasPermission: (permission: string[]) => auth.hasPermission(permission.join(':')),
    hasAnyPermission: (permissions: string[][]) => 
      permissions.some(p => auth.hasPermission(p.join(':'))),
    hasAllPermissions: (permissions: string[][]) => 
      permissions.every(p => auth.hasPermission(p.join(':'))),
    canAccessAdminPanel: auth.canAccessAdminPanel,
    canManageProducts: auth.canManageProducts,
    canManageOrders: auth.canManageOrders,
    canManageUsers: auth.canManageUsers,
    canViewAnalytics: auth.canViewAnalytics,
    isAdmin: auth.isAdmin,
    isCustomer: auth.isCustomer,
    isModerator: auth.isModerator,
    syncUser: async () => {}, // No-op para compatibilidad
    refetch: async () => {}, // No-op para compatibilidad
  }
}
```

---

## ⚙️ CONFIGURACIÓN UNIFICADA

### **Provider Principal: `src/app/providers.tsx` (ACTUALIZAR)**

```typescript
"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { esES } from "@clerk/localizations"

// Otros providers...
import { ModalProvider } from "./context/QuickViewModalContext"
import { CartModalProvider } from "./context/CartSidebarModalContext"
import { ReduxProvider } from "@/redux/provider"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error('Missing Publishable Key')
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={esES}
      // ✅ URLs unificadas
      signInFallbackRedirectUrl="/admin"
      signUpFallbackRedirectUrl="/admin"
      afterSignOutUrl="/"
      // ✅ Configuración visual unificada
      appearance={{
        variables: {
          colorPrimary: '#eb6313', // blaze-orange-600
          colorBackground: '#fef7ee', // blaze-orange-50
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: "bg-blaze-orange-600 hover:bg-blaze-orange-700 text-sm normal-case font-medium",
          card: "shadow-xl border border-blaze-orange-200",
          headerTitle: "text-2xl font-bold text-gray-900",
          headerSubtitle: "text-gray-600",
        }
      }}
    >
      <ReduxProvider>
        <ModalProvider>
          <CartModalProvider>
            {children}
          </CartModalProvider>
        </ModalProvider>
      </ReduxProvider>
    </ClerkProvider>
  )
}
```

### **Eliminar Providers Duplicados:**

```bash
# Archivos a eliminar (configuraciones duplicadas)
rm src/components/providers/ClerkProviderSSG.tsx
rm src/components/providers/ClerkProviderWrapper.tsx
```

---

## 🧪 TESTS CORREGIDOS

### **Mock de Clerk: `src/__tests__/__mocks__/clerk.ts` (NUEVO ARCHIVO)**

```typescript
// Mock moderno de Clerk para tests
export const mockAuth = {
  userId: 'user_test_123',
  has: jest.fn((check: { role?: string; permission?: string }) => {
    if (check.role === 'admin') return true
    if (check.permission?.includes('manage')) return true
    return false
  }),
  protect: jest.fn(),
}

export const mockUser = {
  id: 'user_test_123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  publicMetadata: { role: 'admin' },
}

// Mocks para hooks de Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    ...mockAuth,
    isLoaded: true,
  }),
  useUser: () => ({
    user: mockUser,
    isLoaded: true,
  }),
  clerkMiddleware: (fn: any) => fn,
  createRouteMatcher: (routes: string[]) => (req: any) => 
    routes.some(route => req.nextUrl?.pathname?.match(route)),
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => Promise.resolve(mockAuth),
  currentUser: () => Promise.resolve(mockUser),
  clerkMiddleware: (fn: any) => fn,
  createRouteMatcher: (routes: string[]) => (req: any) => 
    routes.some(route => req.nextUrl?.pathname?.match(route)),
}))
```

### **Test Corregido: `src/hooks/__tests__/useAuthWithRoles.test.ts` (NUEVO ARCHIVO)**

```typescript
import { renderHook } from '@testing-library/react'
import { useAuthWithRoles } from '../useAuthWithRoles'

// Importar mocks
import '../__tests__/__mocks__/clerk'

describe('useAuthWithRoles', () => {
  it('should return admin permissions', () => {
    const { result } = renderHook(() => useAuthWithRoles())
    
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.canManageProducts).toBe(true)
    expect(result.current.canAccessAdminPanel).toBe(true)
    expect(result.current.isLoaded).toBe(true)
  })
  
  it('should verify roles correctly', () => {
    const { result } = renderHook(() => useAuthWithRoles())
    
    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasPermission('products:manage')).toBe(true)
    expect(result.current.hasAnyPermission(['products:manage', 'orders:view'])).toBe(true)
  })
})
```

---

## 🚀 SCRIPT DE MIGRACIÓN

### **Script: `scripts/migrate-auth-system.js` (NUEVO ARCHIVO)**

```javascript
#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔄 Iniciando migración del sistema de autenticación...\n')

// 1. Backup del middleware actual
console.log('📋 1. Creando backup del middleware actual...')
const middlewarePath = 'src/middleware.ts'
const backupPath = `src/middleware.ts.backup.${Date.now()}`

if (fs.existsSync(middlewarePath)) {
  fs.copyFileSync(middlewarePath, backupPath)
  console.log(`✅ Backup creado: ${backupPath}`)
}

// 2. Instalar dependencias
console.log('\n📦 2. Instalando dependencias...')
const { execSync } = require('child_process')

try {
  execSync('npm install @supabase/ssr', { stdio: 'inherit' })
  console.log('✅ @supabase/ssr instalado')
} catch (error) {
  console.error('❌ Error instalando dependencias:', error.message)
  process.exit(1)
}

// 3. Crear directorios necesarios
console.log('\n📁 3. Creando estructura de directorios...')
const dirs = [
  'utils/supabase',
  'src/hooks',
  'docs/audit'
]

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`✅ Directorio creado: ${dir}`)
  }
})

// 4. Verificar archivos críticos
console.log('\n🔍 4. Verificando archivos críticos...')
const criticalFiles = [
  'src/middleware.ts',
  'src/hooks/useUserRole.ts',
  'src/app/providers.tsx'
]

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Encontrado: ${file}`)
  } else {
    console.log(`⚠️  No encontrado: ${file}`)
  }
})

console.log('\n🎉 Migración preparada. Próximos pasos:')
console.log('1. Implementar nuevo middleware (ver IMPLEMENTATION_EXAMPLES_2025.md)')
console.log('2. Crear clientes Supabase SSR')
console.log('3. Actualizar hooks de autenticación')
console.log('4. Ejecutar tests: npm run test:hooks')
console.log('5. Validar en desarrollo: npm run dev')
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1 - Middleware (CRÍTICO)**
- [ ] Backup del middleware actual
- [ ] Implementar nuevo middleware simplificado
- [ ] Probar rutas admin y públicas
- [ ] Verificar redirecciones automáticas

### **Fase 2 - Supabase SSR (ALTA)**
- [ ] Instalar `@supabase/ssr`
- [ ] Crear cliente server
- [ ] Crear cliente browser
- [ ] Implementar middleware Supabase
- [ ] Integrar con middleware Clerk

### **Fase 3 - Hooks (ALTA)**
- [ ] Crear `useAuthWithRoles`
- [ ] Migrar `useUserRole` (compatibilidad)
- [ ] Actualizar componentes que usan hooks
- [ ] Corregir tests fallidos

### **Fase 4 - Configuración (MEDIA)**
- [ ] Unificar providers de Clerk
- [ ] Eliminar archivos duplicados
- [ ] Estandarizar URLs de redirección
- [ ] Actualizar documentación

---

**Próximo paso:** Implementar Fase 1 (Middleware) inmediatamente para resolver problemas críticos.
