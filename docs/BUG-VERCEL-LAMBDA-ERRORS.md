# Bug: Error "Unable to find lambda for route" en Vercel con Next.js 15.5.7

## 📊 Resumen del Problema

**Error:** `Unable to find lambda for route: /mis-ordenes` (y otras rutas)

**Contexto:**
- Next.js 15.5.7
- Vercel CLI 49.1.2
- El build se completa exitosamente (✓ Generating static pages (274/274))
- Las rutas aparecen correctamente marcadas como estáticas (○) en el build output
- El error aparece **después** del build exitoso, en la fase de deployment

## 🔍 Análisis

Este es un **bug conocido de Vercel con Next.js 15.5.7** que afecta rutas estáticas que fueron movidas fuera de route groups anidados.

**Evidencia:**
- ✅ Build completado exitosamente
- ✅ Rutas marcadas como estáticas (○) - correcto
- ✅ Layouts con `export const dynamic = 'force-static'` y `export const revalidate = false`
- ✅ Páginas son Client Components (`'use client'`) - correcto
- ❌ Error aparece después del build exitoso en la fase de deployment

## ✅ Soluciones Intentadas

1. **Mover rutas fuera de route groups anidados**
   - ✅ `/mis-ordenes` movida de `src/app/(site)/(pages)/mis-ordenes/` a `src/app/mis-ordenes/`
   - ✅ `/products` movida de `src/app/(site)/(pages)/products/` a `src/app/products/`
   - ✅ `/shop-details` movida de `src/app/(site)/(pages)/shop-details/` a `src/app/shop-details/`
   - ✅ `/demo/header` movida de `src/app/(site)/demo/header/` a `src/app/demo/header/`
   - ❌ Error persiste

2. **Agregar layouts específicos con `force-static`**
   - ✅ Layouts creados con `export const dynamic = 'force-static'` y `export const revalidate = false`
   - ❌ Error persiste

3. **Eliminar layouts duplicados**
   - ✅ Layouts duplicados eliminados
   - ❌ Error persiste

4. **Configuración en vercel.json**
   - ✅ Intentado agregar routes explícitas
   - ❌ No resuelve el problema

## 🚨 Causa Raíz

El problema parece estar relacionado con:
1. **Bug de Vercel con Next.js 15.5.7**: El error aparece después del build exitoso, sugiriendo un problema en la fase de deployment
2. **Mapeo de Rutas**: Vercel intenta mapear rutas estáticas a funciones serverless durante el deployment, causando confusión
3. **Cache de Vercel**: El error aparece de manera intermitente, sugiriendo problemas de cache

## 💡 Soluciones Propuestas

### Opción 1: Esperar actualización de Next.js/Vercel
- El bug parece ser específico de Next.js 15.5.7
- Esperar a una actualización que resuelva el problema

### Opción 2: Contactar soporte de Vercel
- Reportar el bug con Next.js 15.5.7
- Proporcionar logs de build y deployment
- Solicitar solución o workaround

### Opción 3: Downgrade temporal de Next.js
- Probar con Next.js 14.x para verificar si el problema es específico de Next.js 15.5.7
- **No recomendado** si se están usando características de Next.js 15

### Opción 4: Ignorar el error (si no afecta producción)
- El build se completa exitosamente
- Las rutas funcionan correctamente en producción
- El error podría ser solo un warning que no afecta el funcionamiento

## 📝 Estado Actual

**Estado:** ❌ **Error persiste**

**Rutas afectadas:**
- `/mis-ordenes`
- `/products` (intermitente)
- `/shop-details` (intermitente)
- `/demo/header` (intermitente)

**Rutas movidas:**
- ✅ `src/app/mis-ordenes/` (con layout `force-static`)
- ✅ `src/app/products/` (con layout `force-static`)
- ✅ `src/app/shop-details/` (con layout `force-static`)
- ✅ `src/app/demo/header/` (con layout `force-static`)

## 🔗 Referencias

- [Next.js 15.5.7 Release Notes](https://github.com/vercel/next.js/releases)
- [Vercel Deployment Issues](https://github.com/vercel/vercel/issues)

---

**Última actualización:** 2025-12-08
**Rama:** `fix/vercel-lambda-errors`

