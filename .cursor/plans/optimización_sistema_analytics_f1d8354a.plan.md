---
name: Optimización Sistema Analytics
overview: "Análisis completo y plan de optimización del sistema de métricas y analíticas: consolidación de tablas, modularización de código, optimización de queries, mejora de cache y escalabilidad."
todos:
  - id: phase1-metrics-calculator
    content: Crear servicio centralizado de cálculos de métricas (src/lib/analytics/metrics-calculator.ts)
    status: completed
  - id: phase1-metrics-cache
    content: Crear manager de cache para métricas (src/lib/analytics/metrics-cache.ts)
    status: completed
  - id: phase1-refactor-apis
    content: Refactorizar APIs para usar nuevo servicio de métricas
    status: completed
  - id: phase2-db-indexes
    content: Crear índices compuestos optimizados para queries comunes
    status: completed
  - id: phase2-materialized-views
    content: Crear materialized views para métricas agregadas
    status: completed
  - id: phase2-sql-functions
    content: Crear funciones SQL para agregaciones en lugar de JavaScript
    status: completed
  - id: phase3-redis-cache
    content: Implementar sistema de cache distribuido con Redis
    status: completed
  - id: phase3-cache-strategies
    content: Implementar estrategias de cache por tipo de métrica
    status: completed
  - id: phase3-cache-invalidation
    content: Implementar invalidación de cache al insertar eventos
    status: completed
  - id: phase4-unified-provider
    content: Crear provider unificado de analytics con estrategias
    status: completed
  - id: phase4-consolidate-providers
    content: Consolidar providers existentes en uno solo
    status: completed
  - id: phase5-dual-write
    content: Implementar escritura dual (antigua + optimizada) por 2 semanas
    status: cancelled
  - id: phase5-migrate-data
    content: Migrar datos históricos de tabla antigua a optimizada
    status: cancelled
  - id: phase5-switch-to-optimized
    content: Cambiar todas las escrituras a solo tabla optimizada
    status: completed
  - id: phase6-aggregation-jobs
    content: Crear jobs programados para agregación diaria de métricas
    status: completed
  - id: phase6-archival-system
    content: Implementar sistema de archivado automático de datos antiguos
    status: pending
  - id: phase7-query-optimization
    content: Optimizar queries con paginación y agregaciones SQL
    status: completed
  - id: phase7-lazy-loading
    content: Implementar lazy loading en dashboard de analytics
    status: completed
  - id: phase0-backup-data
    content: Hacer backup de datos existentes antes de limpiar (script creado: scripts/analytics/backup-before-reset.js)
    status: completed
  - id: phase0-clean-tables
    content: Limpiar todas las tablas de analytics (TRUNCATE) - migración 20260116_reset_analytics_system.sql
    status: completed
  - id: phase0-drop-unified-view
    content: Eliminar vista unificada (ya no necesaria) - migración 20260116_reset_analytics_system.sql
    status: completed
  - id: phase0-create-indexes
    content: Crear índices faltantes en tabla optimizada - migración 20260116_reset_analytics_system.sql
    status: completed
  - id: phase1-alternative-endpoint
    content: Crear endpoint /api/track/events sin 'analytics' en URL
    status: completed
  - id: phase1-adblock-detector
    content: Implementar detección de bloqueadores de anuncios (src/lib/analytics/adblock-detector.ts)
    status: completed
  - id: phase1-send-strategies
    content: Implementar múltiples estrategias de envío (fetch, sendBeacon, IndexedDB) - src/lib/analytics/send-strategies.ts
    status: completed
  - id: phase1-event-persistence
    content: Implementar persistencia robusta con IndexedDB (src/lib/analytics/event-persistence.ts + indexeddb-manager.ts)
    status: completed
  - id: phase1-retry-mechanism
    content: Implementar retry automático con backoff exponencial (incluido en event-persistence.ts)
    status: completed
  - id: verification-database
    content: Verificar base de datos con MCP tools - todas las migraciones aplicadas correctamente
    status: completed
  - id: verification-tests
    content: Ejecutar pruebas funcionales - inserción, lectura, métricas (todas exitosas)
    status: completed
  - id: documentation-consolidation
    content: Consolidar documentación - ARCHITECTURE.md, VERIFICACION_2026-01-16.md creados
    status: completed
---

# Plan de Optimización: Sistema de Métricas y Analíticas

## 🎯 ESTRATEGIA: REINICIO COMPLETO DEL SISTEMA DE ANALYTICS

### Decisión Estratégica

**Situación actual:**

- No hay usuarios activos actualmente
- Datos históricos no son relevantes para el estado actual
- Sistema actual tiene problemas (bloqueadores, tablas duplicadas, código duplicado)
- Es el momento perfecto para empezar desde cero con un sistema limpio y correcto

**Decisión:**

- **REINICIAR COMPLETAMENTE** el sistema de analytics
- Limpiar todas las tablas existentes
- Consolidar a una sola tabla optimizada desde el inicio
- Implementar sistema robusto desde cero
- Resolver todos los problemas conocidos antes de tener usuarios activos

**Beneficios:**

- Sistema limpio sin deuda técnica
- Arquitectura correcta desde el inicio
- Sin necesidad de migraciones complejas
- Datos consistentes desde el día 1
- Mejor performance y escalabilidad

### Problemas a Resolver en el Nuevo Sistema

1. **Bloqueadores de anuncios:**

- `ERR_BLOCKED_BY_CLIENT` en `/api/analytics/events`
- Endpoint alternativo sin "analytics" en URL
- Múltiples estrategias de envío (fetch, sendBeacon, IndexedDB)

2. **Arquitectura de base de datos:**

- Consolidar a una sola tabla optimizada
- Eliminar tabla antigua y vista unificada
- Índices correctos desde el inicio

3. **Código duplicado:**

- Un solo provider de analytics
- Servicio centralizado de cálculos
- Sin duplicación de lógica

## 📊 Estado Actual Identificado

### Arquitectura de Base de Datos

- **Tabla antigua**: `analytics_events` (UUID, ~485 bytes/evento)
- **Tabla optimizada**: `analytics_events_optimized` (BIGSERIAL, ~50 bytes/evento, 90% reducción)
- **Vista unificada**: `analytics_events_unified` (UNION de ambas tablas)
- **Tablas de lookup**: `analytics_event_types`, `analytics_categories`, `analytics_actions`, `analytics_pages`, `analytics_browsers`
- **Métricas agregadas**: `analytics_metrics_daily` (con trigger automático)
- **Interacciones**: `user_interactions` (heatmaps)

### Problemas Identificados

1. **Sistema Dual de Tablas**

- Eventos se insertan en ambas tablas (antigua y optimizada)
- Código duplicado para manejar ambas
- Vista unificada agrega overhead en queries

2. **Cálculos de Métricas Duplicados**

- Lógica de cálculo repetida en múltiples lugares:
- `src/app/api/analytics/metrics/route.ts` (líneas 91-198)
- `src/app/api/admin/analytics/route.ts` (líneas 132-392)
- `src/lib/integrations/analytics/index.ts` (líneas 589-625)
- Sin reutilización de código

3. **Falta de Cache Eficiente**

- Cache en memoria simple en APIs (5 segundos TTL)
- No hay cache distribuido (Redis) para métricas
- Cálculos se repiten en cada request

4. **Queries No Optimizadas**

- `calculateMetrics()` carga TODOS los eventos en memoria (línea 48 de metrics/route.ts)
- Sin paginación en cálculos
- Sin uso de índices compuestos eficientes
- Agregaciones en JavaScript en lugar de SQL

5. **Múltiples Providers de Analytics**

- `AnalyticsProvider.tsx`
- `SimpleAnalyticsProvider.tsx`
- `OptimizedAnalyticsProvider.tsx`
- Código duplicado y confuso

6. **Falta de Agregación Automática**

- Trigger `update_daily_metrics()` solo actualiza tabla antigua
- No hay agregación para tabla optimizada
- Métricas diarias no se usan en queries principales

7. **Sin Sistema de Retención de Datos**

- No hay política clara de archivado
- Datos crecen indefinidamente
- Solo función `cleanup_old_analytics_data()` sin uso

## 🎯 Objetivos de Optimización

1. **Consolidar a una sola tabla optimizada** (migración gradual)
2. **Modularizar cálculos de métricas** (servicio reutilizable)
3. **Implementar cache distribuido** (Redis con TTLs apropiados)
4. **Optimizar queries** (agregaciones en SQL, índices compuestos)
5. **Unificar providers** (un solo provider con estrategias)
6. **Mejorar agregación diaria** (materialized views, jobs programados)
7. **Implementar retención de datos** (archivado automático)

## 📋 Plan de Implementación

### Fase 0: CRÍTICA - Resolver Errores de Bloqueadores en Producción ⚠️

**Prioridad: URGENTE - Implementar antes que otras fases**

**Problema:**

- Bloqueadores de anuncios bloquean `/api/analytics/events`
- Eventos no se registran cuando hay bloqueadores
- Errores `ERR_BLOCKED_BY_CLIENT` y `Failed to fetch` en consola

**Solución:**

1. **Crear endpoint alternativo sin "analytics" en URL:**

- `src/app/api/track/events/route.ts` - Endpoint alternativo
- Misma funcionalidad pero URL menos detectable
- Mantener endpoint original para compatibilidad

2. **Implementar detección de bloqueadores:**

- `src/lib/analytics/adblock-detector.ts` - Detectar si fetch está bloqueado
- Test de conectividad al endpoint
- Cambiar estrategia automáticamente si detecta bloqueo

3. **Múltiples estrategias de envío:**

- **Estrategia 1**: `fetch()` al endpoint original
- **Estrategia 2**: `fetch()` al endpoint alternativo
- **Estrategia 3**: `navigator.sendBeacon()` (más difícil de bloquear)
- **Estrategia 4**: Persistir en IndexedDB y enviar en batch más tarde

4. **Mejorar persistencia de eventos fallidos:**

- Usar IndexedDB en lugar de localStorage (más espacio, más confiable)
- Retry automático con backoff exponencial
- Enviar eventos pendientes al cargar página siguiente

**Archivos a crear:**

- `src/app/api/track/events/route.ts` - Endpoint alternativo
- `src/lib/analytics/adblock-detector.ts` - Detector de bloqueadores
- `src/lib/analytics/event-persistence.ts` - Persistencia en IndexedDB
- `src/lib/analytics/send-strategies.ts` - Múltiples estrategias de envío

**Archivos a modificar:**

- `src/lib/integrations/analytics/index.ts` - Implementar estrategias múltiples
- `src/components/Analytics/SimpleAnalyticsProvider.tsx` - Usar nuevas estrategias
- `src/app/layout.tsx` - Mejorar manejo de errores (ya tiene código pero puede mejorarse)

**Testing:**

- Probar con uBlock Origin, AdBlock Plus, Privacy Badger
- Verificar que eventos se registran con bloqueadores activos
- Medir tasa de éxito antes/después

**Métricas de éxito:**

- Reducción de errores `ERR_BLOCKED_BY_CLIENT`: 0 errores visibles
- Tasa de eventos registrados: > 95% incluso con bloqueadores
- Eventos pendientes enviados: 100% en próxima sesión

### Fase 1: Modularización y Reutilización de Código

**Archivos a crear:**

- `src/lib/analytics/metrics-calculator.ts` - Servicio centralizado de cálculos
- `src/lib/analytics/metrics-cache.ts` - Manager de cache para métricas
- `src/lib/analytics/types.ts` - Tipos compartidos

**Archivos a modificar:**

- `src/app/api/analytics/metrics/route.ts` - Usar nuevo servicio
- `src/app/api/admin/analytics/route.ts` - Usar nuevo servicio
- `src/lib/integrations/analytics/index.ts` - Extraer lógica de métricas

**Beneficios:**

- Eliminar duplicación de código
- Fácil mantenimiento y testing
- Consistencia en cálculos

### Fase 2: Optimización de Base de Datos

**Migraciones SQL a crear:**

- `supabase/migrations/[timestamp]_optimize_analytics_queries.sql`
- Índices compuestos para queries comunes
- Materialized view para métricas diarias
- Función de agregación optimizada

**Mejoras:**

- Índice compuesto: `(created_at DESC, category, action)` para queries de métricas
- Índice compuesto: `(user_id, session_id, created_at)` para análisis de sesiones
- Materialized view `analytics_daily_summary` actualizada por job programado
- Función `get_metrics_aggregated()` que calcula en SQL en lugar de JavaScript

**Archivos a modificar:**

- `src/app/api/analytics/metrics/route.ts` - Usar agregaciones SQL
- `src/lib/analytics/metrics-calculator.ts` - Delegar a funciones SQL cuando sea posible

### Fase 3: Sistema de Cache Distribuido

**Archivos a crear:**

- `src/lib/analytics/metrics-cache.ts` - Manager de cache con Redis
- `src/lib/analytics/cache-strategies.ts` - Estrategias de cache por tipo de métrica

**Estrategias de Cache:**

- **Métricas en tiempo real**: 30 segundos TTL, clave: `analytics:realtime:{startDate}:{endDate}`
- **Métricas diarias**: 1 hora TTL, clave: `analytics:daily:{date}`
- **Métricas semanales**: 6 horas TTL, clave: `analytics:weekly:{week}`
- **Métricas mensuales**: 24 horas TTL, clave: `analytics:monthly:{month}`

**Invalidación:**

- Invalidar cache al insertar nuevos eventos
- Invalidar por rangos de fechas afectados
- TTL progresivo (más antiguo = más tiempo de cache)

**Archivos a modificar:**

- `src/app/api/analytics/metrics/route.ts` - Implementar cache
- `src/app/api/analytics/events/route.ts` - Invalidar cache al insertar
- `src/app/api/analytics/events/optimized/route.ts` - Invalidar cache al insertar

### Fase 4: Consolidación de Providers

**Archivo a crear:**

- `src/components/Analytics/UnifiedAnalyticsProvider.tsx` - Provider único con estrategias

**Estrategias:**

- **Development**: Tracking completo, debug habilitado
- **Production**: Tracking optimizado, batch processing
- **Optimized**: Solo eventos críticos, compresión

**Archivos a eliminar/modificar:**

- Consolidar `AnalyticsProvider.tsx`, `SimpleAnalyticsProvider.tsx`, `OptimizedAnalyticsProvider.tsx` en uno solo
- Mantener compatibilidad con API existente

### Fase 5: Migración Gradual a Tabla Optimizada

**Estrategia:**

1. **Fase de escritura dual** (2 semanas):

- Escribir en ambas tablas
- Leer desde vista unificada
- Monitorear performance

2. **Migración de datos históricos**:

- Script de migración en lotes
- Validación de integridad
- Backup antes de migrar

3. **Fase de solo optimizada**:

- Cambiar todas las escrituras a tabla optimizada
- Mantener tabla antigua como backup 30 días
- Eliminar vista unificada después

**Migraciones SQL:**

- `supabase/migrations/[timestamp]_migrate_analytics_to_optimized.sql`
- `supabase/migrations/[timestamp]_remove_old_analytics_table.sql` (después de validación)

**Archivos a modificar:**

- `src/app/api/analytics/events/route.ts` - Escribir también en optimizada
- `src/app/api/analytics/metrics/route.ts` - Leer solo de optimizada después de migración

### Fase 7: Sistema de Agregación y Retención (Futuro)

**Jobs programados (Supabase Edge Functions o cron):**

- **Agregación diaria**: Cada noche a las 2 AM
- Calcular métricas del día anterior
- Actualizar `analytics_metrics_daily`
- Actualizar materialized views

- **Archivado mensual**: Primer día de cada mes
- Mover eventos > 90 días a tabla de archivado
- Comprimir datos antiguos
- Generar reportes de resumen

**Archivos a crear:**

- `supabase/functions/aggregate-daily-metrics/index.ts`
- `supabase/functions/archive-old-analytics/index.ts`
- `scripts/analytics/aggregate-daily.js` (fallback local)

**Migraciones SQL:**

- `supabase/migrations/[timestamp]_create_analytics_archive_table.sql`
- `supabase/migrations/[timestamp]_create_analytics_aggregation_jobs.sql`

### Fase 8: Optimizaciones Avanzadas (Futuro)

**Mejoras específicas:**

1. **Paginación en cálculos**:

- Procesar eventos en chunks de 10,000
- Stream results cuando sea posible
- Usar cursores para grandes datasets

2. **Agregaciones SQL**:

- Mover `calculateMetrics()` a función SQL
- Usar `GROUP BY` y `FILTER` en lugar de JavaScript
- Índices parciales para queries comunes

3. **Lazy loading en dashboard**:

- Cargar métricas principales primero
- Cargar análisis avanzado bajo demanda
- Usar React Suspense para mejor UX

**Archivos a modificar:**

- `src/components/Analytics/AnalyticsDashboard.tsx` - Lazy loading
- `src/lib/analytics/metrics-calculator.ts` - Paginación y streaming
- Crear función SQL `calculate_analytics_metrics()` en Supabase

## 🔍 Verificaciones y Testing

### Tests a crear:

- `src/__tests__/lib/analytics/metrics-calculator.test.ts`
- `src/__tests__/lib/analytics/metrics-cache.test.ts`
- `src/__tests__/api/analytics/metrics.test.ts`
- Tests de performance con datasets grandes

### Métricas de éxito:

- Reducción de tiempo de respuesta de queries: < 500ms para métricas diarias
- Reducción de uso de memoria: < 100MB para cálculo de métricas
- Cache hit rate: > 80% para métricas comunes
- Reducción de tamaño de base de datos: 90% con tabla optimizada

## 📝 Documentación

### Archivos a crear/actualizar:

- `docs/analytics/ARCHITECTURE.md` - Arquitectura del sistema
- `docs/analytics/OPTIMIZATION.md` - Guía de optimizaciones implementadas
- `docs/analytics/CACHING.md` - Estrategias de cache
- `docs/analytics/MIGRATION.md` - Guía de migración de datos

## ⚠️ Consideraciones

1. **Compatibilidad hacia atrás**: Mantener APIs existentes funcionando durante migración
2. **Monitoreo**: Agregar logging y métricas de performance durante cambios
3. **Rollback plan**: Tener scripts de rollback para cada fase
4. **Testing en staging**: Probar todas las fases en ambiente de staging primero
5. **Comunicación**: Documentar cambios para el equipo

## 🚀 Priorización

**IMPLEMENTAR INMEDIATAMENTE (Reinicio Completo):**

- **Fase 0**: Limpieza y preparación de base de datos
- Impacto: Sistema limpio desde el inicio
- Urgencia: ALTA - Hacer antes de tener usuarios activos
- Esfuerzo: BAJO (1 día)

- **Fase 1**: Sistema robusto anti-bloqueadores
- Impacto: Eventos se registran incluso con bloqueadores
- Urgencia: ALTA - Crítico para capturar datos
- Esfuerzo: MEDIO (2-3 días)

- **Fase 2**: Provider unificado
- Impacto: Código limpio y mantenible
- Urgencia: MEDIA - Mejora arquitectura
- Esfuerzo: BAJO (1 día)

**Alta prioridad (Fase 1-3):**

- Modularización de código (reduce deuda técnica)
- Optimización de queries (mejora performance inmediata)
- Sistema de cache (reduce carga en BD)

**Media prioridad (Fase 4-5):**

- Consolidación de providers (mejora mantenibilidad)
- Migración a tabla optimizada (reduce costo de almacenamiento)

**Baja prioridad (Fase 6-7):**

- Sistema de archivado (optimización a largo plazo)
- Optimizaciones avanzadas (mejoras incrementales)