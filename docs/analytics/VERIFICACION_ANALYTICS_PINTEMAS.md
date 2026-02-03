# Verificación de Analytics para Pintemas

**Objetivo**: Comprobar que el sistema de analytics registra eventos por tenant y que el dashboard de admin muestra solo métricas de Pintemas cuando se accede desde www.pintemas.com.

---

## 1. RPC y tenant_id

Tras aplicar la migración `20260202100000_add_tenant_id_to_analytics_rpc.sql`, la función `insert_analytics_event_optimized` acepta `p_tenant_id` y persiste `tenant_id` en `analytics_events_optimized`.

**Comprobar en Supabase (SQL)**:

```sql
-- Ver firma de la función (debe incluir p_tenant_id)
SELECT pg_get_function_arguments(oid) AS args
FROM pg_proc
WHERE proname = 'insert_analytics_event_optimized';

-- Eventos recientes por tenant (últimos 7 días): identificar NULL vs Pintemas
SELECT tenant_id, COUNT(*) AS total
FROM analytics_events_optimized
WHERE created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days')::INTEGER
GROUP BY tenant_id;
```

Si hay muchos eventos con `tenant_id` NULL y pocos/ninguno con el UUID de Pintemas, el fallo está en la **escritura** (track/optimized). Si hay eventos con tenant Pintemas pero el dashboard sigue en cero, el fallo está en la **lectura** (API métricas o detección de tenant).

---

## 2. Flujo E2E desde www.pintemas.com

### Pasos manuales

1. Abrir **https://www.pintemas.com** (o en local con `NEXT_PUBLIC_DEV_TENANT_SLUG=pintemas`).
2. Navegar por la home (dispara `page_view`).
3. Abrir un producto (dispara `view_item` / `product_view`).
4. Agregar al carrito (dispara `add_to_cart`).

### Comprobar eventos en BD

Ejecutar en Supabase SQL o con el script de verificación:

```sql
SELECT id, event_type, tenant_id, created_at, product_id, product_name
FROM analytics_events_optimized
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'pintemas')
ORDER BY created_at DESC
LIMIT 10;
```

Los eventos recientes deben tener `tenant_id` = UUID de Pintemas (no NULL).

**Script automático**:

```bash
node docs/analytics/verify-analytics-pintemas.js
```

Requiere `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Si no se usa el script, ejecutar las consultas SQL de esta sección en Supabase (SQL Editor).

---

## 3. Dashboard admin

1. Iniciar sesión como usuario con rol admin (tenant Pintemas si aplica).
2. Entrar en **https://www.pintemas.com/admin/analytics** (o equivalente en local).
3. Comprobar que las métricas (vistas, carritos, checkouts, compras) corresponden solo al tráfico de Pintemas.

La API `/api/analytics/metrics` usa `getTenantConfig()` y filtra por `tenant_id`, por lo que cada dominio ve solo sus datos.

---

## 4. GA4 / Meta Pixel (opcional)

Si Pintemas debe tener Google Analytics 4 y/o Meta Pixel:

1. En Supabase, ejecutar:

```sql
UPDATE tenants
SET
  ga4_measurement_id = 'G-XXXXXXXX',  -- ID de medición GA4 de Pintemas
  meta_pixel_id = 'XXXXXXXX'         -- ID del Pixel de Meta de Pintemas
WHERE slug = 'pintemas';
```

2. Recargar www.pintemas.com y en DevTools (Network) comprobar que se cargan requests a `googletagmanager.com` y/o `facebook.net`.

Sin este UPDATE, el analytics interno (Supabase) sigue funcionando; solo no se cargan los scripts de GA4/Meta en el sitio de Pintemas.

---

## 5. Testing automatizado

### Tests de integración (Jest)

Verifican que las APIs de analytics devuelven 200 y la estructura esperada cuando el tenant es Pintemas (vía `__TENANT_TEST_GET_CONFIG__`).

```bash
npm run test:multitenant:integration
```

Para ejecutar solo los tests de analytics Pintemas:

```bash
npm run test:multitenant:integration -- --testPathPattern=metrics-pintemas
```

### Tests E2E (Playwright) – panel /admin/analytics como Pintemas

Verifican que el panel `/admin/analytics` carga y muestra contenido cuando se accede como tenant Pintemas, y que `/api/analytics/metrics` responde 200.

**Opción A – Variable de entorno (recomendado en CI/local):**

1. Arrancar el servidor con tenant Pintemas y bypass de auth:

   ```bash
   set NEXT_PUBLIC_DEV_TENANT_SLUG=pintemas
   set BYPASS_AUTH=true
   npm run dev
   ```

2. En otra terminal, ejecutar los E2E multitenant (incluye `tenant-analytics.spec.ts`):

   ```bash
   npm run test:multitenant:e2e
   ```

   Solo el spec de analytics:

   ```bash
   npx playwright test --config=playwright.multitenant.config.ts tenant-analytics.spec.ts
   ```

**Opción B – Host alternativo:**

- Añadir `127.0.0.1 pintemas.localhost` al archivo `hosts`.
- Usar `PLAYWRIGHT_BASE_URL=http://pintemas.localhost:3000` al ejecutar Playwright (y levantar el servidor en el puerto 3000).

### Comprobación manual opcional

1. Levantar la app con `NEXT_PUBLIC_DEV_TENANT_SLUG=pintemas` y `BYPASS_AUTH=true`.
2. Abrir **http://localhost:3000/admin/analytics**.
3. Comprobar que el dashboard carga (pestañas Dashboard/Funnel/Heatmap o botón Actualizar) y que las métricas corresponden al tenant Pintemas.

---

## Resumen

| Verificación              | Cómo                                                                 |
|---------------------------|----------------------------------------------------------------------|
| RPC con p_tenant_id       | Migración aplicada + `pg_get_function_arguments` en Supabase       |
| Eventos con tenant_id     | `SELECT ... FROM analytics_events_optimized WHERE tenant_id = ...`   |
| Dashboard por tenant       | Login en pintemas.com → /admin/analytics → métricas solo Pintemas  |
| GA4/Meta (opcional)        | UPDATE tenants SET ga4_measurement_id, meta_pixel_id WHERE slug    |
| Testing automatizado       | Jest: `test:multitenant:integration`; E2E: `test:multitenant:e2e` con Pintemas (env o pintemas.localhost); ver sección 5 |
