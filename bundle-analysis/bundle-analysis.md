# 📊 Bundle Analysis Report
## Pinteya E-commerce Performance Analysis

**Fecha:** 28/6/2025, 04:33:40

## 📋 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| Bundle Size | Error | ❌ Error |
| Dependencias | 36 | 🟡 Moderado |
| No utilizadas | 28 | 🔴 Muchas no utilizadas |
| Componentes pesados | 10 | 🔴 Muchos componentes pesados |

## 🎯 Plan de Optimización


### Dependencies - Prioridad MEDIUM

**Problema:** 8 dependencias pesadas detectadas  
**Solución:** Evaluar alternativas más ligeras o tree-shaking  
**Impacto:** Medio - reducción de bundle size


### Cleanup - Prioridad LOW

**Problema:** 28 dependencias posiblemente no utilizadas  
**Solución:** Remover dependencias no utilizadas  
**Impacto:** Bajo - limpieza de código


### Components - Prioridad MEDIUM

**Problema:** 10 componentes grandes detectados  
**Solución:** Refactorizar componentes grandes y implementar lazy loading  
**Impacto:** Medio - mejora en tiempo de renderizado


## 📦 Análisis de Bundle


### Archivos más grandes
No disponible

### Distribución por tipo
- **JavaScript**: 0 archivos
- **CSS**: 0 archivos
- **Chunks grandes**: 0 archivos


## 📚 Análisis de Dependencias


### Dependencias por categoría
- **UI**: 9
- **Estado**: 2
- **Auth**: 4
- **Database**: 1
- **Payment**: 1

### Dependencias pesadas
- **@reduxjs/toolkit**: State management - evaluar uso real
- **date-fns**: Date library - considerar tree-shaking
- **lucide-react**: Icon library - implementar tree-shaking
- **mercadopago**: Payment SDK - necesario pero optimizable
- **puppeteer**: Browser automation - considerar alternativas más ligeras
- **react-redux**: Redux bindings - evaluar si es necesario
- **sharp**: Image processing - solo para build
- **swiper**: Carousel library - evaluar si se usa completamente


## 🧩 Componentes Pesados


### ShopDetails
- **Tamaño**: 70.08 KB (1367 líneas)
- **Complejidad**: 20
- **Sugerencias**: Considerar usar useReducer para estado complejo, Considerar lazy loading de imports pesados, Implementar lazy loading para modales


### Footer
- **Tamaño**: 28.90 KB (401 líneas)
- **Complejidad**: 0
- **Sugerencias**: Ninguna


### ShopWithSidebar
- **Tamaño**: 28.68 KB (516 líneas)
- **Complejidad**: 9
- **Sugerencias**: Considerar usar useReducer para estado complejo


### Header
- **Tamaño**: 24.44 KB (372 líneas)
- **Complejidad**: 10
- **Sugerencias**: Considerar usar useReducer para estado complejo, Implementar lazy loading para modales


### Common
- **Tamaño**: 23.91 KB (450 líneas)
- **Complejidad**: 10
- **Sugerencias**: Considerar usar useReducer para estado complejo, Implementar lazy loading para modales


### Checkout
- **Tamaño**: 23.08 KB (635 líneas)
- **Complejidad**: 40
- **Sugerencias**: Considerar usar useReducer para estado complejo


### BlogDetailsWithSidebar
- **Tamaño**: 21.69 KB (421 líneas)
- **Complejidad**: 0
- **Sugerencias**: Ninguna


### ui
- **Tamaño**: 16.85 KB (492 líneas)
- **Complejidad**: 59
- **Sugerencias**: Considerar usar useReducer para estado complejo, Optimizar operaciones de array con useMemo


### MyAccount
- **Tamaño**: 16.58 KB (137 líneas)
- **Complejidad**: 0
- **Sugerencias**: Ninguna


### Contact
- **Tamaño**: 14.11 KB (185 líneas)
- **Complejidad**: 0
- **Sugerencias**: Ninguna


---
*Reporte generado automáticamente por el analizador de performance de Pinteya*
