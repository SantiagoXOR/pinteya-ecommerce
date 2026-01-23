---
name: ""
overview: ""
todos: []
isProject: false
---

# Plan: Verificación de Tenant Pintemas en Producción con Herramientas MCP

## Objetivo

Verificar que el tenant Pintemas funciona correctamente en producción después del deploy, diagnosticar por qué los assets no cargan, y resolver los problemas encontrados usando herramientas MCP del navegador.

## Estado Actual

- ✅ Tenant Pintemas configurado en BD
- ✅ Assets físicos existen en `public/tenants/pintemas/`
- ✅ Assets están en git
- ✅ Código actualizado (eliminados requests a localhost)
- ⚠️ **Problema**: Assets no se cargan después del deploy en producción

## Fases de Verificación

### FASE 1: Verificación Inicial con MCP Browser

**Objetivo**: Verificar que el dominio detecta correctamente el tenant y capturar estado inicial

**Herramientas**: MCP Browser (cursor-ide-browser o cursor-browser-extension)

**Tareas**:

1. **Navegar a producción**:

   - URL: `https://www.pintemas.com`
   - Capturar screenshot inicial de la página
   - Verificar que la página carga (no hay errores 500)

2. **Verificar detección de tenant**:

> **⚠️ IMPORTANTE**: Los logs `[TenantService]` solo aparecen en desarrollo. En producción, usa los headers HTTP o el script de verificación.

**Opción A - Script automático**:

   ```bash
   node scripts/verify-production-pintemas.js
   ```

**Opción B - Headers HTTP**:

   - Abrir DevTools → Network
   - Seleccionar request principal (document)
   - Verificar headers de respuesta (ver sección 1.3)

**Opción C - Solo en desarrollo local**:

   - Abrir DevTools → Console
   - Buscar logs: `[TenantService] Detecting tenant:`
   - Verificar que muestra: `{ hostname: 'www.pintemas.com', customDomain: 'www.pintemas.com' }`
   - Buscar logs: `[TenantService] Tenant found:`
   - Verificar que muestra: `{ slug: 'pintemas', name: 'Pintemas' }`

3. **Verificar headers HTTP**:

   - Abrir DevTools → Network
   - Seleccionar request principal (document)
   - Verificar headers de respuesta:
     - `x-tenant-domain`: debe ser `www.pintemas.com`
     - `x-tenant-custom-domain`: debe ser `www.pintemas.com`
     - `x-tenant-subdomain`: debe ser `null`

4. **Verificar metadata HTML**:

   - Verificar `<title>`: debe ser "Pintemas - Pinturería Online"
   - Verificar meta `og:title`: debe mencionar Pintemas
   - Verificar meta `og:image`: debe apuntar a `/tenants/pintemas/og-image.png`

**Archivos involucrados**:

- Navegador con DevTools
- Herramientas MCP del navegador

### FASE 2: Diagnóstico de Assets con MCP Browser

**Objetivo**: Identificar por qué los assets no cargan

**Herramientas**: MCP Browser - Network Tab

**Tareas**:

1. **Verificar requests de assets**:

   - Abrir DevTools → Network
   - Filtrar por "pintemas" o "logo"
   - Recargar la página (Ctrl+Shift+R)
   - Identificar requests fallidos:
     - `/tenants/pintemas/logo.svg` - Status esperado: 200
     - `/tenants/pintemas/logo-dark.svg` - Status esperado: 200
     - `/tenants/pintemas/favicon.svg` - Status esperado: 200
     - `/tenants/pintemas/og-image.png` - Status esperado: 200

2. **Analizar errores 404**:

   - Si hay 404, verificar URL completa del request
   - Comparar con ruta esperada: `https://www.pintemas.com/tenants/pintemas/logo.svg`
   - Verificar si hay redirects o cambios de dominio
   - Capturar screenshot del error en Network tab

3. **Verificar CSS variables**:

   - Inspeccionar elemento del header
   - Verificar en Computed Styles las variables CSS:
     - `--tenant-primary`: debe ser `#1e88e5` (azul de Pintemas)
     - `--tenant-primary-dark`: debe ser `#1565c0`
     - `--tenant-header-bg`: debe ser `#1565c0`
   - Si son valores de Pinteya (naranja), el tenant no se detectó correctamente

4. **Verificar favicon**:

   - Verificar tag `<link rel="icon">` en el HTML source
   - Verificar que apunta a `/tenants/pintemas/favicon.svg`
   - Verificar que el favicon se muestra en la pestaña del navegador

**Archivos involucrados**:

- DevTools del navegador
- Network tab para análisis de requests

### FASE 3: Verificación de Build en Vercel

**Objetivo**: Verificar que el build incluyó los assets

**Herramientas**: Vercel Dashboard, Terminal

**Tareas**:

1. **Revisar build logs**:

   - Ir a Vercel Dashboard → Proyecto → Deployments
   - Abrir el último deployment
   - Revisar Build Logs
   - Buscar:
     - Errores relacionados con `public/tenants/`
     - Mensajes sobre assets no encontrados
     - Warnings sobre archivos faltantes

2. **Verificar artifacts del build** (si es posible):

   - Descargar artifacts del build
   - Verificar que `public/tenants/pintemas/` existe
   - Verificar tamaños de archivos (no deben ser 0 bytes)

3. **Verificar configuración de Next.js**:

   - Revisar `next.config.js`
   - Verificar que no hay configuración que excluya `public/tenants/`
   - Verificar configuración de `assetPrefix` si existe

**Archivos involucrados**:

- Vercel Dashboard
- `next.config.js`
- Build logs de Vercel

### FASE 4: Verificación de Funcionalidad

**Objetivo**: Verificar que las funcionalidades básicas funcionan

**Herramientas**: MCP Browser

**Tareas**:

1. **Verificar productos**:

   - Navegar a la página principal
   - Verificar que se muestran productos
   - Abrir DevTools → Network
   - Filtrar por `/api/products`
   - Verificar respuesta JSON
   - Verificar que los productos tienen `tenant_id` de Pintemas

2. **Verificar carrito**:

   - Agregar un producto al carrito
   - Verificar que se guarda correctamente
   - Verificar en Network que el request incluye `tenant_id`

3. **Verificar analytics** (si están configurados):

   - Filtrar Network por "google-analytics" o "facebook"
   - Verificar que se cargan scripts
   - Verificar IDs en los scripts (deben ser de Pintemas si están configurados)

**Archivos involucrados**:

- Navegador con DevTools
- Network tab

### FASE 5: Soluciones y Correcciones

**Objetivo**: Aplicar soluciones según los problemas encontrados

**Tareas**:

1. **Si los assets no están en el build**:

   - Verificar que están en git: `git ls-files public/tenants/pintemas/`
   - Si faltan, agregarlos y hacer commit:
     ```bash
     git add -f public/tenants/pintemas/
     git commit -m "fix: incluir assets de Pintemas en build"
     git push
     ```


2. **Si hay problema de caché**:

   - **Purgar caché de CDN en Vercel**:
     - Vercel Dashboard → Settings → Caches → "Purge CDN Cache"
     - Esto es la solución más rápida si los assets están en git pero no se ven en producción
   - Agregar headers de no-cache temporalmente en `next.config.js`
   - Hacer redeploy forzado en Vercel
   - Invalidar caché del navegador (Ctrl+Shift+R)

3. **Si el dominio no detecta el tenant**:

   - Verificar configuración en Vercel Dashboard
   - Verificar `custom_domain` en BD
   - Verificar logs del middleware

4. **Si hay errores 404 en assets**:

   - Verificar que las rutas en el código son correctas
   - Verificar que `next.config.js` no tiene configuración que afecte rutas
   - Considerar usar rutas absolutas si es necesario

**Archivos involucrados**:

- `next.config.js` (si necesita cambios)
- Base de datos Supabase (si necesita actualizaciones)
- Vercel Dashboard

## Checklist de Verificación

### Pre-Verificación

- [ ] Script de verificación ejecutado: `node scripts/verify-tenant-pintemas.js`
- [ ] Assets verificados en git: `git ls-files public/tenants/pintemas/`
- [ ] Último commit incluye cambios relevantes

### Verificación en Producción

- [ ] Dominio `www.pintemas.com` carga correctamente
- [ ] No aparece popup de acceso a red local
- [ ] Tenant se detecta correctamente (logs en console)
- [ ] Headers HTTP correctos
- [ ] Metadata HTML correcta

### Verificación de Assets

- [ ] Logo se carga (status 200 en Network)
- [ ] Favicon se carga
- [ ] CSS variables del tenant se aplican
- [ ] Colores correctos (azul #1e88e5)
- [ ] No hay errores 404 en Network tab

### Verificación de Funcionalidad

- [ ] Productos se muestran
- [ ] Carrito funciona
- [ ] Analytics se cargan (si están configurados)

### Diagnóstico

- [ ] Build logs revisados
- [ ] Problemas identificados
- [ ] Soluciones aplicadas

## Herramientas MCP Disponibles

### MCP Browser (cursor-ide-browser / cursor-browser-extension)

**Capacidades**:

- Navegar a URLs de producción
- Capturar screenshots
- Inspeccionar elementos
- Ver console logs
- Analizar Network requests
- Verificar headers HTTP
- Inspeccionar HTML source

**Uso en este plan**:

- FASE 1: Navegación inicial y captura de estado
- FASE 2: Análisis de Network requests de assets
- FASE 4: Verificación de funcionalidad

## Resultados Esperados

### Éxito

- ✅ Dominio detecta correctamente el tenant Pintemas
- ✅ Assets se cargan correctamente (status 200)
- ✅ Logo y colores de Pintemas se muestran
- ✅ Funcionalidades básicas funcionan
- ✅ No hay errores en console

### Problemas Comunes y Soluciones

1. **Assets 404**:

   - Verificar build de Vercel
   - Forzar nuevo build
   - Verificar rutas en código

2. **Tenant no detectado**:

   - Verificar configuración de dominio en Vercel
   - Verificar `custom_domain` en BD
   - Verificar middleware

3. **Colores incorrectos**:

   - Verificar que CSS variables se inyectan
   - Verificar que `TenantThemeStyles` se renderiza
   - Verificar configuración en BD

## Referencias

- `docs/VERIFICACION_PRODUCCION_PINTEMAS.md` - Guía detallada de verificación
- `docs/MULTITENANCY.md` - Documentación completa del sistema multitenant
- `scripts/verify-tenant-pintemas.js` - Script de verificación del tenant