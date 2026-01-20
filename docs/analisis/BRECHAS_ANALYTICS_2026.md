# Brechas Identificadas en el Sistema de Analytics

**Fecha de Análisis**: 19 de Enero de 2026  
**Última Actualización**: 20 de Enero de 2026  
**Basado en**: Análisis de Orden #395 (Primera Venta)  
**Estado**: ✅ Correcciones Implementadas (5 de 7 brechas resueltas)

---

## Resumen Ejecutivo

Durante el análisis de la primera venta (Orden #395), se identificaron 7 brechas en el sistema de analytics que afectan la capacidad de tracking y análisis del customer journey. Este documento detalla cada brecha, su impacto y las acciones correctivas implementadas.

### Estado de Correcciones (20 de Enero, 2026)

| # | Brecha | Estado | Commit |
|---|--------|--------|--------|
| 1 | Tabla `analytics_events` vacía | ⏳ Pendiente | - |
| 2 | Sin vinculación usuario-sesión | ✅ **Corregido** | `3b7aa378` |
| 3 | Trigger de `order_status_history` | ✅ **Corregido** | `3b7aa378` |
| 4 | Eventos duplicados de page_view | ✅ **Corregido** | `3b7aa378` |
| 5 | Sin tracking de product_view | ⏳ Pendiente | - |
| 6 | Sin `visitor_hash` | ✅ **Corregido** | `3b7aa378` |
| 7 | Sin tracking de búsquedas | ✅ **Corregido** | `3b7aa378` |

---

## Brechas Críticas

### 1. Tabla `analytics_events` Vacía

**Descripción**:  
La tabla original `analytics_events` contiene 0 registros, mientras que todos los eventos se están guardando en `analytics_events_optimized` (5,825 eventos).

**Evidencia**:
```sql
SELECT COUNT(*) FROM analytics_events;
-- Resultado: 0

SELECT COUNT(*) FROM analytics_events_optimized;
-- Resultado: 5825
```

**Impacto**:
- RPCs y funciones que consultan `analytics_events` no encuentran datos
- Posible confusión en el código sobre qué tabla usar
- Métricas calculadas con funciones antiguas retornan vacío

**Causa Probable**:
- La migración a la tabla optimizada no mantiene sincronización
- El endpoint de API escribe directamente en la tabla optimizada

**Acción Recomendada**:
1. Migrar completamente a `analytics_events_optimized`
2. Actualizar todas las funciones RPC para usar la tabla optimizada
3. Deprecar o eliminar la tabla `analytics_events` original

---

### 2. Sin Vinculación Usuario-Sesión

**Descripción**:  
Los eventos de analytics no contienen el `user_id` del cliente, aunque este proporcionó sus datos durante el checkout.

**Evidencia**:
```sql
-- Eventos de la sesión de compra
SELECT user_id FROM analytics_events_optimized 
WHERE session_hash = 381438529;
-- Resultado: todos NULL

-- Pero el usuario existe
SELECT id FROM user_profiles 
WHERE id = '10867c19-c1b1-4ace-a7d2-913c156ccccb';
-- Resultado: existe
```

**Impacto**:
- No se puede vincular comportamiento previo con compras
- Análisis de customer journey incompleto
- No se puede medir LTV (Lifetime Value) por usuario

**Causa**:
- El `user_id` no se pasa al crear eventos en checkout de cash
- El provider de analytics no tiene acceso al usuario en ese momento

**Acción Recomendada**:
1. Modificar `SimpleAnalyticsProvider` para capturar user_id cuando esté disponible
2. Actualizar el endpoint de checkout para pasar user_id a los eventos
3. Implementar vinculación retroactiva por session_hash

---

### 3. Trigger de `order_status_history` No Funciona

**Descripción**:  
El trigger `log_order_status_change` no registró el cambio de estado `pending` → `processing`.

**Evidencia**:
```sql
SELECT * FROM order_status_history WHERE order_id = 395;
-- Resultado: 0 filas
```

**Impacto**:
- Sin audit trail de cambios de estado
- No se puede analizar tiempo entre estados
- Pérdida de información para reporting

**Causa Probable**:
- El trigger puede estar inactivo
- La actualización de estado se hizo de forma que bypassea el trigger
- El trigger solo captura cambios vía UPDATE, no estados iniciales

**✅ CORREGIDO (20 de Enero, 2026)**:

Se implementó la migración `20260119_fix_order_status_history_trigger.sql`:

1. **Nuevo trigger `trigger_log_order_initial_status`**: Captura el estado inicial al crear la orden
2. **Mejorado trigger `log_order_status_change`**: Con SECURITY DEFINER para bypassear RLS
3. **Tracking de `payment_status`**: También registra cambios en el estado de pago
4. **Migración retroactiva**: Se registró historial para las 21 órdenes existentes

**Verificación**:
```sql
SELECT COUNT(*) FROM order_status_history WHERE order_id = 395;
-- Resultado: 1 (estado retroactivo registrado)

-- Triggers activos:
-- trigger_log_order_initial_status (INSERT)
-- trigger_log_order_status_change (UPDATE)
```

---

### 4. Eventos Duplicados de Page View

**Descripción**:  
Se registran múltiples eventos `page_view` para la misma página en el mismo segundo.

**Evidencia**:
```sql
-- 18 page_views a "/" en el mismo segundo
SELECT COUNT(*) FROM analytics_events_optimized 
WHERE session_hash = 381438529 
  AND page_id = 1 
  AND created_at = 1768837757;
-- Resultado: 18
```

**Impacto**:
- Métricas de page views infladas
- Mayor uso de storage
- Análisis de comportamiento distorsionado

**Causa**:
- Re-renders de React disparan múltiples tracking
- Falta de debounce en el provider de analytics
- Strict Mode en desarrollo duplica efectos

**✅ CORREGIDO (20 de Enero, 2026)**:

Modificaciones en `SimpleAnalyticsProvider.tsx`:

1. **Debounce de 500ms**: Agregado timeout antes de enviar page_view
2. **Deduplicación por referencia**: `lastPageViewRef` evita re-tracking de la misma página
3. **Timestamp de última vista**: `lastPageViewTimeRef` controla el tiempo entre eventos

```typescript
// Constantes para debounce
const PAGE_VIEW_DEBOUNCE_MS = 500

// Referencias para deduplicación
const lastPageViewRef = useRef<string | null>(null)
const lastPageViewTimeRef = useRef<number>(0)
```

---

### 5. Sin Tracking de Product View

**Descripción**:  
No hay eventos `product_view` (event_type=4) en el journey del cliente.

**Evidencia**:
```sql
SELECT * FROM analytics_events_optimized 
WHERE session_hash = 381438529 AND event_type = 4;
-- Resultado: 0 filas
```

**Impacto**:
- No se sabe qué productos vio el cliente antes de agregar al carrito
- Métricas de conversión product_view → add_to_cart no disponibles
- Análisis de interés de productos incompleto

**Causa**:
- El cliente agregó desde `/search` sin visitar página de producto
- El quick-add desde search no trackea vista de producto
- Modal de producto no dispara evento de vista

**Acción Recomendada**:
1. Agregar `product_view` cuando se muestra producto en search results
2. Trackear apertura de quick-view/modal de producto
3. Considerar "impression" como evento separado

---

## Brechas Menores

### 6. Sin `visitor_hash` para Usuarios Recurrentes

**Descripción**:  
El campo `visitor_hash` está en NULL para todos los eventos, perdiendo capacidad de identificar usuarios recurrentes anónimos.

**Evidencia**:
```sql
SELECT DISTINCT visitor_hash FROM analytics_events_optimized;
-- Resultado: NULL (único valor)
```

**Impacto**:
- No se puede trackear usuarios que regresan sin login
- Análisis de retención de visitantes anónimos imposible
- Pérdida de datos para remarketing

**✅ CORREGIDO (20 de Enero, 2026)**:

Implementación en `SimpleAnalyticsProvider.tsx`:

1. **Función `getOrCreateVisitorHash()`**: Genera hash único basado en:
   - Timestamp
   - Random value
   - Browser fingerprint (userAgent, language, screen, timezone)

2. **Persistencia en localStorage**: Clave `pinteya_visitor_hash`

3. **Inclusión en eventos**: Se envía en cada evento de analytics

```typescript
const VISITOR_HASH_KEY = 'pinteya_visitor_hash'

const getOrCreateVisitorHash = (): string => {
  let visitorHash = localStorage.getItem(VISITOR_HASH_KEY)
  if (!visitorHash) {
    // Generar hash único...
    visitorHash = `vh_${hash}_${timestamp}`
    localStorage.setItem(VISITOR_HASH_KEY, visitorHash)
  }
  return visitorHash
}
```

---

### 7. Sin Tracking de Términos de Búsqueda

**Descripción**:  
No hay eventos `search` (event_type=3) que capturen qué buscó el cliente.

**Evidencia**:
```sql
SELECT * FROM analytics_events_optimized 
WHERE session_hash = 381438529 AND event_type = 3;
-- Resultado: 0 filas
```

**Impacto**:
- No se conoce qué buscó el cliente
- No se pueden analizar términos populares
- Pérdida de insights para SEO y catálogo

**Causa**:
- El componente de búsqueda no dispara evento de analytics
- Solo se trackea navegación a `/search`, no el término

**✅ CORREGIDO (20 de Enero, 2026)**:

Modificaciones en `useSearchOptimized.ts`:

1. **Integración con `useAnalytics`**: Importa `trackSearch` del provider
2. **Tracking en `executeSearch`**: Captura término y cantidad de resultados

```typescript
import { useAnalytics } from '@/components/Analytics/SimpleAnalyticsProvider'

// En el hook
const { trackSearch: trackSearchAnalytics } = useAnalytics()

// En executeSearch
trackSearchAnalytics(searchQuery.trim(), resultsCount)
```

**Datos capturados**:
- `searchTerm`: El término buscado
- `results`: Cantidad de resultados encontrados
- `event_type`: 3 (search)

---

## Matriz de Priorización

| Brecha | Severidad | Esfuerzo | Prioridad | Estado |
|--------|-----------|----------|-----------|--------|
| Tabla vacía | Alta | Medio | P1 | ⏳ Pendiente |
| Sin user_id | Alta | Bajo | P1 | ✅ Corregido |
| Trigger roto | Alta | Bajo | P1 | ✅ Corregido |
| Duplicados | Media | Bajo | P2 | ✅ Corregido |
| Sin product_view | Media | Medio | P2 | ⏳ Pendiente |
| Sin visitor_hash | Baja | Bajo | P3 | ✅ Corregido |
| Sin search tracking | Baja | Bajo | P3 | ✅ Corregido |

---

## Plan de Acción

### Fase 1: Correcciones Críticas (Inmediato) - ✅ COMPLETADA

1. **✅ Revisar y reparar trigger de order_status_history**
   - Archivo: `supabase/migrations/20260119_fix_order_status_history_trigger.sql`
   - Commit: `3b7aa378`
   
2. **✅ Vincular user_id en eventos de checkout**
   - Archivo: `src/app/api/analytics/events/route.ts`
   - Commit: `3b7aa378`

### Fase 2: Optimizaciones de Calidad (Corto Plazo) - ✅ COMPLETADA

3. **✅ Implementar debounce para page_view**
   - Archivo: `src/components/Analytics/SimpleAnalyticsProvider.tsx`
   - Commit: `3b7aa378`

4. **⏳ Agregar tracking de product_view desde search** (Pendiente)
   - Archivo: `src/components/ui/product-card-commercial/ProductCardCommercial.tsx`
   - Nota: Requiere modificar componente de producto para trackear impresiones

### Fase 3: Mejoras de Tracking (Mediano Plazo) - ✅ COMPLETADA

5. **✅ Implementar visitor_hash**
   - Archivo: `src/components/Analytics/SimpleAnalyticsProvider.tsx`
   - Commit: `3b7aa378`

6. **✅ Agregar tracking de búsquedas**
   - Archivo: `src/hooks/useSearchOptimized.ts`
   - Commit: `3b7aa378`

### Pendiente

7. **⏳ Migrar completamente a `analytics_events_optimized`**
   - Deprecar tabla `analytics_events` original
   - Actualizar funciones RPC que aún usen la tabla antigua

---

## Métricas de Éxito

Estado después de implementar las correcciones (20 de Enero, 2026):

| Métrica | Estado Antes | Estado Después | Objetivo |
|---------|--------------|----------------|----------|
| Eventos con user_id | 0% | ✅ Implementado | >80% (usuarios logueados) |
| Órdenes con historial | 0% | ✅ 100% (21/21) | 100% |
| Page views duplicados | ~10x | ✅ Debounce activo | 1x |
| Eventos de product_view | 0 | ⏳ Pendiente | Por cada add_to_cart |
| Búsquedas trackeadas | 0% | ✅ Implementado | 100% |
| Visitor hash | 0% | ✅ Implementado | 100% |

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/Analytics/SimpleAnalyticsProvider.tsx` | Debounce, visitor_hash |
| `src/app/api/analytics/events/route.ts` | Mejor vinculación user_id |
| `src/hooks/useSearchOptimized.ts` | Tracking de búsquedas |
| `supabase/migrations/20260119_fix_order_status_history_trigger.sql` | Triggers de historial |

---

## Referencias

- [Documento de Orden #395](./ORDEN_395_PRIMERA_VENTA.md)
- [Arquitectura de Analytics](../analytics/ARCHITECTURE.md)
- [Estado del Sistema Analytics](../analytics/REINICIO_SISTEMA_2026-01-16.md)
- [Commit de correcciones](https://github.com/SantiagoXOR/pinteya-ecommerce/commit/3b7aa378)

---

*Documento actualizado el 20 de Enero de 2026 - Pinteya E-commerce*
