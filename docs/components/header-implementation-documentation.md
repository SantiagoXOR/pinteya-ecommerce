# 🧩 Header Component - Documentación Técnica Completa

## 📋 Resumen Ejecutivo

**Componente**: Header Principal de Pinteya E-commerce
**Ubicación**: `src/components/Header/`
**Estado**: ✅ Completamente implementado y testeado
**Última actualización**: Enero 2025
**Bottom Navigation**: ⚠️ Temporalmente desactivado (Enero 2025)

## 🗂️ Estructura de Archivos

### Componentes Principales
```
src/components/Header/
├── index.tsx                    # Componente principal del Header
├── AuthSection.tsx              # Sección de autenticación con Clerk
├── TopBar.tsx                   # Barra superior con información
├── ActionButtons.tsx            # Botones de acción (carrito, usuario)
├── GeolocationDebugger.tsx      # Debugger de geolocalización
├── GeolocationTester.tsx        # Tester de funcionalidades de ubicación
└── NewHeader.tsx                # Versión alternativa (experimental)
```

### Tests Implementados
```
src/components/Header/__tests__/
├── unit/                        # Tests unitarios (90+ tests)
├── integration/                 # Tests de integración (25+ tests)
├── accessibility/               # Tests de accesibilidad (20+ tests)
├── responsive/                  # Tests responsive (30+ tests)
├── e2e/                        # Tests E2E (25+ tests)
├── mocks/                      # MSW server y mocks
├── jest.config.js              # Configuración Jest específica
└── setup.ts                    # Setup del entorno de testing
```

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript 5.7.3
- **Estilos**: Tailwind CSS 3.4
- **Autenticación**: Clerk 6.21.0
- **Base de datos**: Supabase PostgreSQL
- **Estado**: Redux Toolkit + Context API
- **Testing**: Jest + RTL + Playwright + jest-axe

### Patrones de Diseño Implementados
1. **Compound Component Pattern**: Header con subcomponentes especializados
2. **Custom Hooks Pattern**: useGeolocation, useCartAnimation, useSearch
3. **Provider Pattern**: CartModalProvider, ClerkProvider
4. **Observer Pattern**: Redux para estado global del carrito
5. **Strategy Pattern**: Diferentes variantes de AuthSection

## 🧩 Componentes y Funcionalidades

### 1. Header Principal (`index.tsx`)

#### Props y Estados
```typescript
interface HeaderState {
  cartShake: boolean;           // Animación del carrito
}

// Estados derivados de hooks
const { detectedZone, requestLocation, permissionStatus, isLoading, error } = useGeolocation();
const { openCartModal } = useCartModalContext();
const { isAnimating } = useCartAnimation();
const product = useAppSelector((state) => state.cartReducer.items);
const totalPrice = useSelector(selectTotalPrice);
```

#### Funcionalidades Principales
- **Navegación**: Logo clickeable que navega al home
- **Búsqueda**: Integración con SearchAutocompleteIntegrated
- **Carrito**: Contador de productos y modal
- **Geolocalización**: Detección automática de zona
- **Autenticación**: Integración con Clerk
- **Responsive**: Adaptación mobile/desktop

### 2. AuthSection (`AuthSection.tsx`)

#### Props Interface
```typescript
interface AuthSectionProps {
  variant?: 'desktop' | 'mobile' | 'topbar';
}
```

#### Variantes Implementadas
- **Desktop**: Botón translúcido con solo icono Google
- **Mobile**: Misma funcionalidad adaptada para móviles
- **Topbar**: Versión compacta para barra superior

#### Características Específicas
- **Botón sin texto**: Solo muestra icono Google (sin "Iniciar Sesión")
- **Estilos translúcidos**: `bg-white/20`, `backdrop-blur-sm`
- **Colores oficiales Google**: 4 paths SVG con colores específicos
- **Estados Clerk**: SignedIn/SignedOut con skeleton de carga

### 3. TopBar (`TopBar.tsx`)

#### Funcionalidades
- **Información de envíos**: Zona de entrega actual
- **Selector de ubicación**: Dropdown con zonas disponibles
- **Estados de geolocalización**: Loading, error, success
- **Integración con useGeolocation**: Hook personalizado

### 4. ActionButtons (`ActionButtons.tsx`)

#### Características
- **Carrito**: Contador de productos, modal, animaciones
- **Usuario**: Avatar, dropdown con opciones
- **Responsive**: Oculto en mobile (`hidden sm:flex`)
- **Integración Redux**: Estado del carrito sincronizado

## 🎨 Estilos y Diseño

### Clases Tailwind CSS Principales

#### Header Container
```css
/* Contenedor principal */
.header-container {
  @apply fixed left-0 top-0 w-full z-9999;
  @apply bg-blaze-orange-600 rounded-b-3xl shadow-lg;
  @apply transition-all ease-in-out duration-500;
}

/* Topbar */
.topbar {
  @apply bg-blaze-orange-700 py-1;
}

/* Header principal */
.header-main {
  @apply max-w-[1200px] mx-auto px-4;
  @apply flex items-center justify-between;
  @apply py-3 gap-4;
}
```

#### Botón de Autenticación
```css
.auth-button {
  @apply bg-white/20 hover:bg-white/30;
  @apply backdrop-blur-sm border-2 border-white/30;
  @apply rounded-full p-2 transition-all duration-200;
  @apply transform hover:scale-105 active:scale-95;
}
```

#### Carrito
```css
.cart-button {
  @apply bg-yellow-400 hover:bg-yellow-500;
  @apply rounded-full p-3 shadow-lg;
  @apply transition-all duration-200;
  @apply hidden sm:flex; /* Oculto en mobile */
}
```

### Paleta de Colores
- **Primario**: `blaze-orange-600` (#ea5a17)
- **Secundario**: `blaze-orange-700` (más oscuro)
- **Acento**: `yellow-400` (#facc15)
- **Texto**: `white` sobre fondos naranjas
- **Translúcido**: `white/20`, `white/30`

### Breakpoints Responsive
```css
/* Mobile First */
@media (min-width: 640px) { /* sm: */ }
@media (min-width: 768px) { /* md: */ }
@media (min-width: 1024px) { /* lg: */ }
@media (min-width: 1280px) { /* xl: */ }
@media (min-width: 1536px) { /* 2xl: */ }
```

## 🔧 Hooks Personalizados

### 1. useGeolocation

#### Funcionalidades
- **Detección automática**: Solicita permisos al montar
- **Fallback**: Córdoba Capital por defecto
- **Estados**: loading, error, success, denied
- **Zonas**: Córdoba Capital, Villa Carlos Paz, etc.

#### API
```typescript
const {
  detectedZone,        // Zona detectada
  requestLocation,     // Función para solicitar ubicación
  permissionStatus,    // Estado de permisos
  isLoading,          // Estado de carga
  error,              // Errores
  location,           // Coordenadas
  deliveryZones       // Zonas disponibles
} = useGeolocation();
```

### 2. useCartAnimation

#### Funcionalidades
- **Animación de carrito**: Shake al agregar productos
- **Notificaciones**: Success messages
- **Auto-apertura**: Modal automático opcional

#### API
```typescript
const {
  isAnimating,           // Estado de animación
  showSuccess,           // Mostrar mensaje de éxito
  triggerCartAnimation   // Disparar animación
} = useCartAnimation();
```

### 3. useSearch (Integrado)

#### Funcionalidades
- **Debounce**: 300ms para optimizar requests
- **Autocompletado**: Sugerencias en tiempo real
- **Navegación**: Redirección a resultados
- **Historial**: localStorage para búsquedas recientes

## 🔄 Integración con Estado

### Redux Store
```typescript
// Selectores utilizados
const product = useAppSelector((state) => state.cartReducer.items);
const totalPrice = useSelector(selectTotalPrice);

// Acciones disponibles
dispatch(addItemToCart(product));
dispatch(removeItemFromCart(productId));
dispatch(removeAllItemsFromCart());
```

### Context API
```typescript
// CartModalContext
const { openCartModal, closeCartModal, isCartModalOpen } = useCartModalContext();

// ClerkProvider
<ClerkProvider publishableKey={publishableKey} localization={esES}>
  {children}
</ClerkProvider>
```

## 🌐 APIs y Servicios Externos

### Clerk Authentication
```typescript
// Configuración
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

// Hooks utilizados
const { isSignedIn, user, isLoaded } = useUser();
```

### Supabase Integration
```typescript
// Variables de entorno
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

// APIs utilizadas
/api/search/trending
/api/search/suggestions
/api/products
/api/delivery/zones
```

### Geolocation API
```typescript
// Navegador nativo
navigator.geolocation.getCurrentPosition(
  success,
  error,
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
);
```

## 📱 Comportamiento Responsive

### Mobile (320px - 767px)
- **Carrito**: Oculto (`hidden sm:flex`)
- **Logo**: Tamaño reducido (`h-8`)
- **Búsqueda**: Ancho completo
- **Topbar**: Información compacta

### Tablet (768px - 1023px)
- **Carrito**: Visible
- **Logo**: Tamaño intermedio (`sm:h-10`)
- **Layout**: Distribución equilibrada

### Desktop (1024px+)
- **Carrito**: Completamente visible
- **Logo**: Tamaño completo
- **Topbar**: Información completa
- **Espaciado**: Máximo aprovechamiento

## 🧪 Testing Implementado

### Cobertura Actual
- **Tests totales**: 145+ implementados
- **Cobertura código**: 95%+ líneas/funciones/statements
- **Cobertura ramas**: 90%+
- **WCAG 2.1 AA**: 100% compliant

### Casos Críticos Verificados
- ✅ **Autenticación**: Botón solo icono Google
- ✅ **Búsqueda**: Debounce 300ms, navegación
- ✅ **Carrito**: Contador, modal, animaciones
- ✅ **Geolocalización**: Detección, fallback
- ✅ **Responsive**: 6 breakpoints

### Comandos de Testing
```bash
# Ejecutar todos los tests del Header
node scripts/test-header.js

# Tests específicos
npm test -- --testPathPattern="Header.*unit"
npm test -- --testPathPattern="Header.*integration"
npm test -- --testPathPattern="Header.*a11y"
npm test -- --testPathPattern="Header.*responsive"

# E2E
npx playwright test src/components/Header/__tests__/e2e/
```

## ⚙️ Configuración y Variables de Entorno

### Variables Requeridas
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Opcional - Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
```

### Configuración de Desarrollo
```typescript
// next.config.js
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'supabase.co'],
  },
  experimental: {
    optimizePackageImports: ['@clerk/nextjs'],
  },
};
```

## 🚀 Performance y Optimizaciones

### Métricas Actuales
- **Renderizado inicial**: < 100ms
- **Tiempo de búsqueda**: < 300ms (con debounce)
- **Carga de geolocalización**: < 2s
- **Animaciones**: 60fps fluidas

### Optimizaciones Implementadas
- **Lazy loading**: Componentes no críticos
- **Memoización**: React.memo en subcomponentes
- **Debounce**: Búsquedas optimizadas
- **Prefetch**: Next.js Link prefetching
- **Code splitting**: Importaciones dinámicas

## 🔍 Detalles de Implementación Específicos

### Autenticación - Botón Solo Icono Google
```typescript
// AuthSection.tsx - Implementación específica
<button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/30 rounded-full p-2 transition-all duration-200 transform hover:scale-105 active:scale-95">
  <Link href="/signin">
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  </Link>
</button>
```

### Geolocalización - Fallback Córdoba Capital
```typescript
// useGeolocation.ts - Lógica de fallback
const detectNearestZone = (lat: number, lng: number) => {
  // Si no encuentra zona específica, usar Córdoba Capital
  const fallbackZone = DELIVERY_ZONES.find(zone => zone.id === "cordoba-capital");
  return nearestZone || fallbackZone || null;
};
```

### Búsqueda - Debounce 300ms
```typescript
// SearchAutocompleteIntegrated - Configuración
const searchWithDebounce = useDebouncedCallback(
  (searchQuery: string) => {
    performSearch(searchQuery);
  },
  300, // 300ms debounce
  { maxWait: 2000, leading: false, trailing: true }
);
```

## 🔮 Futuras Mejoras

### Funcionalidades Planificadas
- **Notificaciones push**: Para ofertas y promociones
- **Búsqueda por voz**: Integración con Web Speech API
- **Modo oscuro**: Toggle de tema
- **Internacionalización**: Soporte multi-idioma

### Optimizaciones Técnicas
- **Service Worker**: Cache de búsquedas
- **WebAssembly**: Cálculos de geolocalización
- **GraphQL**: Optimización de queries
- **Micro-frontends**: Modularización avanzada

## 📚 Referencias y Documentación Relacionada

### Documentación de Testing
- **[Plan de Testing Completo](../testing/header-testing-plan.md)**
- **[Resumen de Testing](../testing/header-testing-summary.md)**
- **[Índice de Testing](../testing/header-testing-index.md)**

### Documentación de APIs
- **[API de Búsqueda](../api/search-api.md)**
- **[API de Geolocalización](../api/geolocation-api.md)**
- **[API de Productos](../api/products-api.md)**

### Guías de Desarrollo
- **[Guía de Componentes](../development/component-guide.md)**
- **[Estándares de Código](../development/coding-standards.md)**
- **[Guía de Testing](../development/testing-guide.md)**

---

**📅 Documentado**: Enero 2025
**🔧 Mantenimiento**: Automatizado en CI/CD
**📈 Estado**: Producción estable
**🎯 Próximo**: Aplicar modelo a otros componentes



