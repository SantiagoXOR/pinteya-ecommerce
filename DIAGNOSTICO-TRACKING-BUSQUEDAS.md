# 🔴 DIAGNÓSTICO: Por qué dejaron de registrarse las búsquedas

**Fecha:** 2 de Diciembre, 2025  
**Problema:** No se registran búsquedas desde el 30 de Septiembre 2025  
**Estado:** 🐛 BUG CRÍTICO IDENTIFICADO

---

## 📊 SITUACIÓN ACTUAL

### ✅ Eventos que SÍ funcionan:
- **`page_view`**: ✅ Última: HOY 14:12:36
- **`add_to_cart`**: ✅ Última: HOY 14:12:04
- **`navigation`**: ✅ Funciona correctamente

### ❌ Eventos que NO funcionan:
- **`search`**: ❌ Última: **29 Septiembre 2025**
- **GAP:** 64 días sin búsquedas registradas

---

## 🔍 CAUSA RAÍZ IDENTIFICADA

### Problema 1: Función RPC Desactualizada

La función `insert_analytics_event_optimized` en la base de datos está **completamente desactualizada** y no coincide con el código que la llama.

#### Código Frontend/API (lo que SE ENVÍA):
```typescript
// Archivo: src/app/api/search/trending/route.ts línea 420
await supabase.rpc('insert_analytics_event_optimized', {
  p_event_name: 'search',     // ✅ Parámetro esperado
  p_category: 'search',       // ✅ Parámetro esperado
  p_action: 'search',         // ✅ Parámetro esperado
  p_label: query,             // ✅ Parámetro esperado
  p_user_id: userId,          // ✅ Parámetro esperado
  p_session_id: sessionId,    // ✅ Parámetro esperado
  p_page: '/search',          // ✅ Parámetro esperado
  p_user_agent: null,         // ✅ Parámetro esperado
})
```

#### Función en Base de Datos (lo que RECIBE):
```sql
-- Firma ACTUAL (INCORRECTA):
CREATE FUNCTION insert_analytics_event_optimized(
    event_type text,      -- ❌ No coincide
    user_uuid uuid,       -- ❌ No coincide  
    session_id text,      -- ❌ No coincide
    page_url text,        -- ❌ No coincide
    event_data jsonb      -- ❌ No coincide
)
```

**Resultado:** Los parámetros no coinciden → La función **falla silenciosamente** → No se registran búsquedas

---

### Problema 2: Tabla Incorrecta

La función actual inserta en `analytics_events` (tabla antigua) en lugar de `analytics_events_optimized` (tabla nueva).

```sql
-- FUNCIÓN ACTUAL (INCORRECTA):
INSERT INTO public.analytics_events (...)  -- ❌ Tabla antigua

-- DEBERÍA SER:
INSERT INTO analytics_events_optimized (...)  -- ✅ Tabla optimizada
```

---

### Problema 3: Migración Incompleta

El sistema migró de una tabla a otra pero no actualizó la función RPC:

```
Julio 2025:
├─ analytics_events (tabla antigua)
├─ Eventos de búsqueda funcionando
└─ Registro directo sin función RPC

Septiembre 2025:
├─ Migración a analytics_events_optimized
├─ Código actualizado para usar RPC
└─ Función RPC NO actualizada ❌

Octubre-Diciembre 2025:
├─ Código llama a función RPC rota
├─ Búsquedas fallan silenciosamente
└─ 64 días sin datos ❌
```

---

## 🎯 EVIDENCIA

### Query 1: Eventos recientes tabla antigua (HOY funcionan)
```sql
SELECT event_name, COUNT(*) FROM analytics_events
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY event_name;
```

**Resultado:**
- `page_view`: 150+ eventos
- `add_to_cart`: 15 eventos
- `search`: 0 eventos ❌

### Query 2: Búsquedas en tabla optimizada
```sql
SELECT DATE_TRUNC('month', TO_TIMESTAMP(created_at)) as mes, COUNT(*)
FROM analytics_events_optimized
WHERE event_type = 3  -- search
GROUP BY mes;
```

**Resultado:**
- Septiembre 2025: 23 búsquedas
- Octubre 2025: **0 búsquedas** ❌
- Noviembre 2025: **0 búsquedas** ❌
- Diciembre 2025: **0 búsquedas** ❌

### Query 3: Verificar firma de función
```sql
SELECT proname, prosrc FROM pg_proc 
WHERE proname = 'insert_analytics_event_optimized';
```

**Resultado:** Función existe pero con parámetros incorrectos.

---

## 🚀 SOLUCIÓN

### Paso 1: Ejecutar Script SQL de Reparación

He creado el archivo `fix-search-tracking.sql` que:

1. ✅ Elimina la función vieja rota
2. ✅ Crea la función correcta con parámetros adecuados
3. ✅ Inserta en tabla optimizada
4. ✅ Mapea correctamente event_name → event_type
5. ✅ Incluye test de verificación

**Ejecutar:**
```bash
# Opción 1: Desde terminal con psql
psql -U postgres -d tu_database -f fix-search-tracking.sql

# Opción 2: Desde Supabase Dashboard
# Ir a SQL Editor → Pegar contenido de fix-search-tracking.sql → Run
```

### Paso 2: Verificar Solución

Después de ejecutar el script:

```sql
-- Test 1: Verificar que la función existe
SELECT proname, pronargs FROM pg_proc 
WHERE proname = 'insert_analytics_event_optimized';
-- Debe devolver: pronargs = 9 (9 parámetros)

-- Test 2: Hacer una búsqueda en el sitio
-- Ir a /search y buscar "pintura"

-- Test 3: Verificar que se registró
SELECT 
    aet.name as event,
    aeo.label,
    TO_TIMESTAMP(aeo.created_at) as fecha
FROM analytics_events_optimized aeo
JOIN analytics_event_types aet ON aet.id = aeo.event_type
WHERE aeo.event_type = 3  -- search
ORDER BY aeo.created_at DESC
LIMIT 5;
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Antes del Fix:
- [x] Búsquedas NO se registran desde septiembre
- [x] Función RPC tiene parámetros incorrectos
- [x] Función inserta en tabla antigua
- [x] Gap de 64 días sin datos

### Después del Fix:
- [ ] Función RPC tiene 9 parámetros correctos
- [ ] Función inserta en `analytics_events_optimized`
- [ ] Búsquedas nuevas se registran correctamente
- [ ] Dashboard muestra búsquedas recientes

---

## 🔧 ALTERNATIVA: Rollback Temporal

Si no puedes ejecutar el SQL de inmediato, puedes hacer un fix temporal en el código:

### Opción A: Insertar directamente sin función RPC

**Modificar:** `src/app/api/search/trending/route.ts` línea 418-434

```typescript
// EN LUGAR DE:
const { error } = await supabase.rpc('insert_analytics_event_optimized', {
  p_event_name: 'search',
  // ...
})

// USAR:
const { error } = await supabase
  .from('analytics_events')  // Usar tabla antigua temporalmente
  .insert({
    event_name: 'search_query',
    category: 'search',
    action: 'search_query',
    label: query.toLowerCase().trim().substring(0, 50),
    user_id: userId,
    session_id: sessionId || 'anonymous',
    page: '/search',
    user_agent: null,
  })
```

**⚠️ IMPORTANTE:** Esto es solo un parche temporal. La solución definitiva es arreglar la función RPC.

---

## 📈 IMPACTO

### Datos Perdidos:
- **64 días** sin tracking de búsquedas
- **Estimado:** ~200-300 búsquedas no registradas
- **Período:** 30 Sept - 2 Dic 2025

### Funcionalidad Afectada:
- ❌ Dashboard de analytics no muestra búsquedas recientes
- ❌ Trending searches basado en datos antiguos
- ❌ No se puede analizar comportamiento de usuarios en Oct-Nov
- ✅ El sitio sigue funcionando (búsquedas funcionan para usuarios)

---

## 🎯 PRIORIDAD

**ALTA - FIX INMEDIATO RECOMENDADO**

1. Ejecutar `fix-search-tracking.sql`
2. Verificar con búsqueda de prueba
3. Monitorear próximas 24h
4. Documentar en changelog

---

## 📝 NOTAS TÉCNICAS

### ¿Por qué falló silenciosamente?

El código tiene un `catch` que no lanza el error:

```typescript
if (error) {
  console.error('Error registrando búsqueda en analytics:', error)
  // ❌ NO lanza el error, solo lo registra en console
} else {
  // ✅ Success (pero nunca llega aquí)
}
```

### ¿Por qué page_view sigue funcionando?

Los eventos `page_view` y `add_to_cart` se registran con un método diferente que NO usa la función RPC rota:

```typescript
// Método alternativo que SÍ funciona
await supabase.from('analytics_events').insert({
  event_name: 'page_view',
  // ...
})
```

---

**Archivo generado automáticamente**  
**Siguiente paso:** Ejecutar `fix-search-tracking.sql` en Supabase


