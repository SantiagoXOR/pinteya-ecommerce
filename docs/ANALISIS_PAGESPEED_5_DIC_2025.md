# Análisis PageSpeed Insights - 5 Dic 2025, 1:01 p.m.

## Métricas Actuales (Mobile)

### Performance Score: **32/100** 🔴

### Core Web Vitals

| Métrica | Valor | Objetivo | Estado | Comparación Anterior |
|---------|-------|----------|--------|---------------------|
| **FCP** | 2.6s | < 1.8s | 🟡 Naranja | ✅ Mejoró de 2.9s |
| **LCP** | **103.6s** | < 2.5s | 🔴 **CRÍTICO** | 🔴 Empeoró de 97.9s |
| **CLS** | 0 | < 0.1 | ✅ Verde | ✅ Excelente (mejoró de 0.371) |
| **TBT** | **6,550ms** | < 200ms | 🔴 Rojo | 🔴 Empeoró de 2,080ms |
| **Speed Index** | **17.8s** | < 3.4s | 🔴 Rojo | 🔴 Empeoró de 9.8s |

### Otros Scores

- **Accessibility:** 82/100 🟡
- **Best Practices:** 96/100 ✅
- **SEO:** 100/100 ✅

---

## 🔴 Problemas Críticos Identificados

### 1. LCP Extremadamente Alto (103.6s)

**LCP Breakdown:**
- Retraso en la carga de recursos: **4,390 ms**
- Retraso en la renderización del elemento: **4,720 ms**
- Total para este candidato: **9,110 ms**

**Problema Principal:**
- ❌ **Falta `fetchpriority="high"` en el HTML renderizado**
- La imagen hero no tiene el atributo `fetchpriority="high"` en el HTML final
- Aunque está en el código, Next.js Image puede no estar pasándolo correctamente

**Solución:**
- Verificar que `fetchPriority` se esté aplicando correctamente
- Asegurar que la primera imagen tenga `priority={true}` Y `fetchPriority='high'`

### 2. CSS Bloqueante (910ms de ahorro estimado)

**Archivos CSS bloqueantes:**
- `592c5686dd1f9261.css`: 36.1 KiB, 1,840 ms
- `b093...cc1948.css`: 30.9 KiB, 1,170 ms
- `f797356abca17fd7.css`: 3.6 KiB, 170 ms

**Solución:**
- CSS crítico ya está inline ✅
- Necesitamos verificar que CSS no crítico se carga diferidamente

### 3. TBT Extremadamente Alto (6,550ms)

**Problemas identificados:**
- Minimiza trabajo del hilo principal: 7.3s
- Reduce tiempo de ejecución de JavaScript: 4.1s
- Reprocesamiento forzado: 343ms total
  - Framework chunk: 77ms
  - Lib chunk: 70ms + 7ms
  - [unattributed]: 266ms

**Solución:**
- Reducir código JavaScript sin usar (466 KiB)
- Optimizar trabajo del hilo principal
- Reducir reprocesamientos forzados

### 4. Speed Index Alto (17.8s)

**Causas:**
- LCP alto bloquea el renderizado visual
- TBT alto bloquea la interactividad
- CSS bloqueante retrasa el renderizado inicial

---

## 📊 Árbol de Dependencias de Red

**Latencia de ruta crítica máxima: 3,916 ms**

**Cadena crítica:**
1. `www.pinteya.com` (HTML): 398 ms
2. CSS files: 700-717 ms cada uno
3. Fuentes WOFF2: 3,889-3,916 ms cada una

**Problema:**
- Las fuentes están causando retrasos significativos
- No hay preconnections configuradas

**Solución:**
- Preconnect a dominios de fuentes (si aplica)
- Preload de fuentes críticas ya implementado ✅

---

## 🎯 Oportunidades de Optimización

### 🔴 Críticas (Alta Prioridad)

1. **Agregar `fetchpriority="high"` a imagen hero**
   - Ahorro estimado: Mejora LCP significativamente
   - Impacto: CRÍTICO

2. **Reducir CSS bloqueante**
   - Ahorro estimado: 910 ms
   - Impacto: ALTO

3. **Reducir TBT**
   - Ahorro estimado: Mejora interactividad
   - Impacto: CRÍTICO

### 🟡 Importantes (Media Prioridad)

1. **Optimizar imágenes**
   - Ahorro estimado: 66 KiB
   - Impacto: MEDIO

2. **Mejorar caché**
   - Ahorro estimado: 233 KiB
   - Impacto: MEDIO

3. **Reducir JavaScript heredado**
   - Ahorro estimado: 46 KiB
   - Impacto: BAJO

---

## ✅ Optimizaciones Ya Implementadas

1. ✅ CLS mejorado a 0 (excelente)
2. ✅ Preload de fuentes críticas
3. ✅ Preconnect a dominios externos
4. ✅ CSS crítico inline
5. ✅ CSS no crítico carga diferida
6. ✅ Eliminado spinner de carga

---

## 🚀 Plan de Acción Inmediato

### Prioridad 1: Fix LCP (URGENTE)

1. ✅ Verificar que `fetchPriority='high'` se aplique correctamente
2. ⏳ Asegurar que la imagen hero tenga máxima prioridad
3. ⏳ Verificar preload de imagen hero en `<head>`

### Prioridad 2: Reducir CSS Bloqueante

1. ⏳ Verificar que CSS no crítico se carga diferidamente
2. ⏳ Optimizar tamaño de CSS crítico inline

### Prioridad 3: Reducir TBT

1. ⏳ Reducir código JavaScript sin usar
2. ⏳ Optimizar trabajo del hilo principal
3. ⏳ Reducir reprocesamientos forzados

---

## 📈 Métricas Objetivo

| Métrica | Actual | Objetivo | Mejora Necesaria |
|---------|--------|----------|------------------|
| **Performance Score** | 32 | > 90 | +181% |
| **LCP** | 103.6s | < 2.5s | **-98%** |
| **FCP** | 2.6s | < 1.8s | -31% |
| **TBT** | 6,550ms | < 200ms | **-97%** |
| **Speed Index** | 17.8s | < 3.4s | **-81%** |
| **CLS** | 0 | < 0.1 | ✅ Mantener |

---

## 🔍 Próximos Pasos

1. **Fix crítico de fetchPriority** (inmediato)
2. Ejecutar nuevo análisis después del fix
3. Implementar optimizaciones de CSS bloqueante
4. Reducir TBT con code splitting y optimizaciones
5. Monitorear métricas durante 24-48 horas

