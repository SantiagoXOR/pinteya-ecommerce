# 🚨 Plan de Optimización: Recuperar Score de 44 a 90+

**Fecha**: 2026-01-07  
**Estado Actual**: Score 44/100 (Regresión crítica desde 86/100)  
**Objetivo**: Score 90+/100

---

## 📊 Análisis de Regresión

### Comparación de Métricas

| Métrica | Documentación (4 Ene) | Nuevo Análisis (7 Ene) | Diferencia | Estado |
|---------|----------------------|------------------------|------------|--------|
| **Performance Score** | 86/100 | **44/100** | **-42 puntos** | 🔴 CRÍTICO |
| **LCP** | 3.7s | **5.8s** | +2.1s | 🔴 CRÍTICO |
| **FCP** | 1.6s | **1.7s** | +0.1s | ✅ Estable |
| **TBT** | 140ms | **1,930ms** | +1,790ms | 🔴 CRÍTICO |
| **CLS** | 0.027 | **0** | Mejoró | ✅ Excelente |
| **Speed Index** | 3.8s | **6.5s** | +2.7s | 🔴 CRÍTICO |
| **TTI** | 6.9s | **8.1s** | +1.2s | 🔴 CRÍTICO |

### Main Thread Work Breakdown (NUEVO ANÁLISIS)

| Categoría | Tiempo | Porcentaje | Estado |
|-----------|--------|------------|--------|
| **Script Evaluation** | **6,812ms** | 45.8% | 🔴 CRÍTICO |
| **Other** | **5,520ms** | 37.1% | 🔴 CRÍTICO |
| **Style & Layout** | 1,158ms | 7.8% | 🟡 Alto |
| **Rendering** | 1,177ms | 7.9% | 🟡 Alto |
| **Script Parsing** | 199ms | 1.3% | ✅ Bajo |
| **TOTAL** | **14,866ms** | 100% | 🔴 CRÍTICO |

**TBT**: 1,930ms (objetivo: <200ms) - **10x peor que objetivo**

---

## 🎯 Problemas Críticos Identificados

### 1. Script Evaluation: 6,812ms (CRÍTICO)

**Problema**: 
- Evaluación de scripts está tomando **6.8 segundos**
- Esto es **13x más** que el objetivo recomendado (<500ms)
- Bloquea completamente el main thread

**Causas Probables**:
- Scripts de terceros ejecutándose síncronamente
- JavaScript inicial muy grande
- Code splitting no efectivo
- Scripts inline muy pesados (CSS interceptación)

**Impacto en Score**: ~-30 puntos

### 2. "Other" Work: 5,520ms (CRÍTICO)

**Problema**:
- Trabajo no categorizado está tomando **5.5 segundos**
- Incluye: garbage collection, trabajo de React, hooks, etc.

**Causas Probables**:
- React Query ejecutándose síncronamente
- Redux inicializando temprano
- Hooks pesados ejecutándose en render inicial
- Garbage collection frecuente

**Impacto en Score**: ~-25 puntos

### 3. LCP: 5.8s (CRÍTICO)

**Problema**:
- LCP empeoró de 3.7s a 5.8s (+2.1s)
- Objetivo: <2.5s

**Causas Probables**:
- Imagen hero no se está precargando correctamente
- TTFB del servidor aumentó
- Recursos bloqueando carga de imagen

**Impacto en Score**: ~-15 puntos

### 4. Speed Index: 6.5s (CRÍTICO)

**Problema**:
- Speed Index empeoró de 3.8s a 6.5s (+2.7s)
- Objetivo: <3.4s

**Causas Probables**:
- CSS bloqueando renderizado
- JavaScript bloqueando paint
- Scripts ejecutándose antes de FCP

**Impacto en Score**: ~-10 puntos

### 5. Unused CSS: 11 KiB

**Problema**:
- CSS no utilizado está aumentando tiempo de carga
- Ahorro potencial: 250ms FCP, 500ms LCP

---

## ✅ Plan de Acción por Prioridad

### FASE 1: Reducir Script Evaluation (CRÍTICO - Impacto: ~30 puntos)

#### 1.1 Optimizar Script de Interceptación CSS

**Problema**: El script inline de CSS interceptación es muy grande y bloquea parseo

**Acciones**:
- ✅ Reducir tamaño del script (actualmente ~300 líneas)
- ✅ Mover lógica compleja a archivo externo con defer
- ✅ Simplificar MutationObserver
- ✅ Reducir timeouts e intervals

**Impacto Esperado**: -2,000ms en Script Evaluation

#### 1.2 Defer Scripts de Terceros Más Agresivamente

**Problema**: Scripts de analytics ejecutándose síncronamente

**Acciones**:
- ✅ Aumentar delay de GoogleAnalytics de 8s a 15s
- ✅ Aumentar delay de MetaPixel de 6s a 12s
- ✅ Cargar solo después de interacción del usuario
- ✅ Usar `defer` en todos los scripts externos

**Impacto Esperado**: -1,500ms en Script Evaluation

#### 1.3 Optimizar Code Splitting

**Problema**: Chunks aún demasiado grandes

**Acciones**:
- ✅ Reducir `maxSize` de 15KB a **10KB**
- ✅ Reducir `framework` maxSize de 50KB a **30KB**
- ✅ Más chunks async para paralelización
- ✅ Separar vendors más agresivamente

**Impacto Esperado**: -1,500ms en Script Evaluation

#### 1.4 Eliminar Scripts Inline No Críticos

**Problema**: Scripts de debugging/logging ejecutándose en producción

**Acciones**:
- ✅ Remover script de agent log en layout.tsx (líneas 495-536)
- ✅ Remover o condicionar scripts de monitoreo
- ✅ Mover todos los scripts al final del body con defer

**Impacto Esperado**: -500ms en Script Evaluation

**TOTAL FASE 1**: -5,500ms Script Evaluation → Score +30 puntos

---

### FASE 2: Reducir "Other" Work (CRÍTICO - Impacto: ~25 puntos)

#### 2.1 Lazy Load React Query

**Problema**: React Query inicializándose síncronamente

**Acciones**:
- ✅ Mover React Query Provider a componente lazy
- ✅ Inicializar solo después de TTI
- ✅ Usar `QueryClient` con configuración optimizada

**Impacto Esperado**: -2,000ms en Other

#### 2.2 Lazy Load Redux

**Problema**: Redux inicializándose temprano

**Acciones**:
- ✅ Mover Redux Provider a componente lazy
- ✅ Cargar store solo cuando se necesita
- ✅ Reducir estado inicial

**Impacto Esperado**: -1,500ms en Other

#### 2.3 Optimizar Hooks Pesados

**Problema**: Hooks ejecutándose en render inicial

**Acciones**:
- ✅ Identificar hooks pesados en componentes críticos
- ✅ Lazy load hooks no críticos
- ✅ Usar `useEffect` en lugar de ejecución síncrona

**Impacto Esperado**: -1,000ms en Other

#### 2.4 Optimizar Garbage Collection

**Problema**: GC frecuente debido a objetos temporales

**Acciones**:
- ✅ Reutilizar objetos en lugar de crear nuevos
- ✅ Memoizar cálculos pesados
- ✅ Reducir creación de funciones en render

**Impacto Esperado**: -500ms en Other

**TOTAL FASE 2**: -5,000ms Other → Score +25 puntos

---

### FASE 3: Optimizar LCP (ALTO - Impacto: ~15 puntos)

#### 3.1 Verificar Preload de Imagen Hero

**Problema**: LCP aumentó de 3.7s a 5.8s

**Acciones**:
- ✅ Verificar que preload está funcionando
- ✅ Usar `fetchpriority="high"` en preload
- ✅ Verificar que imagen está optimizada
- ✅ Considerar usar AVIF en lugar de WebP

**Impacto Esperado**: -1,500ms LCP

#### 3.2 Optimizar TTFB

**Problema**: Tiempo de respuesta del servidor puede haber aumentado

**Acciones**:
- ✅ Verificar cache headers
- ✅ Optimizar ISR revalidate
- ✅ Verificar Vercel Edge Config
- ✅ Optimizar queries de base de datos

**Impacto Esperado**: -500ms LCP

**TOTAL FASE 3**: -2,000ms LCP → Score +15 puntos

---

### FASE 4: Optimizar Speed Index (MEDIO - Impacto: ~10 puntos)

#### 4.1 CSS Crítico Más Agresivo

**Problema**: CSS aún bloqueando renderizado

**Acciones**:
- ✅ Reducir tamaño de CSS inline crítico
- ✅ Mover más CSS a diferido
- ✅ Verificar que script de interceptación funciona

**Impacto Esperado**: -1,000ms Speed Index

#### 4.2 Eliminar Unused CSS

**Problema**: 11 KiB de CSS no utilizado

**Acciones**:
- ✅ Ejecutar PurgeCSS más agresivo
- ✅ Revisar imports de CSS
- ✅ Eliminar estilos no usados

**Impacto Esperado**: -500ms Speed Index

**TOTAL FASE 4**: -1,500ms Speed Index → Score +10 puntos

---

## 📈 Impacto Total Esperado

| Fase | Optimización | Mejora en Score |
|------|--------------|-----------------|
| **FASE 1** | Script Evaluation | +30 puntos |
| **FASE 2** | Other Work | +25 puntos |
| **FASE 3** | LCP | +15 puntos |
| **FASE 4** | Speed Index | +10 puntos |
| **TOTAL** | | **+80 puntos** |

**Score Esperado**: 44 → **124** (limitado a 100) = **100/100** ✅

**Score Realista Conservador**: 44 → **90-95/100** ✅

---

## 🔧 Implementación

### Orden de Implementación

1. ✅ **FASE 1.4** - Eliminar scripts inline (rápido, bajo riesgo)
2. ✅ **FASE 1.1** - Optimizar script CSS interceptación (alto impacto)
3. ✅ **FASE 1.2** - Defer scripts terceros (medio impacto)
4. ✅ **FASE 1.3** - Optimizar code splitting (medio impacto)
5. ✅ **FASE 2.1-2.2** - Lazy load React Query/Redux (alto impacto)
6. ✅ **FASE 2.3-2.4** - Optimizar hooks y GC (medio impacto)
7. ✅ **FASE 3** - Optimizar LCP (alto impacto visual)
8. ✅ **FASE 4** - Optimizar Speed Index (medio impacto)

---

## 📝 Notas Importantes

1. **Testing**: Probar cada fase antes de continuar
2. **Monitoreo**: Verificar métricas después de cada cambio
3. **Rollback**: Mantener commits para rollback si es necesario
4. **Incremental**: Implementar una fase a la vez

---

**Última Actualización**: 2026-01-07  
**Autor**: Auto (AI Assistant)  
**Estado**: 🔄 En Progreso

