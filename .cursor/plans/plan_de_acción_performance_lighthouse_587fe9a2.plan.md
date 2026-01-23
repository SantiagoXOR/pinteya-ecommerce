---
name: Plan de Acción Performance Lighthouse - Multitenant Optimizado
overview: Plan de acción optimizado para sistemas multitenant, enfocado en mejoras escalables y mantenibles que resuelvan problemas críticos de performance identificados en Lighthouse, priorizando optimizaciones compartidas y específicas por tenant según corresponda.
todos:
  - id: tracking-batching-multitenant
    content: Implementar batching multitenant en analytics-optimized.ts con separación por tenant_id, batchSize 100, flushInterval 10s, cola de prioridades
    status: completed
  - id: tracking-endpoint-optimize-multitenant
    content: Optimizar endpoint /api/track/events con tenant_id, rate limiting por tenant, timeouts agresivos, queue system con Redis por tenant
    status: completed
  - id: tracking-migrate-batch-multitenant
    content: Migrar todos los llamados a usar endpoint batch con tenant_id, verificar que eventos incluyan tenant_id antes de insertar
    status: completed
  - id: tracking-cache-integration
    content: Integrar sistema de tracking con enterprise-cache-system.ts, cache compartido para lookups, cache por tenant para métricas
    status: completed
  - id: js-bundle-analysis-multitenant
    content: "Analizar bundle y crear chunks separados: compartidos (framework, vendor) vs tenant-specific (config, temas)"
    status: completed
  - id: js-lazy-loading-multitenant
    content: Implementar React.lazy() con tenant context, Suspense con fallbacks usando colores del tenant, preload basado en analytics
    status: completed
  - id: js-cache-bundles
    content: "Configurar cache de bundles: compartidos (cache largo) vs tenant-specific (cache corto con invalidación)"
    status: completed
  - id: js-remove-unused
    content: Eliminar imports no utilizados usando ESLint --fix, verificar que tenant service no se elimine
    status: pending
  - id: images-lazy-verify-multitenant
    content: "Verificar lazy loading con cache por tenant: productos (compartido) vs logos/hero (específico por tenant)"
    status: completed
  - id: images-hero-optimize-multitenant
    content: Optimizar hero images obteniendo desde getTenantPublicConfig(), preload, fetchPriority high, blur placeholder con colores del tenant
    status: completed
  - id: images-formats-verify
    content: Verificar WebP/AVIF, cache compartido para productos, cache por tenant para imágenes del tenant
    status: completed
  - id: images-cache-system
    content: Integrar cache de imágenes con cache-manager.ts, invalidación inteligente por tenant, preload de imágenes críticas
    status: completed
  - id: css-analysis-multitenant
    content: Analizar CSS y separar compartido (base, componentes) vs tenant-specific (temas, variables de colores)
    status: completed
  - id: css-critical-multitenant
    content: Implementar critical CSS inline con variables del tenant desde getTenantPublicConfig(), defer non-critical CSS
    status: completed
  - id: css-cache-system
    content: Cache de CSS compartido (cache largo) vs tenant-specific (cache corto), invalidación por cambios de tema
    status: completed
  - id: a11y-audit
    content: Auditar y corregir problemas de ARIA en todos los componentes Button y formularios
    status: completed
  - id: a11y-contrast
    content: Mejorar contraste de colores para cumplir WCAG AA (4.5:1 mínimo)
    status: completed
  - id: a11y-labels
    content: Agregar aria-label a todos los botones sin texto visible
    status: completed
  - id: preconnect-external-multitenant
    content: Agregar preconnect dinámico basado en configuración del tenant (GA del tenant si está configurado, Supabase compartido)
    status: completed
  - id: lighthouse-ci-multitenant
    content: Configurar Lighthouse CI para ejecutar en cada deploy, monitorear métricas por tenant (top 10), alertas por tenant
    status: pending
  - id: tenant-service-optimization
    content: Verificar optimización de tenant-service.ts (ya usa React cache), considerar cache adicional en Redis para configuraciones
    status: completed
isProject: false
---

# Plan de Acción: Optimización de Performance Post-Lighthouse

## Resumen Ejecutivo

Este plan aborda los problemas críticos identificados en el diagnóstico de Lighthouse, con enfoque en:

- **Móvil**: Performance 35/100 → Objetivo 80+
- **Desktop**: Performance 94/100 → Mantener y mejorar LCP
- **Core Web Vitals**: LCP móvil 16.2s → <2.5s, TBT 1,690ms → <200ms

## Fase 1: Optimización Crítica del Endpoint de Tracking Multitenant (URGENTE)

### Problema

Múltiples requests a `/api/track/events` causando timeouts y bloqueando la carga de página. Lighthouse detectó 60+ requests pendientes. En sistema multitenant, esto se multiplica por número de tenants activos.

### Solución Multitenant-Optimizada

**1.1 Sistema de Batching Inteligente por Tenant**

- **Archivo**: `src/lib/integrations/analytics/analytics-optimized.ts`
- **Cambios**:
- Implementar batching separado por tenant_id usando Map<tenantId, EventQueue>
- Aumentar `batchSize` a 100 eventos por tenant
- Reducir `flushInterval` a 10s para eventos críticos, 30s para no críticos
- Cola de prioridades: eventos críticos (purchase, checkout) vs no críticos (view, scroll)
- Debouncing por tipo de evento y tenant (evitar duplicados en <1s)
- Usar `getTenantConfig()` para obtener tenant_id automáticamente
- Cachear tenant_id en memoria del cliente para evitar lookups repetidos

**1.2 Endpoint de Tracking con Cache Multitenant**

- **Archivo**: `src/app/api/track/events/route.ts`
- **Cambios**:
- Obtener tenant_id desde headers o middleware (ya disponible)
- Rate limiting por tenant_id + IP (max 10 req/s por tenant)
- Cache de eventos duplicados con clave: `tenant_id:event_type:session_id:timestamp`
- TTL de cache: 30s (aumentado para multitenant)
- Retornar 202 (Accepted) inmediatamente, procesar en background
- Queue system usando Redis con prefijo por tenant: `queue:tenant:{tenant_id}:events`
- Timeout agresivo: 5s máximo por request
- Incluir tenant_id en todos los eventos antes de insertar en BD

**1.3 Endpoint Batch Multitenant**

- **Archivo**: `src/app/api/analytics/events/route.ts`
- **Cambios**:
- Verificar que batch incluya tenant_id en cada evento
- Procesar batches por tenant en paralelo (Promise.all con límite de concurrencia)
- Cache compartido para lookup tables (event_types, categories) - no específico por tenant
- Cache específico por tenant para métricas agregadas: `metrics:tenant:{tenant_id}:{period}`
- Fallback a eventos individuales solo si batch falla completamente

**1.4 Integración con Sistema de Cache Existente**

- **Archivo**: `src/lib/cache-manager.ts` y `src/lib/optimization/enterprise-cache-system.ts`
- **Cambios**:
- Usar `ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA` para cache de métricas
- Invalidación inteligente: invalidar solo cache del tenant afectado
- Warmup de cache para tenants activos (top 10 por tráfico)
- Compartir cache de configuraciones estáticas entre tenants

**Impacto Esperado**:

- Reducción de 60+ requests a <5 requests por carga de página
- Escalabilidad: sistema maneja N tenants sin degradación lineal
- Mantenibilidad: código reutilizable y separación clara de responsabilidades

## Fase 2: Optimización de JavaScript Multitenant

### Problema

500ms de ahorro potencial identificado por JavaScript no utilizado. En multitenant, el bundle compartido impacta a todos los tenants.

### Solución Multitenant-Optimizada

**2.1 Análisis de Bundle con Separación Tenant-Specific**

- **Archivo**: `next.config.js`
- **Cambios**:
- Ejecutar `ANALYZE=true npm run build` para identificar código no usado
- Crear chunk separado para código específico por tenant: `tenant-config.js` (lazy loaded)
- Chunks compartidos: framework, vendor libraries, componentes comunes
- Chunks específicos por tenant: configuraciones de tema, logos, colores (cargados dinámicamente)
- Ajustar `maxSize` de chunks vendor de 150KB a 100KB
- Implementar code splitting por ruta y por tenant cuando sea necesario

**2.2 Lazy Loading Inteligente con Tenant Context**

- **Archivos a revisar**:
- `src/components/Home-v3/index.tsx`
- `src/components/Home-v2/BestSeller/index.tsx`
- Componentes que usan Framer Motion, Recharts, Swiper
- **Cambios**:
- Envolver componentes no críticos en `React.lazy()` con tenant-aware loading
- Suspense boundaries con fallbacks que usen colores del tenant (desde `getTenantPublicConfig()`)
- Cargar componentes pesados solo cuando son visibles (Intersection Observer)
- Preload de componentes críticos del tenant actual basado en analytics históricos

**2.3 Eliminar Imports No Utilizados**

- **Acción**: Ejecutar ESLint con regla `no-unused-vars`
- **Archivos**: Todos los componentes principales
- **Herramienta**: `npm run lint -- --fix`
- **Consideración**: Verificar que imports de tenant service no se eliminen incorrectamente

**2.4 Cache de Bundles por Tenant (CDN/Edge)**

- **Archivo**: `next.config.js` y configuración de CDN
- **Cambios**:
- Configurar cache headers diferentes para bundles compartidos vs tenant-specific
- Bundles compartidos: cache largo (1 año) con versioning
- Bundles tenant-specific: cache corto (1 hora) con invalidación por tenant
- Usar Vercel Edge Functions o similar para servir bundles optimizados por tenant

**Impacto Esperado**:

- Reducción de bundle size en 20-30% (compartido entre todos los tenants)
- Mejora TBT en 200-300ms
- Escalabilidad: nuevos tenants no aumentan bundle size significativamente
- Mantenibilidad: código compartido fácil de actualizar para todos los tenants

## Fase 3: Optimización de Imágenes Multitenant

### Problema

190ms de ahorro potencial, imágenes no lazy-loaded correctamente. En multitenant, imágenes pueden ser compartidas (productos) o específicas por tenant (logos, hero).

### Solución Multitenant-Optimizada

**3.1 Lazy Loading con Cache por Tenant**

- **Archivo**: `src/components/ui/product-card-commercial/components/ProductCardImage.tsx`
- **Cambios**:
- Asegurar que todas las imágenes usen `loading="lazy"` excepto LCP candidate
- Verificar que `priority` solo se use en hero images del tenant actual
- Implementar `sizes` attribute correctamente para responsive images
- Usar `src` con tenant-aware URLs cuando corresponda (logos, hero images)
- Cache de imágenes de productos: compartido entre tenants (mismo producto)
- Cache de imágenes de tenant: específico por tenant con TTL largo

**3.2 Optimizar Imágenes Hero por Tenant**

- **Archivo**: `src/components/Home-v3/HeroOptimized.tsx` o componente hero actual
- **Cambios**:
- Obtener hero images desde `getTenantPublicConfig()` (ya cacheado por React cache)
- Preload de imagen hero LCP candidate del tenant actual
- Usar `fetchPriority="high"` en imagen hero
- Implementar blur placeholder usando colores del tenant
- Dimensiones explícitas para evitar CLS
- CDN cache con clave: `hero:tenant:{tenant_id}:{image_hash}`

**3.3 Optimización de Formatos con Tenant Context**

- **Archivo**: `next.config.js`
- **Cambios**:
- Verificar que `imageOptimization` esté habilitado
- Asegurar que se sirvan WebP/AVIF cuando sea posible
- Configurar tamaños de imagen apropiados
- Imágenes de productos: optimización compartida (mismo producto = misma optimización)
- Imágenes de tenant: optimización específica con cache por tenant
- Usar Vercel Image Optimization o similar con cache por tenant

**3.4 Sistema de Cache de Imágenes Multitenant**

- **Integración**: Usar sistema de cache existente (`src/lib/cache-manager.ts`)
- **Cambios**:
- Cache de URLs de imágenes optimizadas: `image:tenant:{tenant_id}:{image_path}`
- Cache compartido para imágenes de productos: `image:product:{product_id}:{size}`
- Invalidación inteligente: solo invalidar cache del tenant afectado
- Preload de imágenes críticas del tenant en `<head>` usando `getTenantPublicConfig()`

**Impacto Esperado**:

- Mejora LCP en 1-2s (especialmente en móvil)
- Reducción de ancho de banda (cache compartido para productos)
- Escalabilidad: nuevos tenants no requieren re-optimización de productos
- Mantenibilidad: sistema centralizado de optimización de imágenes

## Fase 4: Optimización de CSS Multitenant

### Problema

170ms de ahorro potencial por CSS no utilizado. En multitenant, CSS puede ser compartido (base, componentes) o específico por tenant (temas, colores).

### Solución Multitenant-Optimizada

**4.1 Análisis de CSS con Separación Tenant-Specific**

- **Archivo**: `postcss.config.js`
- **Cambios**:
- Habilitar `discardUnused` con configuración segura (solo en producción)
- Verificar que no rompa animaciones con code-splitting
- CSS compartido: base, componentes UI, utilidades (cache largo)
- CSS específico por tenant: variables de colores, temas (inline en `<head>`)
- Generar CSS crítico por tenant basado en componentes más usados

**4.2 Critical CSS con Tenant Variables**

- **Archivo**: `src/app/layout.tsx`
- **Cambios**:
- Obtener colores del tenant desde `getTenantPublicConfig()` (server-side, cacheado)
- Inline critical CSS con variables CSS del tenant: `--primary-color: ${tenant.primaryColor}`
- Defer non-critical CSS (cargar después de FCP)
- Preload de CSS crítico compartido
- CSS específico del tenant: inline en `<style>` tag con variables del tenant
- Usar `<link rel="preload">` para CSS no crítico del tenant

**4.3 Sistema de Cache de CSS**

- **Integración**: Usar sistema de cache existente
- **Cambios**:
- Cache de CSS compilado compartido: `css:shared:{hash}` (cache largo)
- CSS específico por tenant: generar en runtime o cachear con TTL corto
- Invalidación: solo invalidar cuando tenant cambia tema/colores
- CDN cache para CSS compartido (1 año), tenant-specific (1 hora)

**Impacto Esperado**:

- Reducción de CSS bloqueante (especialmente en móvil)
- Mejora FCP en 100-200ms
- Escalabilidad: CSS compartido beneficia a todos los tenants
- Mantenibilidad: temas centralizados, fácil agregar nuevos tenants

## Fase 5: Mejoras de Accesibilidad

### Problema

Múltiples problemas de ARIA, botones sin nombres accesibles, contraste insuficiente.

### Solución

**5.1 Auditoría de Componentes**

- **Archivos a revisar**:
- Todos los componentes Button
- Componentes con roles ARIA
- Formularios y inputs
- **Cambios**:
- Agregar `aria-label` a todos los botones sin texto visible
- Corregir roles ARIA que no coinciden con elementos
- Verificar que elementos con `role` tengan hijos requeridos

**5.2 Mejorar Contraste**

- **Herramienta**: Usar axe DevTools o Lighthouse
- **Archivos**: Todos los componentes con texto
- **Cambios**:
- Ajustar colores para cumplir WCAG AA (4.5:1 mínimo)
- Agregar variables CSS para contraste mejorado

**5.3 Nombres Accesibles**

- **Archivo**: `src/components/ui/button.tsx` y similares
- **Cambios**:
- Asegurar que botones con íconos tengan `aria-label`
- Verificar que labels visibles coincidan con `aria-label`

**Impacto Esperado**: Mejora score de accesibilidad de 80 a 95+

## Fase 6: Optimizaciones Adicionales Multitenant

**6.1 Preconnect a Dominios Externos por Tenant**

- **Archivo**: `src/app/layout.tsx`
- **Cambios**:
- Obtener configuración del tenant desde `getTenantPublicConfig()`
- Agregar `preconnect` a Google Analytics del tenant (si está configurado)
- Preconnect a Supabase (compartido entre todos los tenants)
- Preconnect a CDN de imágenes (compartido)
- Preconnect dinámico basado en configuración del tenant

**6.2 Service Worker para Cache Multitenant**

- **Consideración**: Implementar service worker para cache de assets estáticos
- **Prioridad**: Media (mejora significativa en repeat visits)
- **Implementación**:
- Cache versionado por tenant: `sw:tenant:{tenant_id}:v{version}`
- Cache compartido para assets comunes (JS, CSS base)
- Cache específico por tenant para assets del tenant (logos, imágenes hero)
- Estrategia: Cache First para assets estáticos, Network First para datos dinámicos

**6.3 Monitoring Continuo Multitenant**

- **Acción**: Configurar Lighthouse CI para ejecutar en cada deploy
- **Archivo**: `.github/workflows/performance.yml` (crear si no existe)
- **Configuración**:
- Ejecutar Lighthouse para cada tenant activo (top 10 por tráfico)
- Comparar métricas entre tenants para identificar problemas específicos
- Alertas cuando performance de un tenant cae por debajo de umbral
- Dashboard agregado con métricas por tenant

**6.4 Optimización de Tenant Service**

- **Archivo**: `src/lib/tenant/tenant-service.ts`
- **Cambios**:
- Ya usa `cache()` de React, verificar que esté funcionando correctamente
- Considerar cache adicional en Redis para configuraciones de tenant (TTL: 1 hora)
- Preload de configuraciones de tenants activos en memoria
- Invalidación de cache cuando tenant actualiza configuración

## Métricas de Éxito

### Objetivos Móvil

- Performance: 35 → 80+
- LCP: 16.2s → <2.5s
- FCP: 3.1s → <1.8s
- TBT: 1,690ms → <200ms
- Speed Index: 8.7s → <3.4s

### Objetivos Desktop

- Performance: 94 → 98+
- LCP: 3.0s → <2.5s
- Mantener FCP <1s
- Mantener TBT <50ms

## Orden de Implementación Multitenant

### Prioridad Alta (Semanas 1-2)

1. **Semana 1**: Fase 1 (Tracking Multitenant) - Impacto inmediato, crítico para escalabilidad
2. **Semana 1-2**: Fase 2 (JavaScript Multitenant) - Impacto alto, beneficia a todos los tenants

### Prioridad Media (Semanas 2-3)

3. **Semana 2**: Fase 3 (Imágenes Multitenant) - Impacto alto, mejora LCP significativamente
4. **Semana 2-3**: Fase 4 (CSS Multitenant) - Impacto medio, mejora FCP

### Prioridad Baja (Semana 3-4)

5. **Semana 3**: Fase 5 (Accesibilidad) - Impacto en UX, no afecta performance directamente
6. **Semana 3-4**: Fase 6 (Optimizaciones adicionales) - Mejoras incrementales, nice-to-have

## Consideraciones de Escalabilidad Multitenant

### Recursos Compartidos (Benefician a Todos los Tenants)

- JavaScript framework y vendor libraries
- CSS base y componentes UI
- Imágenes de productos (mismo producto = misma imagen)
- Configuraciones estáticas del sistema

### Recursos Específicos por Tenant (Requieren Separación)

- Configuraciones de tenant (colores, logos, temas)
- Imágenes hero y branding del tenant
- Analytics y métricas (separados por tenant_id)
- Cache de configuraciones (invalidación por tenant)

### Estrategia de Cache

- **Compartido**: Cache largo (1 año) con versioning, beneficia a todos
- **Por Tenant**: Cache corto-medio (1 hora - 1 día), invalidación inteligente
- **Dinámico**: Cache muy corto (5-30 min), datos que cambian frecuentemente

### Mantenibilidad

- Código compartido: fácil de actualizar para todos los tenants
- Configuraciones por tenant: centralizadas en `tenant-service.ts`
- Cache: sistema unificado con separación clara de responsabilidades
- Monitoring: métricas agregadas y por tenant para identificar problemas

## Verificación

Después de cada fase:

1. Ejecutar `npm run lighthouse:diagnostic`
2. Comparar métricas con baseline
3. Verificar que no se hayan introducido regresiones
4. Documentar mejoras en `docs/performance/`