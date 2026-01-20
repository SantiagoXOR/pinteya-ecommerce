# Brechas Identificadas en el Sistema de Analytics

**Fecha de Análisis**: 19 de Enero de 2026  
**Basado en**: Análisis de Orden #395 (Primera Venta)  
**Estado**: Requiere acción

---

## Resumen Ejecutivo

Durante el análisis de la primera venta (Orden #395), se identificaron 7 brechas en el sistema de analytics que afectan la capacidad de tracking y análisis del customer journey. Este documento detalla cada brecha, su impacto y las acciones correctivas recomendadas.

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

**Acción Recomendada**:
1. Verificar que el trigger esté activo
2. Agregar inserción manual del estado inicial al crear orden
3. Revisar la lógica del trigger para cubrir todos los casos

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

**Acción Recomendada**:
1. Implementar debounce de 500ms para page_view
2. Agregar deduplicación en el servidor
3. Usar referencia para evitar re-tracking en mismo render

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

**Acción Recomendada**:
1. Generar hash único por dispositivo/navegador
2. Persistir en localStorage
3. Enviar con cada evento de analytics

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

**Acción Recomendada**:
1. Capturar término de búsqueda al ejecutar query
2. Guardar en analytics con event_type=3
3. Incluir cantidad de resultados en metadata

---

## Matriz de Priorización

| Brecha | Severidad | Esfuerzo | Prioridad |
|--------|-----------|----------|-----------|
| Tabla vacía | Alta | Medio | P1 |
| Sin user_id | Alta | Bajo | P1 |
| Trigger roto | Alta | Bajo | P1 |
| Duplicados | Media | Bajo | P2 |
| Sin product_view | Media | Medio | P2 |
| Sin visitor_hash | Baja | Bajo | P3 |
| Sin search tracking | Baja | Bajo | P3 |

---

## Plan de Acción

### Fase 1: Correcciones Críticas (Inmediato)

1. **Revisar y reparar trigger de order_status_history**
   - Archivo: `supabase/migrations/YYYYMMDD_fix_order_status_trigger.sql`
   
2. **Vincular user_id en eventos de checkout**
   - Archivo: `src/app/api/analytics/events/route.ts`

### Fase 2: Optimizaciones de Calidad (Corto Plazo)

3. **Implementar debounce para page_view**
   - Archivo: `src/components/Analytics/SimpleAnalyticsProvider.tsx`

4. **Agregar tracking de product_view desde search**
   - Archivo: `src/components/ui/product-card-commercial/ProductCardCommercial.tsx`

### Fase 3: Mejoras de Tracking (Mediano Plazo)

5. **Implementar visitor_hash**
   - Archivo: `src/lib/integrations/analytics/index.ts`

6. **Agregar tracking de búsquedas**
   - Archivo: `src/components/search/SearchInput.tsx`

---

## Métricas de Éxito

Después de implementar las correcciones:

| Métrica | Estado Actual | Objetivo |
|---------|---------------|----------|
| Eventos con user_id | 0% | >80% (usuarios logueados) |
| Órdenes con historial | 0% | 100% |
| Page views duplicados | ~10x | 1x |
| Eventos de product_view | 0 | Por cada add_to_cart |
| Búsquedas trackeadas | 0% | 100% |

---

## Referencias

- [Documento de Orden #395](./ORDEN_395_PRIMERA_VENTA.md)
- [Arquitectura de Analytics](../analytics/ARCHITECTURE.md)
- [Estado del Sistema Analytics](../analytics/REINICIO_SISTEMA_2026-01-16.md)

---

*Documento generado como parte del análisis de la primera venta - Pinteya E-commerce*
