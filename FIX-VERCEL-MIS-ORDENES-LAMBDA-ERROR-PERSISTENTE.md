# Fix: Error "Unable to find lambda for route: /mis-ordenes" - Problema Persistente

## 📊 Problema Identificado

**Error en build de Vercel:**
```
Error: Unable to find lambda for route: /mis-ordenes
```

**Contexto:**
- El build se completa exitosamente (✓ Generating static pages (275/275))
- La ruta `/mis-ordenes` está correctamente marcada como estática (○) en el build output
- Existe una ruta de página: `src/app/(site)/(pages)/mis-ordenes/page.tsx` (Client Component)
- Existe un layout: `src/app/(site)/(pages)/mis-ordenes/layout.tsx` con `export const dynamic = 'force-static'`
- El error aparece **después** del build exitoso, en la fase de deployment

## 🔍 Análisis

Este error parece ser un **bug conocido de Vercel con Next.js 15.5.7** que ocurre cuando:
1. Una ruta estática está dentro de route groups anidados `(site)/(pages)`
2. Vercel intenta mapear funciones serverless y puede confundirse con la estructura de route groups
3. El build se completa correctamente pero el deployment falla

**Evidencia:**
- ✅ Build completado exitosamente (275/275 páginas generadas)
- ✅ `/mis-ordenes` marcado como estático (○) - correcto para Client Component
- ✅ Layout con `export const dynamic = 'force-static'` y `export const revalidate = false`
- ✅ Página es Client Component (`'use client'`) - correcto
- ❌ Error aparece después del build exitoso en la fase de deployment

## ✅ Soluciones Intentadas

### 1. Layout con `export const dynamic = 'force-static'`
- ✅ Creado `src/app/(site)/(pages)/mis-ordenes/layout.tsx`
- ✅ Configurado con `export const dynamic = 'force-static'` y `export const revalidate = false`
- ❌ Error persiste

### 2. Import React explícito
- ✅ Agregado `import React from 'react'` al layout
- ❌ Error persiste

### 3. Renombrado de ruta
- ✅ Ruta renombrada de `/orders` a `/mis-ordenes` para evitar conflicto con `/api/orders`
- ❌ Error persiste

### 4. Removido `output: 'standalone'`
- ✅ Removido `output: 'standalone'` de `next.config.js` (incompatible con Vercel)
- ❌ Error persiste

### 5. Verificación de middleware
- ✅ Middleware no interfiere con `/mis-ordenes` (no está en el matcher)
- ❌ Error persiste

## 🚨 Posible Causa Raíz

El problema parece estar relacionado con:
1. **Route Groups Anidados**: La estructura `(site)/(pages)/mis-ordenes` puede estar causando confusión en Vercel
2. **Bug de Vercel con Next.js 15.5.7**: El error aparece después del build exitoso, sugiriendo un problema en la fase de deployment
3. **Mapeo de Rutas**: Vercel puede estar intentando mapear la ruta a una función serverless a pesar de que está marcada como estática

## 💡 Soluciones Propuestas

### Opción 1: Mover la ruta fuera de route groups anidados
```bash
# Mover de:
src/app/(site)/(pages)/mis-ordenes/
# A:
src/app/mis-ordenes/
```

**Pros:**
- Simplifica la estructura de rutas
- Puede resolver el problema de mapeo de Vercel

**Contras:**
- Requiere actualizar todas las referencias internas
- Puede afectar la organización del código

### Opción 2: Contactar soporte de Vercel
- Reportar el bug con Next.js 15.5.7
- Proporcionar logs de build y deployment
- Solicitar solución o workaround

### Opción 3: Downgrade temporal de Next.js
- Probar con Next.js 14.x para verificar si el problema es específico de Next.js 15.5.7
- **No recomendado** si se están usando características de Next.js 15

### Opción 4: Agregar configuración explícita en vercel.json
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "routes": [
    {
      "src": "/mis-ordenes",
      "dest": "/mis-ordenes.html"
    }
  ]
}
```

**Nota:** Esta configuración generalmente no es necesaria ya que Next.js maneja las rutas automáticamente.

## 📝 Estado Actual

**Estado:** ❌ **Error persiste**

El error continúa apareciendo después del build exitoso. Todas las soluciones estándar han sido intentadas sin éxito.

**Recomendación:**
1. Contactar soporte de Vercel con los logs completos del build
2. Considerar mover la ruta fuera de route groups anidados como solución temporal
3. Monitorear actualizaciones de Next.js 15.5.7 y Vercel que puedan resolver el bug

---

**Última actualización:** 2025-12-08
**Next.js version:** 15.5.7
**Vercel CLI version:** 49.0.0

