# 📊 Bundle Analysis Report
## Pinteya E-commerce Performance Analysis

**Fecha:** 9/9/2025, 07:21:25

## 📋 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| Bundle Size | Error | ❌ Error |
| Dependencias | 67 | 🔴 Muchas dependencias |
| No utilizadas | 38 | 🔴 Muchas no utilizadas |
| Componentes pesados | 10 | 🔴 Muchos componentes pesados |

## 🎯 Plan de Optimización


### Dependencies - Prioridad MEDIUM

**Problema:** 7 dependencias pesadas detectadas  
**Solución:** Evaluar alternativas más ligeras o tree-shaking  
**Impacto:** Medio - reducción de bundle size


### Cleanup - Prioridad LOW

**Problema:** 38 dependencias posiblemente no utilizadas  
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
- **UI**: 19
- **Estado**: 2
- **Auth**: 5
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
- **Tamaño**: 70.73 KB (1377 líneas)
- **Complejidad**: 24
- **Sugerencias**: Considerar usar useReducer para estado complejo, Considerar lazy loading de imports pesados, Implementar lazy loading para modales


### layout
- **Tamaño**: 39.33 KB (656 líneas)
- **Complejidad**: 0
- **Sugerencias**: Ninguna


### products
- **Tamaño**: 34.35 KB (879 líneas)
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


### products
- **Tamaño**: 27.15 KB (705 líneas)
- **Complejidad**: 73
- **Sugerencias**: Optimizar operaciones de array con useMemo


### Checkout
- **Tamaño**: 25.13 KB (641 líneas)
- **Complejidad**: 16
- **Sugerencias**: Considerar usar useReducer para estado complejo, Considerar lazy loading de imports pesados, Implementar lazy loading para modales


### products
- **Tamaño**: 25.09 KB (685 líneas)
- **Complejidad**: 58
- **Sugerencias**: Implementar lazy loading para modales


### Checkout
- **Tamaño**: 24.35 KB (646 líneas)
- **Complejidad**: 42
- **Sugerencias**: Considerar usar useReducer para estado complejo


### Common
- **Tamaño**: 24.35 KB (450 líneas)
- **Complejidad**: 10
- **Sugerencias**: Considerar usar useReducer para estado complejo, Implementar lazy loading para modales


---
*Reporte generado automáticamente por el analizador de performance de Pinteya*
