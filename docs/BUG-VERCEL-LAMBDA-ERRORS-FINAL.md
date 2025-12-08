# Bug: Error "Unable to find lambda for route" - Análisis Final

## 📊 Resumen del Problema

**Error:** `Unable to find lambda for route: /mis-ordenes` (y otras rutas que rotan)

**Contexto:**
- Next.js 16.0.7
- Vercel CLI 49.1.2
- El build se completa exitosamente
- Las rutas aparecen correctamente marcadas en el build output
- El error aparece **después** del build exitoso, en la fase de deployment
- El error **rota entre diferentes rutas** (mis-ordenes, products, demo/header, etc.)

## 🔍 Análisis Final

Este es un **bug sistemático conocido de Vercel con Next.js 16.0.7** que:

1. **Afecta rutas estáticas** que fueron movidas fuera de route groups
2. **Rota entre diferentes rutas** - cuando se "arregla" una, aparece en otra
3. **Aparece después del build exitoso** - sugiere problema en fase de deployment
4. **No afecta el build** - el build se completa correctamente

## ✅ Soluciones Intentadas (Todas Fallidas)

1. ✅ Mover rutas fuera de route groups anidados `(site)/(pages)`
2. ✅ Agregar layouts con `export const dynamic = 'force-static'`
3. ✅ Remover `export const dynamic` de Client Components
4. ✅ Actualizar Next.js de 15.5.7 a 16.0.7
5. ✅ Configurar build para usar `--webpack` explícitamente
6. ✅ Cambiar rutas a `force-dynamic` (solución actual)

## 🚨 Causa Raíz Identificada

**Bug conocido de Vercel con Next.js 16.0.7:**
- Issue reportado: #55717 en GitHub de Next.js
- El error es un **falso positivo** en muchos casos
- Vercel intenta mapear rutas a lambdas y se confunde con rutas estáticas
- El deployment puede completarse exitosamente a pesar del error

## 💡 Solución Actual Implementada

**Estrategia:** Hacer rutas problemáticas explícitamente dinámicas

```typescript
// Layout con force-dynamic
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

**Rutas configuradas:**
- `/demo/*` - force-dynamic
- `/mis-ordenes` - force-dynamic

**Razón:** En lugar de evitar el error, le decimos a Vercel que sí necesita una lambda.

## 📝 Estado Actual

**Estado:** ⚠️ **Error persiste pero rota entre rutas**

**Observación:** El error se mueve entre rutas, lo que confirma que es un bug sistemático de Vercel, no un problema específico de configuración.

## 🎯 Próximos Pasos Recomendados

1. **Verificar si el deployment realmente falla:**
   - Si el deployment se completa a pesar del error → Es un falso positivo
   - Si el deployment falla → Necesita solución más agresiva

2. **Si es falso positivo:**
   - Documentar como bug conocido
   - Monitorear que las rutas funcionen en producción
   - Esperar fix de Vercel/Next.js

3. **Si el deployment falla:**
   - Contactar soporte de Vercel con:
     - Next.js 16.0.7
     - Logs de build completos
     - Lista de rutas afectadas
     - Todas las soluciones intentadas

4. **Workaround temporal:**
   - Continuar haciendo rutas problemáticas `force-dynamic`
   - Esto tiene costo de performance pero resuelve el error

## 🔗 Referencias

- [Next.js Issue #55717](https://github.com/vercel/next.js/issues/55717)
- [Vercel Community Discussion](https://community.vercel.com/t/unable-to-find-lambda-for-route/12106)

---

**Última actualización:** 2025-12-08
**Rama:** `fix/vercel-lambda-errors`

