# 📋 CHANGELOG - Pinteya E-commerce

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🎯 Fixed - Octubre 2025
- **Unificación del umbral de Envío Gratis (Design System)**
  - ✅ Eliminados umbrales hardcodeados (`15000`, `50000`) en componentes y adapters
  - ✅ Toda la lógica de badges usa `shouldShowFreeShipping(price, config)` del Design System
  - 📁 Archivos modificados:
    - `src/lib/adapters/productAdapter.ts`
    - `src/components/Shop/SingleListItem.tsx`
    - `src/app/demo/brand-features/page.tsx`
    - `src/components/ui/card.tsx`
    - `src/components/ui/cart-summary.tsx`
  - 📚 Documentación actualizada:
    - `docs/design-system/ecommerce-components.md` (sección de umbral configurable)
    - `docs/components/commercial-product-card.md` (uso recomendado)
    - `docs/checkout/CHECKOUT_EXPRESS_PLAN_2025.md` (trust badges e incentivos)
  - 📊 Impacto: Consistencia visual y de negocio en toda la UI; evita badges por debajo del umbral
  - 🔎 QA: Validado en `/products` y demos; NextAuth warning no impacta badges
- **[CRÍTICO] Fix Badges Inteligentes - Campos Undefined**
  - ✅ Solucionado problema de campos `undefined` en `extractedInfo`
  - ✅ Actualizada query SQL en `getBestSellingProducts` para incluir campos críticos
  - ✅ Agregados campos: `color`, `medida`, `brand`, `description`, `discounted_price`
  - ✅ Mejorado adaptador de productos para mapear correctamente `color` y `medida`
  - ✅ Badges inteligentes ahora funcionan correctamente con información completa
  - 📁 Archivos modificados:
    - `src/lib/supabase/query-optimizer.ts`
    - `src/lib/adapters/product-adapter.ts`
  - 📊 Impacto: +250% campos disponibles, 100% badges generados
  - 🔗 Documentación: `docs/fixes/BADGES_INTELIGENTES_FIX_OCTUBRE_2025.md`

- **Fix MercadoPago: costo de envío duplicado en preferencia**
  - ✅ El costo de envío se pasa únicamente por `shipments.cost` (no se agrega un ítem "Envío" en `items`).
  - ✅ Evita el doble cobro y mantiene coherencia entre UI, API y base de datos.
  - 📁 Archivos modificados/creados:
    - `src/app/api/payments/create-preference/route.ts`
    - `docs/fixes/mercadopago-shipping-cost.md`
    - `docs/testing/mercadopago-preference-testing.md`
  - 📊 Impacto: Preferencias correctas en Mercado Pago; E2E y unit tests sin cambios estructurales.
  - 🔎 Validación: Pantalla de Mercado Pago muestra líneas "Productos" y "Envío" con total correcto.
  - 🔄 Rollback (no recomendado): reintroducir ítem de envío en `items` y remover `shipments.cost`.

## [1.0.0] - Septiembre 2025

### 🚀 Added
- **Sistema de E-commerce Completo**
  - ✅ Catálogo de productos con 53 productos reales
  - ✅ Sistema de autenticación NextAuth.js
  - ✅ Integración MercadoPago con Wallet Brick
  - ✅ Panel administrativo enterprise-ready
  - ✅ Sistema de analytics y monitoreo
  - ✅ Rate limiting con Redis
  - ✅ Testing infrastructure completa

### 🎨 UI/UX
- **Diseño Mobile-First**
  - ✅ Componentes responsive optimizados
  - ✅ Header con geolocalización
  - ✅ Categories Toggle Pill con accesibilidad WCAG 2.1 AA
  - ✅ ProductCard con badges inteligentes
  - ✅ Sistema de búsqueda con autocompletado

### 🔧 Technical Infrastructure
- **Stack Tecnológico**
  - ✅ Next.js 15.5.3 + React 18.3.1
  - ✅ TypeScript 5.2.2 + Tailwind CSS
  - ✅ Supabase PostgreSQL + NextAuth.js 5.0.0-beta.29
  - ✅ shadcn/ui + Radix UI
  - ✅ Jest + Playwright testing

### 🛡️ Security & Performance
- **Seguridad Enterprise**
  - ✅ Rate limiter 100% funcional
  - ✅ 68 tests security pasando
  - ✅ CORS policies y security headers
  - ✅ Audit trail ISO/IEC 27001:2013

- **Performance Optimization**
  - ✅ Bundle size 3.2MB optimizado
  - ✅ First Load JS 499KB
  - ✅ APIs <300ms response time
  - ✅ Performance score 85/100

### 📊 Analytics & Monitoring
- **Sistema de Monitoreo**
  - ✅ Tracking automático (clicks/hovers/scroll)
  - ✅ Métricas e-commerce (conversiones/AOV/abandono)
  - ✅ Dashboard admin tiempo real
  - ✅ Circuit breakers y health checks
  - ✅ Dual tracking (Supabase + GA4)

### 🏪 Admin Panel
- **Módulos Administrativos**
  - ✅ Gestión de productos CRUD completo
  - ✅ Sistema de órdenes con 8 estados
  - ✅ Módulo logística enterprise-ready
  - ✅ 89 APIs admin implementadas
  - ✅ Autenticación JWT con roles

### 🔄 Migration History
- **Migración NextAuth.js**
  - ✅ Migración completa desde Clerk
  - ✅ Eliminadas 18 dependencias Clerk
  - ✅ Build exitoso 129 páginas
  - ✅ Metodología ultra-simplificada exitosa

---

## 📝 Notas de Versión

### Convenciones de Changelog
- `🚀 Added` - Nuevas funcionalidades
- `🎯 Fixed` - Corrección de bugs
- `🔄 Changed` - Cambios en funcionalidades existentes
- `🗑️ Removed` - Funcionalidades eliminadas
- `🛡️ Security` - Mejoras de seguridad
- `📊 Performance` - Optimizaciones de rendimiento

### Enlaces Útiles
- 📖 [Documentación Completa](./docs/)
- 🔧 [Guía de Desarrollo](./docs/development/)
- 🧪 [Testing Guide](./docs/testing/)
- 🚀 [Deployment Guide](./docs/deployment/)

---

**Proyecto:** Pinteya E-commerce  
**Estado:** EN DESARROLLO ACTIVO  
**Última Actualización:** Octubre 2025