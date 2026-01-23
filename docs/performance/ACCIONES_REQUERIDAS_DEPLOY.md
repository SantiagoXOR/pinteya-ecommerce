# 🚀 Acciones Requeridas para Deploy

**Fecha:** 23 de Enero, 2026  
**Estado:** Optimizaciones implementadas, pendientes de deploy

---

## ✅ Completado

1. ✅ **Migración de Base de Datos** - Aplicada exitosamente
   - RPC `insert_analytics_event_optimized` actualizado con `p_tenant_id`
   - Función lista para recibir eventos con tenant_id

2. ✅ **Código Optimizado** - Implementado localmente
   - Sistema de batching multitenant
   - Code splitting optimizado
   - Lazy loading de componentes
   - Preload de imágenes hero
   - Critical CSS inline
   - Mejoras de accesibilidad

---

## ⚠️ Acciones Requeridas ANTES del Deploy

### 1. Verificar que UnifiedAnalyticsProvider use Sistema Optimizado

**Archivo:** `src/components/Analytics/UnifiedAnalyticsProvider.tsx`

**Cambio realizado:**
- ✅ Actualizado para usar `optimizedAnalytics.trackEvent()` en lugar de `sendStrategies.sendEvent()`
- ✅ Fallback al sistema legacy si el optimizado falla

**Verificación:**
- [ ] Confirmar que el cambio está aplicado
- [ ] Probar que los eventos se envían correctamente
- [ ] Verificar que el batching funciona (Network tab debe mostrar menos requests)

### 2. Verificar Optimización de Imágenes Hero

**Archivos a verificar:**
- `public/tenants/pinteya/hero/hero1.webp` - Debe ser <150KB
- `public/tenants/pinteya/hero/hero2.webp` - Debe ser <150KB
- `public/tenants/pinteya/hero/hero3.webp` - Debe ser <150KB

**Acción si >150KB:**
```bash
# Ejecutar script de compresión (si existe)
node scripts/optimize-pintemas-hero.js
```

### 3. Verificar Variables de Entorno

**Variables requeridas:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Variables de tenant configuradas

---

## 📋 Checklist Pre-Deploy

### Código
- [x] Build exitoso (`npm run build`)
- [x] Sin errores de linting
- [x] Migración DB aplicada
- [ ] UnifiedAnalyticsProvider actualizado (cambio aplicado, requiere verificación)
- [ ] Imágenes hero optimizadas (<150KB cada una)

### Testing
- [ ] Probar tracking de eventos en desarrollo
- [ ] Verificar que batching funciona (Network tab)
- [ ] Verificar que tenant_id se incluye en eventos
- [ ] Probar lazy loading de componentes
- [ ] Verificar preload de imágenes hero

### Deploy
- [ ] Deploy a staging
- [ ] Verificar funcionalidad en staging
- [ ] Ejecutar Lighthouse en staging
- [ ] Deploy a producción
- [ ] Verificar funcionalidad en producción
- [ ] Ejecutar Lighthouse en producción
- [ ] Comparar métricas con baseline

---

## 🎯 Resultados Esperados Post-Deploy

### Móvil

| Métrica | Actual | Esperado | Mejora |
|---------|--------|----------|--------|
| Performance | 38 | 80+ | +111% |
| LCP | 16.1s | <2.5s | -84% |
| FCP | 3.2s | <1.8s | -44% |
| TBT | 1,060ms | <200ms | -81% |
| SI | 9.2s | <3.4s | -63% |

### Desktop

| Métrica | Actual | Esperado | Mejora |
|---------|--------|----------|--------|
| Performance | 90 | 98+ | +9% |
| LCP | 3.5s | <2.5s | -29% |
| FCP | 0.9s | <1s | Mantener |
| TBT | 70ms | <50ms | -29% |

---

## 🔍 Verificación Post-Deploy

### 1. Verificar Batching de Analytics

**En Network tab del navegador:**
- Debe haber **1-2 requests** a `/api/analytics/events/optimized` en lugar de 50+ a `/api/track/events`
- Los requests deben incluir `tenant_id` en el payload

### 2. Verificar Lazy Loading

**En Network tab:**
- Chunks de JavaScript deben cargarse bajo demanda
- `tenant-config-*.js` debe cargarse solo cuando sea necesario
- `HeroCarousel` debe cargarse después del LCP

### 3. Verificar Preload de Imágenes

**En Network tab:**
- Hero image debe tener `fetchPriority: high`
- Debe aparecer en la lista de preloads en `<head>`

### 4. Ejecutar Lighthouse

```bash
npm run lighthouse:diagnostic
```

**Comparar:**
- Performance Score: ___ → Objetivo: 80+ (móvil)
- LCP: ___ → Objetivo: <2.5s (móvil)
- TBT: ___ → Objetivo: <200ms (móvil)

---

## 📝 Notas Importantes

1. **El código en producción actualmente NO tiene las optimizaciones** - Requiere deploy
2. **La migración de DB ya está aplicada** - No requiere acción adicional
3. **Los resultados de Lighthouse actuales son del código legacy** - No reflejan las optimizaciones
4. **Re-ejecutar Lighthouse después del deploy** para ver mejoras reales

---

**Última actualización:** 23 de Enero, 2026
