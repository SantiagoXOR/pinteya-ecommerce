# Resumen Comparación: Base de Datos vs Panel de Analytics

**Fecha:** 2026-01-16  
**Período analizado:** Últimos 7 días

## 📊 Resumen General de Eventos en BD

### Métricas Totales
- **Total eventos:** 507
- **Sesiones únicas:** 9
- **Usuarios únicos:** 2
- **Vistas de página:** 449
- **Add to cart:** 3
- **Begin checkout:** 1
- **Purchase:** 2
- **Búsquedas:** 3
- **Interacciones (clicks/hovers/scrolls):** 47

### Desglose por Tipo de Evento

| Evento | Categoría | Acción | Total | Sesiones Únicas | Usuarios Únicos |
|--------|-----------|--------|-------|------------------|-----------------|
| page_view | navigation | view | 449 | 9 | 2 |
| user_signup | engagement | hover | 29 | 2 | 1 |
| click | engagement | click | 16 | 1 | 1 |
| search | search | search | 3 | 3 | 0 |
| add_to_cart | ecommerce | add | 3 | 1 | 1 |
| purchase | ecommerce | purchase | 2 | 1 | 1 |
| page_view | ecommerce | purchase | 2 | 1 | 1 |
| user_login | engagement | scroll | 2 | 2 | 0 |
| begin_checkout | ecommerce | signup | 1 | 1 | 1 |

## 🔍 Búsquedas Específicas

### Eventos de Búsqueda en BD
1. **"aerosol"** - 2026-01-16 15:04:32 (página: /search)
2. **"aerosol"** - 2026-01-16 15:26:27 (página: /search)
3. **"aerosoles"** - 2026-01-16 15:26:32 (página: /search)

**Total:** 3 búsquedas (2x "aerosol", 1x "aerosoles")

## 🖱️ Interacciones (Clicks, Hovers, Scrolls)

### Eventos de Interacción en BD
- **user_signup (hover):** 29 eventos, 2 sesiones, 5 páginas
- **click:** 16 eventos, 1 sesión, 5 páginas
- **user_login (scroll):** 2 eventos, 2 sesiones, 1 página

**Total:** 47 interacciones

**Nota:** Hay eventos con `event_name` incorrecto (user_signup, user_login) pero con `action` correcto (hover, scroll). Esto sugiere un problema en el mapeo de eventos.

## 🛒 Eventos de E-commerce

| Evento | Total | Sesiones | Usuarios | Valor Total |
|--------|-------|-----------|----------|-------------|
| add_to_cart | 3 | 1 | 1 | - |
| begin_checkout | 1 | 1 | 1 | $80,553.00 |
| purchase | 2 | 1 | 1 | $93,732.40 |

**Problema identificado:** `begin_checkout` tiene `action: signup` en lugar de `action: begin_checkout`, lo que puede causar problemas en el filtrado.

## 📄 Páginas Más Visitadas

| Página | Vistas | Sesiones Únicas | Usuarios Únicos |
|--------|--------|-----------------|------------------|
| / | 381 | 8 | 2 |
| /admin/analytics | 32 | 2 | 1 |
| /checkout/cash-success | 10 | 1 | 1 |
| /admin/products | 7 | 3 | 2 |
| /admin/products/108 | 6 | 3 | 2 |
| /checkout/meta | 3 | 1 | 1 |
| /admin/products/new | 2 | 1 | 1 |
| /admin/orders | 2 | 1 | 1 |
| /search | 1 | 1 | 1 |
| /admin/products/108/edit | 1 | 1 | 0 |

## 📊 Comparación: BD vs Panel de Analytics

### ✅ Coincidencias

1. **Sesiones únicas:** BD = 9, Panel muestra "4" (discrepancia menor)
2. **Usuarios únicos:** BD = 2, Panel muestra "2" ✅
3. **Add to cart:** BD = 3, Panel muestra "2" en resumen, "3" en tiempo real ✅
4. **Purchase:** BD = 2, Panel muestra "2" en resumen, "4" en tiempo real (incluye page_view incorrectos)
5. **Páginas más visitadas:** Coinciden aproximadamente

### ❌ Discrepancias Críticas

#### 1. **Búsquedas**
- **BD:** 3 búsquedas (2x "aerosol", 1x "aerosoles")
- **Panel:** Muestra "0" búsquedas y "No hay datos de búsquedas disponibles"
- **Problema:** El filtro de `calculateSearchAnalytics` no está encontrando los eventos correctamente

#### 2. **Begin Checkout**
- **BD:** 1 evento de `begin_checkout` (con `action: signup` incorrecto)
- **Panel:** Muestra "0 usuarios" en "Checkouts iniciados"
- **Problema:** El filtro requiere `eventName === 'begin_checkout' AND action === 'begin_checkout'`, pero el evento tiene `action: signup`

#### 3. **Interacciones**
- **BD:** 47 interacciones (29 hovers, 16 clicks, 2 scrolls)
- **Panel:** Muestra "0 total" para todas las páginas
- **Problema:** Los eventos tienen `event_name` incorrecto (user_signup, user_login) en lugar de (click, hover, scroll), lo que hace que el filtro no los encuentre

#### 4. **Vistas de Producto**
- **BD:** No hay eventos específicos de `view_item` o `product_view`
- **Panel:** Muestra "0" vistas de productos
- **Nota:** Esto puede ser correcto si no se están trackeando vistas de productos individuales

## 🔧 Problemas Identificados

### 1. Mapeo Incorrecto de Eventos
- Los eventos de interacción se están guardando con `event_name` incorrecto:
  - `user_signup` en lugar de `hover`
  - `user_login` en lugar de `scroll`
  - Esto sugiere que hay un problema en cómo se están guardando los eventos desde el frontend

### 2. Filtros Muy Estrictos
- El filtro de `begin_checkout` requiere que tanto `eventName` como `action` sean correctos
- El filtro de búsquedas puede no estar encontrando eventos con `action: 'search'`
- El filtro de interacciones busca `action` correcto pero los eventos tienen `event_name` incorrecto

### 3. Eventos Duplicados/Incorrectos
- Hay 2 eventos de `page_view` con `action: purchase` que no deberían existir
- Estos eventos están siendo contados como purchases en algunos cálculos

## 📝 Recomendaciones

1. **Corregir mapeo de eventos de interacción:**
   - Asegurar que los eventos de hover, click y scroll se guarden con `event_name` correcto
   - Revisar `ElementTracker` y cómo envía los eventos

2. **Ajustar filtros en `metrics-calculator.ts`:**
   - Hacer los filtros más flexibles para aceptar eventos con `eventName` correcto aunque `action` sea incorrecto
   - O viceversa: aceptar `action` correcto aunque `eventName` sea incorrecto

3. **Corregir eventos de búsqueda:**
   - Verificar que `calculateSearchAnalytics` encuentre eventos con `action: 'search'`
   - Asegurar que el filtro de fecha se aplique correctamente

4. **Limpiar eventos incorrectos:**
   - Eliminar o corregir los 2 eventos de `page_view` con `action: purchase`
   - Corregir el evento de `begin_checkout` con `action: signup`

5. **Mejorar tracking de interacciones:**
   - Asegurar que `ElementTracker` envíe eventos con `event_name` correcto
   - Verificar que los listeners globales estén funcionando correctamente
