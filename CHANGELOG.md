# 📋 CHANGELOG - Pinteya E-commerce

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🎨 Features - Diciembre 2025

- **[MAYOR] ✅ Refactorización ProductCard en Arquitectura Modular**
  - ✅ **Modularización en 5 fases** - Separación de lógica y UI
  - ✅ **5 hooks personalizados** creados:
    - `useProductColors` - Manejo de colores y selección
    - `useProductMeasures` - Manejo de medidas y capacidades
    - `useProductVariants` - Cálculo de precios por variante
    - `useProductBadges` - Generación de badges inteligentes
    - `useProductCardState` - Estado del componente (modal, hover, etc.)
  - ✅ **7 componentes UI separados**:
    - `ProductCardImage` - Imagen con fallback
    - `ProductCardContent` - Contenido (marca, título, precios)
    - `ProductCardActions` - Botón agregar al carrito
    - `ColorPillSelector` - Selector de colores en formato pills
    - `MeasurePillSelector` - Selector de medidas con unidad integrada
    - `ColorPill` y `MeasurePill` - Componentes base
  - ✅ **Selectores mejorados** - Convertidos de círculos a pills con mejor UX
  - 📁 Archivos principales:
    - `src/components/ui/product-card-commercial/index.tsx` (refactorizado)
    - `src/components/ui/product-card-commercial/hooks/` (5 hooks)
    - `src/components/ui/product-card-commercial/components/` (7 componentes)
    - `src/components/ui/product-card-commercial/utils/` (utilidades)
  - 📚 Documentación actualizada:
    - `docs/components/commercial-product-card.md` - Arquitectura modular documentada
  - 📊 Impacto: **ALTO** - Mejor mantenibilidad y extensibilidad
  - 🎉 **Estado**: COMPLETADO

- **[UI/UX] ✅ Bottom Navigation Estilo MercadoLibre**
  - ✅ **5 botones principales** - Volver, Buscar, Carrito, Inicio, WhatsApp
  - ✅ **Integración con carrito** - Badge dinámico con cantidad de items
  - ✅ **Estados visuales** - Feedback en interacciones (hover, active, pressed)
  - ✅ **Funcionalidades específicas**:
    - Botón "Volver" con historial del navegador
    - Botón "Buscar" con focus automático en searchbar del header
    - Botón "WhatsApp" con enlace directo
  - ✅ **Colores de marca Pinteya** - Naranja para estados activos y badge
  - ✅ **Safe area support** - Compatible con dispositivos con notch
  - 📁 Archivos:
    - `src/components/ui/bottom-navigation-mercadolibre.tsx`
    - `src/components/ui/bottom-navigation.tsx` (versión base)
  - 📚 Documentación creada:
    - `docs/components/bottom-navigation.md` - Documentación completa
  - 📊 Impacto: **MEDIO** - Mejor UX en dispositivos móviles
  - 🎉 **Estado**: COMPLETADO

- **[UI] ✅ ScrollingBanner Optimizado**
  - ✅ **Altura reducida** - De ~28-30px a 22px
  - ✅ **Tamaño tipográfico ajustado** - De text-xs (12px) a text-[10px] (10px)
  - ✅ **Colores actualizados** - Fondo naranja de marca, badges verde y amarillo
  - ✅ **Mejoras de legibilidad** - Texto negro en badge amarillo para mejor contraste
  - ✅ **Animación optimizada** - Loop infinito suave con pausa en hover
  - 📁 Archivo: `src/components/Header/ScrollingBanner.tsx`
  - 📚 Documentación creada:
    - `docs/components/scrolling-banner.md` - Optimizaciones documentadas
  - 📊 Impacto: **BAJO** - Mejora visual y de espacio
  - 🎉 **Estado**: COMPLETADO

- **[DESIGN] ✅ Fondo Global Degradado Negro/Naranja**
  - ✅ **Fondo unificado** - Degradado vertical 60% negro / 40% naranja
  - ✅ **Aplicación global** - Se aplica a todas las rutas por defecto
  - ✅ **Fondo fijo** - `background-attachment: fixed` para efecto parallax
  - ✅ **Texto blanco por defecto** - Mejor contraste con el fondo oscuro
  - ✅ **Eliminación de fondos locales** - Consistencia visual en toda la app
  - 📁 Archivos modificados:
    - `src/app/css/style.css` - Estilos principales
    - `src/app/layout.tsx` - CSS inline crítico
  - 📚 Documentación creada:
    - `docs/design-system/global-background.md` - Especificaciones completas
  - 📊 Impacto: **ALTO** - Identidad visual más fuerte y consistente
  - 🎉 **Estado**: COMPLETADO

- **[ADMIN] ✅ Componentes Admin para Gestión de Productos**
  - ✅ **MeasureSelector** - Selección múltiple de medidas con búsqueda y creación inline
  - ✅ **ColorPickerField** - Selector de colores con paleta predefinida y colores personalizados
  - ✅ **VariantBuilder** - Creación inline de variantes con todos los campos
  - ✅ **Dropdown de marcas** - Con búsqueda y creación inline
  - ✅ **Optimización automática de imágenes** - Redimensionamiento y compresión antes de subir
  - 📁 Archivos:
    - `src/components/admin/products/MeasureSelector.tsx`
    - `src/components/admin/products/ColorPickerField.tsx`
    - `src/components/admin/products/VariantBuilder.tsx`
  - 📚 Documentación creada:
    - `docs/admin/components/measure-selector.md`
    - `docs/admin/components/color-picker-field.md`
    - `docs/admin/components/variant-builder.md`
  - 📊 Impacto: **ALTO** - Mejora significativa en UX del panel admin
  - 🎉 **Estado**: COMPLETADO

- **[TECH] ✅ Actualización a Next.js 16 con Turbopack**
  - ✅ **Next.js 16.0.8** - Actualización desde Next.js 15.5.3
  - ✅ **Turbopack habilitado** - Compilación 5-10x más rápida en desarrollo
  - ✅ **Polyfill react/cache** - Solución para compatibilidad con webpack
  - ✅ **Build exitoso** - Sin errores de compilación
  - 📁 Archivos modificados:
    - `package.json` - Dependencias actualizadas
    - `next.config.js` - Configuración de Turbopack
    - `scripts/create-react-cache-polyfill.js` - Polyfill mejorado
  - 📚 Documentación actualizada:
    - `README.md` - Versión de Next.js actualizada
  - 📊 Impacto: **ALTO** - Mejor performance de desarrollo y build
  - 🎉 **Estado**: COMPLETADO

- **[REFACTOR] ✅ Eliminación de next-themes**
  - ✅ **Removido next-themes** - Sistema de temas simplificado
  - ✅ **Comportamiento sin tema forzado** - Restaurado comportamiento nativo
  - 📁 Archivos modificados:
    - `src/app/providers.tsx` - Removido ThemeProvider
    - `package.json` - Dependencia removida
  - 📊 Impacto: **MEDIO** - Simplificación del sistema de temas
  - 🎉 **Estado**: COMPLETADO

### 🎨 Features - 15 de Diciembre, 2025

- **[MAYOR] ✅ Sistema de Variantes de Productos - Implementación Completa**
  - ✅ **Consolidación de Productos Duplicados**
    - 63 productos duplicados consolidados → 25 productos únicos con variantes
    - 148 variantes creadas en total
    - Migraciones SQL aplicadas exitosamente
  - ✅ **APIs Actualizadas**
    - `/api/admin/products/route.ts` - Soporte para `variant_count`
    - `/api/admin/products/[id]/route.ts` - Incluye variantes en respuesta
    - `/api/cart/route.ts` - Soporte para `variant_id` en carrito
    - `effectiveStock` calculado desde variante seleccionada
  - ✅ **Selectores Inteligentes en Modal**
    - Selector de acabado (Finish) para Impregnante Danzke
    - Selector de ancho para Cinta de Papel Blanca
    - Selector de peso para Poximix (Exterior/Interior)
    - Priorización de variantes sobre producto padre
  - ✅ **Cambio de Imagen por Variante**
    - Imagen dinámica basada en `selectedVariant.image_url`
    - Aplica a Poximix y preparado para extenderse a otros productos
  - ✅ **Productos Específicos Corregidos**
    - Impregnante Danzke: 24 variantes (6 colores × 2 acabados × 2 capacidades)
    - Poximix: Imagen y precio actualizados por peso seleccionado
    - Cinta Papel: Precio y stock correctos por ancho (18mm, 24mm, 36mm, 48mm)
    - Pinceleta Obra: Selector de tamaño removido (precio único)
  - 🐛 **Bugs Corregidos**
    - Error "variants.map is not a function" (protección con `Array.isArray`)
    - Loop infinito en selectores (flujo unidireccional)
    - Precio no cambia al seleccionar ancho (búsqueda con `.includes()`)
    - Badge en carrito muestra "1" en lugar de ancho (ej: "36mm")
    - Stock validación incorrecta (usa stock de variante correcta)
    - Capacidades incorrectas ("1L" en productos sin ella)
  - 📁 Archivos principales modificados:
    - `src/components/ShopDetails/ShopDetailModal.tsx` (~300 líneas modificadas)
    - `src/app/api/cart/route.ts` (soporte variant_id)
    - `src/utils/product-utils.ts` (detección mejorada)
    - `src/components/admin/products/ProductList.tsx` (columnas agregadas)
  - 📚 Documentación creada:
    - `RESUMEN_SISTEMA_VARIANTES_FINAL_2025.md` - Resumen completo
    - `GUIA_TESTING_SISTEMA_VARIANTES.md` - Guía de testing
    - `CONSOLIDACION_FASE2_COMPLETADA.md` - Consolidación de productos
  - 📊 Impacto: **ALTO** - Mejora significativa en UX y gestión de inventario
  - ⏱️ Tiempo de implementación: ~98 días (sprints intermitentes)
  - 🎉 **Estado**: COMPLETADO

### ⚡ Performance - Octubre 20, 2025

- **[ROUND 3] ✅ Optimización Auth RLS InitPlan Performance**
  - ✅ **Problema**: 6 políticas RLS re-evaluaban `auth.uid()` y `auth.role()` para cada fila
  - ✅ **Impacto**: Performance subóptimo en queries que afectan `user_roles` y `user_profiles`
  - ✅ **Solución implementada**:
    - Optimizadas 6 políticas RLS usando subqueries `(SELECT auth.<function>())`
    - Políticas evaluadas UNA VEZ por query en lugar de N veces (una por fila)
    - Eliminados 6 warnings "Auth RLS InitPlan" de Security Advisors
  - 📁 Migración creada:
    - `supabase/migrations/20251020_fix_auth_rls_initplan_performance.sql`
  - 🎯 Políticas optimizadas:
    - `user_roles`: user_roles_insert_service, user_roles_update_service, user_roles_delete_service
    - `user_profiles`: user_profiles_select_own, user_profiles_insert_service_role, user_profiles_update_own
  - 📈 Mejoras esperadas:
    - 40-60% mejora en queries de autenticación
    - Escalabilidad: O(n) → O(1) en evaluación de auth functions
    - 99% reducción en overhead de evaluación de auth
  - 📚 Documentación creada:
    - `PERFORMANCE_ROUND_3_SUMMARY.md` - Resumen completo de optimización
  - 🔍 Referencia: [Supabase RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
  - 📊 Impacto: **ALTO** - Mejora significativa en performance de auth
  - ⏱️ Tiempo de implementación: ~1 hora
  - 🎉 **Estado**: MIGRACIÓN CREADA - Pendiente Aplicación
  - 📖 Ver: [PERFORMANCE_ROUND_3_SUMMARY.md](./PERFORMANCE_ROUND_3_SUMMARY.md)

### 🎯 Fixed - Octubre 2025

- **[CRÍTICO] ✅ Resolución Error 500 - Recursión Infinita en Políticas RLS**
  - ✅ **Problema**: APIs `/api/products` y `/api/categories` devolvían error 500
  - ✅ **Causa**: Recursión infinita en políticas RLS de `user_profiles` y `user_roles`
  - ✅ **Solución implementada**:
    - Creadas funciones seguras: `is_admin_safe()` y `is_moderator_or_admin_safe()`
    - Eliminadas políticas RLS con recursión infinita
    - Creadas políticas RLS simplificadas sin recursión
    - Aplicadas 2 migraciones SQL exitosamente
  - 📁 Migraciones aplicadas:
    - `supabase/migrations/20250120_fix_user_profiles_rls_recursion.sql`
    - `supabase/migrations/20250120_fix_user_roles_rls_recursion.sql`
  - 📚 Documentación creada:
    - `RESOLUCION_ERROR_500_FINAL.md` - Resumen ejecutivo completo
    - `SOLUCION_RECURSION_COMPLETADA.md` - Verificación de corrección
    - `SOLUCION_RECURSION_INFINITA_RLS.md` - Análisis técnico
    - `APLICAR_SOLUCION_RECURSION_MANUAL.sql` - Script consolidado
  - 🧪 Verificación exitosa:
    - `/api/products` → 200 OK (70 productos encontrados)
    - `/api/categories` → 200 OK (8 categorías encontradas)
    - Sin errores de recursión en logs
  - 🔒 Seguridad mantenida:
    - RLS activo en todas las tablas
    - Usuarios solo acceden a sus propios datos
    - Operaciones administrativas protegidas con service_role
  - 📊 Impacto: **CRÍTICO** - Sistema completamente operacional
  - ⏱️ Tiempo de resolución: ~2 horas
  - 🎉 **Estado**: RESUELTO COMPLETAMENTE
  - 📖 Ver: [RESOLUCION_ERROR_500_FINAL.md](./RESOLUCION_ERROR_500_FINAL.md)
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
**Última Actualización:** 15 de Diciembre, 2025