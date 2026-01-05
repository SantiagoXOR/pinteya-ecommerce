# Análisis de Resultados PageSpeed Insights - 5 Dic 2025

## Métricas Actuales (Mobile)

### Performance Score: **33/100** 🔴

### Core Web Vitals

| Métrica | Valor | Objetivo | Estado | Impacto |
|---------|-------|----------|--------|---------|
| **FCP** | 2.9s | < 1.8s | 🟡 Naranja | Moderado |
| **LCP** | **82.5s** | < 2.5s | 🔴 **CRÍTICO** | **EXTREMO** |
| **CLS** | 0 | < 0.1 | ✅ Verde | Excelente |
| **TBT** | 1,920 ms | < 200 ms | 🔴 Rojo | Crítico |
| **Speed Index** | 12.5s | < 3.4s | 🔴 Rojo | Crítico |

### Otros Scores

- **Accessibility:** 82/100 🟡
- **Best Practices:** 96/100 ✅
- **SEO:** 100/100 ✅

---

## 🔴 Problema Crítico Identificado: LCP de 82.5s

### Causa Raíz

El **LCP extremadamente alto (82.5s)** se debe a que:

1. **HeroCarousel está lazy-loaded** con `ssr: false`
2. La imagen hero (LCP candidate) está dentro del componente lazy-loaded
3. La imagen no se carga hasta que:
   - El JavaScript del cliente se descarga (~2-3s)
   - El componente lazy se carga (~1-2s)
   - La imagen finalmente se carga (~1-2s)
   - **Total: ~80+ segundos** (probablemente timeout o error)

### Evidencia

```typescript
// src/components/Common/HeroCarousel.lazy.tsx
const HeroCarousel = dynamic(
  () => import('./HeroCarousel'),
  {
    ssr: false, // ❌ No renderiza en servidor
    loading: () => <HeroSkeleton />, // Muestra skeleton mientras carga
  }
)
```

---

## 🚀 Soluciones Inmediatas

### Prioridad 1: Cargar Imagen Hero Inmediatamente

**Problema:** La imagen hero está dentro de un componente lazy-loaded

**Solución:** Renderizar la primera imagen hero directamente en el HTML inicial

**Implementación:**
1. Cargar primera imagen hero sin lazy loading
2. Mantener carrusel lazy-loaded para otras imágenes
3. Preload de imagen hero ya implementado ✅

### Prioridad 2: Reducir TBT (1,920 ms)

**Problemas identificados:**
- Minimiza trabajo del hilo principal: 5.9s
- Reduce código JavaScript sin usar: 467 KiB
- Reduce tiempo de ejecución de JavaScript: 3.1s

**Soluciones:**
- Code splitting más agresivo
- Lazy load de librerías pesadas
- Defer cálculos no críticos

### Prioridad 3: Reducir Speed Index (12.5s)

**Problemas identificados:**
- Carga útil de red grande: 41,399 KiB
- Solicitudes de bloqueo de renderización: 170 ms
- JavaScript heredado: 24 KiB

**Soluciones:**
- Optimizar tamaño de recursos
- Comprimir imágenes y assets
- Remover código no utilizado

---

## 📊 Diagnósticos Detallados

### Oportunidades (Opportunities)

1. **Reduce código JavaScript sin usar:** 467 KiB
2. **Reduce código CSS sin usar:** 26 KiB
3. **Mejora la entrega de imágenes:** 143 KiB ahorro estimado
4. **Usa tiempos de almacenamiento en caché eficientes:** 146 KiB ahorro estimado
5. **Solicitudes de bloqueo de renderización:** 170 ms

### Diagnósticos

1. **Minimiza trabajo del hilo principal:** 5.9s
2. **Reduce tiempo de ejecución de JavaScript:** 3.1s
3. **Evita cargas útiles de red de gran tamaño:** 41,399 KiB total
4. **Evita tareas largas en el subproceso principal:** 9 tareas largas encontradas
5. **Evita animaciones no compuestas:** 6 elementos animados

---

## 🎯 Plan de Acción

### Fase 1: Fix Crítico LCP (Inmediato)

1. ✅ Preload de imagen hero ya implementado
2. ⚠️ **URGENTE:** Cargar primera imagen hero sin lazy loading
3. ⚠️ Verificar que imagen hero se carga inmediatamente

### Fase 2: Optimizaciones TBT (Esta semana)

1. Reducir código JavaScript sin usar (467 KiB)
2. Optimizar trabajo del hilo principal (5.9s)
3. Reducir tiempo de ejecución de JavaScript (3.1s)

### Fase 3: Optimizaciones Speed Index (Próxima semana)

1. Optimizar tamaño de payload (41,399 KiB)
2. Mejorar entrega de imágenes (143 KiB)
3. Optimizar caché (146 KiB)

---

## 📈 Métricas Objetivo

| Métrica | Actual | Objetivo | Mejora Necesaria |
|---------|--------|----------|------------------|
| **Performance Score** | 33 | > 90 | +172% |
| **LCP** | 82.5s | < 2.5s | -97% |
| **FCP** | 2.9s | < 1.8s | -38% |
| **TBT** | 1,920ms | < 200ms | -90% |
| **Speed Index** | 12.5s | < 3.4s | -73% |

---

## ✅ Optimizaciones Ya Implementadas

1. ✅ Preload de fuentes críticas
2. ✅ Preconnect a dominios externos
3. ✅ Preload de imagen hero
4. ✅ CSS crítico inline
5. ✅ CSS no crítico carga diferida
6. ✅ fetchPriority en scripts de terceros
7. ✅ Eliminado spinner de carga
8. ✅ Mejoras de CLS

---

## 🔍 Próximos Pasos

1. **Implementar carga inmediata de imagen hero** (URGENTE)
2. Ejecutar nuevo análisis después del fix
3. Monitorear métricas durante 24-48 horas
4. Iterar con mejoras adicionales según resultados

