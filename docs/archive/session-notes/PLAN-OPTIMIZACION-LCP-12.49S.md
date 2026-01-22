# ⚡ Plan de Optimización: Reducir LCP de 12.49s a < 2.5s

## 📊 Estado Actual

- **Performance Score**: 59/100
- **LCP**: 12.49s (Score: 0/100) 🔴 **CRÍTICO**
- **FCP**: 1.78s (Score: 90/100) ✅
- **CLS**: 0.000 (Score: 100/100) ✅
- **TBT**: 343ms (Score: 74/100) 🟡
- **SI**: 7.26s (Score: 29/100) 🔴

## 🎯 Objetivos

- **LCP**: < 2.5s (reducción de 80%)
- **Performance Score**: > 80/100
- **SI**: < 3.4s (reducción de 53%)

## 🔍 Problemas Identificados

### 1. LCP Extremadamente Alto (12.49s) 🔴

**Causas probables:**
- La imagen hero no se está cargando temprano
- Delay del carousel (5s) podría estar afectando el LCP
- El LCP element no se detecta correctamente (Node: N/A)
- Render-blocking CSS (302ms) está retrasando la carga

**Solución:**
- Verificar que la imagen hero esté en el HTML inicial
- Reducir delay del carousel de 5s a 2s (solo después de LCP)
- Asegurar que el preload funcione correctamente
- Eliminar render-blocking CSS

### 2. Render-Blocking CSS (302ms) 🔴

**Problema:**
- CSS chunk `8976ffb1399428d1.css` está bloqueando el renderizado

**Solución:**
- Mejorar el script de non-blocking CSS
- Asegurar que el CSS crítico esté inline
- Diferir CSS no crítico más agresivamente

### 3. Main Thread Work Alto (8120ms, 2767ms, 1869ms) 🔴

**Problema:**
- JavaScript principal está bloqueando el main thread
- Chunk principal `9267085c392ea770.js` tiene 2135ms de ejecución

**Solución:**
- Optimizar code splitting más agresivamente
- Diferir JavaScript no crítico
- Reducir tamaño del chunk principal

### 4. Unused JavaScript (450ms) 🟡

**Problema:**
- Google Analytics (48KB)
- Meta Pixel (34KB + 32KB)
- Chunks de Next.js (28KB + 24KB)

**Solución:**
- Aumentar delays de analytics (ya en 12s y 10s)
- Considerar lazy loading más agresivo
- Optimizar chunks de Next.js

## 📋 Plan de Acción

### Fase 22: Optimizar LCP (Prioridad CRÍTICA)

#### 22.1: Verificar y optimizar carga de imagen hero
- [ ] Verificar que la imagen hero esté en el HTML inicial
- [ ] Asegurar que el preload funcione correctamente
- [ ] Verificar que la imagen no se oculte antes de LCP
- [ ] Reducir delay del carousel de 5s a 2s (solo después de LCP detectado)

#### 22.2: Eliminar render-blocking CSS
- [ ] Mejorar script de non-blocking CSS
- [ ] Asegurar que CSS crítico esté inline
- [ ] Diferir CSS no crítico más agresivamente

#### 22.3: Optimizar main thread work
- [ ] Reducir tamaño del chunk principal
- [ ] Optimizar code splitting más agresivamente
- [ ] Diferir JavaScript no crítico

#### 22.4: Reducir unused JavaScript
- [ ] Aumentar delays de analytics si es necesario
- [ ] Optimizar chunks de Next.js
- [ ] Considerar lazy loading más agresivo

## 🎯 Métricas Objetivo

| Métrica | Actual | Objetivo | Mejora |
|---------|--------|----------|--------|
| **LCP** | 12.49s | < 2.5s | -80% |
| **Performance Score** | 59/100 | > 80/100 | +36% |
| **SI** | 7.26s | < 3.4s | -53% |
| **TBT** | 343ms | < 200ms | -42% |
| **Render-blocking CSS** | 302ms | < 100ms | -67% |

## 📝 Notas

- El LCP element no se detecta correctamente (Node: N/A), pero Lighthouse calcula 12.49s
- Esto sugiere que la imagen hero no se está cargando temprano o hay un delay significativo
- El delay del carousel (5s) podría estar afectando el LCP si la imagen se oculta antes
- El render-blocking CSS (302ms) está retrasando la carga de la imagen

