# 📊 Comparativa Pre vs Post-Deploy - Optimizaciones Performance

**Fecha de Comparación:** 23 de Enero, 2026  
**Reporte Pre-Deploy:** `diagnostic-report-2026-01-23T15-20-07-788Z.md`  
**Reporte Post-Deploy:** `diagnostic-report-2026-01-23T15-41-22-008Z.md`

---

## 📱 Resultados Móvil

### Scores por Categoría

| Categoría | Pre-Deploy | Post-Deploy | Cambio | Estado |
|-----------|------------|-------------|--------|--------|
| **Performance** | 38/100 | 38/100 | 0 | 🔴 Sin cambio |
| **Accessibility** | 80/100 | 80/100 | 0 | 🟡 Sin cambio |
| **Best Practices** | 57/100 | 54/100 | -3 | 🟡 Ligera regresión |
| **SEO** | 100/100 | 100/100 | 0 | 🟢 Mantiene |

### Core Web Vitals

| Métrica | Pre-Deploy | Post-Deploy | Cambio | Mejora % | Objetivo | Estado |
|---------|------------|-------------|--------|----------|----------|--------|
| **LCP** | 16.1s | 17.3s | +1.2s | -7.5% | <2.5s | 🔴 Empeoró |
| **FCP** | 3.2s | 3.2s | 0s | 0% | <1.8s | 🔴 Sin cambio |
| **CLS** | 0 | 0 | 0 | 0% | <0.1 | 🟢 Mantiene |
| **TBT** | 1,060ms | 1,210ms | +150ms | -14% | <200ms | 🔴 Empeoró |
| **SI** | 9.2s | 7.9s | -1.3s | +14% | <3.4s | 🟢 Mejoró |
| **TTI** | 16.4s | 17.6s | +1.2s | -7% | - | 🔴 Empeoró |

**Análisis Móvil:** Mejora en Speed Index (+14%), pero regresiones en LCP y TBT. Ver sección de análisis detallado.

---

## 💻 Resultados Desktop

### Scores por Categoría

| Categoría | Pre-Deploy | Post-Deploy | Cambio | Estado |
|-----------|------------|-------------|--------|--------|
| **Performance** | 90/100 | 93/100 | +3 | 🟢 Mejoró |
| **Accessibility** | 80/100 | 80/100 | 0 | 🟡 Sin cambio |
| **Best Practices** | 57/100 | 54/100 | -3 | 🟡 Ligera regresión |
| **SEO** | 100/100 | 100/100 | 0 | 🟢 Mantiene |

### Core Web Vitals

| Métrica | Pre-Deploy | Post-Deploy | Cambio | Mejora % | Objetivo | Estado |
|---------|------------|-------------|--------|----------|----------|--------|
| **LCP** | 3.5s | 3.2s | -0.3s | +9% | <2.5s | 🟢 Mejoró |
| **FCP** | 0.9s | 0.7s | -0.2s | +22% | <1s | 🟢 Mejoró |
| **CLS** | 0 | 0 | 0 | 0% | <0.1 | 🟢 Mantiene |
| **TBT** | 70ms | 60ms | -10ms | +14% | <50ms | 🟢 Mejoró |
| **SI** | 2.8s | 2.0s | -0.8s | +29% | <3.4s | 🟢 Mejoró |
| **TTI** | 3.6s | 3.3s | -0.3s | +8% | - | 🟢 Mejoró |

**Análisis Desktop:** ✅ Mejoras consistentes en todas las métricas principales. Performance Score mejoró de 90 a 93.

---

## 🔍 Verificaciones Post-Deploy

### 1. Sistema de Batching de Analytics

**Verificación:**
- [ ] Requests a `/api/analytics/events/optimized` presentes en Network tab
- [ ] Reducción de requests de 50+ a 1-2 por página
- [ ] `tenant_id` incluido en payload de eventos

**Resultado:** ⏳ Pendiente verificación

### 2. Lazy Loading de Componentes

**Verificación:**
- [ ] Chunks de JavaScript cargándose bajo demanda
- [ ] `tenant-config-*.js` cargándose solo cuando necesario
- [ ] `HeroCarousel` cargándose después del LCP

**Resultado:** ⏳ Pendiente verificación

### 3. Preload de Imágenes Hero

**Verificación:**
- [ ] Hero image con `fetchPriority: high`
- [ ] Preload tags presentes en `<head>`
- [ ] Imágenes optimizadas (<150KB)

**Resultado:** ⏳ Pendiente verificación

---

## 📝 Notas

Este documento se actualizará automáticamente una vez que se complete el análisis del reporte post-deploy.

---

**Última actualización:** 23 de Enero, 2026, 15:42
