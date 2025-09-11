# 📊 Bundle Analysis Report
## Pinteya E-commerce Performance Analysis

**Fecha:** 11/9/2025, 10:07:42

## 📋 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| Bundle Size | 4.61 MB | 🟡 Bueno |
| Dependencias | 62 | 🔴 Muchas dependencias |
| No utilizadas | 19 | 🔴 Muchas no utilizadas |
| Componentes pesados | 10 | 🔴 Muchos componentes pesados |

## 🎯 Plan de Optimización


### Dependencies - Prioridad MEDIUM

**Problema:** 7 dependencias pesadas detectadas  
**Solución:** Evaluar alternativas más ligeras o tree-shaking  
**Impacto:** Medio - reducción de bundle size


### Cleanup - Prioridad LOW

**Problema:** 19 dependencias posiblemente no utilizadas  
**Solución:** Remover dependencias no utilizadas  
**Impacto:** Bajo - limpieza de código


### Components - Prioridad MEDIUM

**Problema:** 10 componentes grandes detectados  
**Solución:** Refactorizar componentes grandes y implementar lazy loading  
**Impacto:** Medio - mejora en tiempo de renderizado


## 📦 Análisis de Bundle


### Archivos más grandes
- **vendors-34592007fa3382ce.js**: 1862.01 KB
- **ca7c8059eeb9cbd2.css**: 144.87 KB
- **polyfills-42372ed130431b0a.js**: 109.96 KB
- **layout-29efcd1753f61f40.js**: 100.65 KB
- **9495-14297cfd0006c192.js**: 83.59 KB
- **page-1449b786b485fe82.js**: 68.85 KB
- **page-1afc6668c1ee6a9b.js**: 60.46 KB
- **page-008a2d314c0cc9c3.js**: 60.10 KB
- **1182-37f8bcd6af4a3a1b.js**: 51.63 KB
- **page-94903112b011e938.js**: 47.20 KB

### Distribución por tipo
- **JavaScript**: 239 archivos
- **CSS**: 7 archivos
- **Chunks grandes**: 4 archivos


## 📚 Análisis de Dependencias


### Dependencias por categoría
- **UI**: 17
- **Estado**: 2
- **Auth**: 3
- **Database**: 2
- **Payment**: 1

### Dependencias pesadas
- **@reduxjs/toolkit**: State management - evaluar uso real
- **date-fns**: Date library - considerar tree-shaking
- **lucide-react**: Icon library - implementar tree-shaking
- **mercadopago**: Payment SDK - necesario pero optimizable
- **react-redux**: Redux bindings - evaluar si es necesario
- **sharp**: Image processing - solo para build
- **swiper**: Carousel library - evaluar si se usa completamente


## 🧩 Componentes Pesados


### ShopDetails
- **Tamaño**: 71.11 KB (1379 líneas)
- **Complejidad**: 25
- **Sugerencias**: Considerar usar useReducer para estado complejo, Considerar lazy loading de imports pesados, Implementar lazy loading para modales


### layout
- **Tamaño**: 39.33 KB (656 líneas)
- **Complejidad**: 0
- **Sugerencias**: Ninguna


### products
- **Tamaño**: 34.60 KB (886 líneas)
- **Complejidad**: 50
- **Sugerencias**: Optimizar operaciones de array con useMemo, Considerar lazy loading de imports pesados


### ShopWithSidebar
- **Tamaño**: 29.20 KB (516 líneas)
- **Complejidad**: 9
- **Sugerencias**: Considerar usar useReducer para estado complejo


### Dashboard
- **Tamaño**: 28.65 KB (799 líneas)
- **Complejidad**: 14
- **Sugerencias**: Considerar usar useReducer para estado complejo


### orders
- **Tamaño**: 28.42 KB (792 líneas)
- **Complejidad**: 41
- **Sugerencias**: Considerar usar useReducer para estado complejo, Optimizar operaciones de array con useMemo, Considerar lazy loading de imports pesados, Implementar lazy loading para modales


### orders
- **Tamaño**: 28.42 KB (760 líneas)
- **Complejidad**: 70
- **Sugerencias**: Considerar usar useReducer para estado complejo, Implementar lazy loading para modales


### products
- **Tamaño**: 27.15 KB (706 líneas)
- **Complejidad**: 73
- **Sugerencias**: Optimizar operaciones de array con useMemo


### Checkout
- **Tamaño**: 25.14 KB (641 líneas)
- **Complejidad**: 16
- **Sugerencias**: Considerar usar useReducer para estado complejo, Considerar lazy loading de imports pesados, Implementar lazy loading para modales


### products
- **Tamaño**: 25.09 KB (685 líneas)
- **Complejidad**: 58
- **Sugerencias**: Implementar lazy loading para modales


---
*Reporte generado automáticamente por el analizador de performance de Pinteya*
