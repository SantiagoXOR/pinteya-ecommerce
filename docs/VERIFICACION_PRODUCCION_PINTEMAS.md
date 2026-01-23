# Verificación de Tenant Pintemas en Producción

**Fecha**: Enero 2026  
**Objetivo**: Verificar que el tenant Pintemas funciona correctamente en producción y diagnosticar problemas de carga de assets

---

## 📋 Checklist de Verificación Pre-Deploy

### 1. Verificación en Base de Datos

Ejecutar el script de verificación:

```bash
node scripts/verify-tenant-pintemas.js
```

**Verificaciones esperadas:**
- ✅ Tenant existe con `slug = 'pintemas'`
- ✅ `custom_domain = 'www.pintemas.com'`
- ✅ `is_active = true`
- ✅ Assets configurados (logo_url, logo_dark_url, favicon_url)
- ✅ Productos configurados (al menos 1 producto)

### 2. Verificación de Assets en Git

**Script automático**:
```bash
node scripts/verify-assets-git.js
```

**Comando manual**:
```bash
git ls-files public/tenants/pintemas/
```

**Archivos que deben existir:**
- ✅ `public/tenants/pintemas/logo.svg` (4.85 KB)
- ✅ `public/tenants/pintemas/logo-dark.svg` (6.94 KB)
- ✅ `public/tenants/pintemas/favicon.svg` (601.95 KB)
- ✅ `public/tenants/pintemas/og-image.png` (709.64 KB)
- ✅ `public/tenants/pintemas/hero/hero1.webp` (36.69 KB)
- ✅ `public/tenants/pintemas/hero/hero2.webp` (39.69 KB)
- ✅ `public/tenants/pintemas/hero/hero3.webp` (42.33 KB)

**Estado actual**: ✅ Todos los assets están correctamente en git (verificado el 22/01/2026)

---

## 🔍 Verificación Post-Deploy con Herramientas MCP

> **Nota importante**: Los logs `[TenantService] Detecting tenant:` solo se muestran en desarrollo (`process.env.NODE_ENV === 'development'`). En producción, estos logs no aparecerán en la consola del navegador porque se ejecutan en el servidor. Para verificar la detección del tenant en producción, usa los headers HTTP o el script de verificación.

### Script de Verificación Automática

Ejecuta el script de verificación en producción:

```bash
node scripts/verify-production-pintemas.js
```

Este script verifica:
- ✅ Status de la página principal
- ✅ Headers HTTP del tenant (`x-tenant-domain`, `x-tenant-custom-domain`)
- ✅ Accesibilidad de assets (logo, favicon, og-image)
- ✅ Resumen de problemas encontrados

### FASE 1: Verificación de Dominio y Detección de Tenant

**Objetivo**: Verificar que el dominio `www.pintemas.com` detecta correctamente el tenant

#### 1.1. Verificar Headers HTTP

**Herramienta**: MCP Browser (cursor-ide-browser o cursor-browser-extension)

**Pasos**:
1. Navegar a `https://www.pintemas.com`
2. Inspeccionar headers de la request:
   - Verificar header `x-tenant-domain`
   - Verificar header `x-tenant-custom-domain`
   - Verificar header `x-tenant-subdomain`

**Resultado esperado**:
```
x-tenant-domain: www.pintemas.com
x-tenant-custom-domain: www.pintemas.com
x-tenant-subdomain: null
```

#### 1.2. Verificar Detección en Consola del Navegador

> **⚠️ IMPORTANTE**: Los logs `[TenantService]` solo aparecen en desarrollo. En producción, estos logs no se muestran en la consola del navegador porque se ejecutan en el servidor.

**Herramienta**: MCP Browser - Console Logs (solo en desarrollo)

**Pasos** (solo para desarrollo local):
1. Abrir DevTools → Console
2. Buscar logs que contengan `[TenantService]`
3. Verificar logs de detección:
   - `[TenantService] Detecting tenant: { hostname, subdomain, customDomain }`
   - `[TenantService] Tenant found: { slug, name }`

**Para producción**: Usa los headers HTTP (ver sección 1.1) o el script de verificación automática.

#### 1.3. Verificar Metadata del Tenant

**Herramienta**: MCP Browser - Page Source

**Pasos**:
1. Verificar `<title>` en el HTML
2. Verificar meta tags `og:title`, `og:description`
3. Verificar meta tag `og:image`

**Resultado esperado**:
```html
<title>Pintemas - Pinturería Online</title>
<meta property="og:title" content="Pintemas - Pinturería Online" />
<meta property="og:image" content="/tenants/pintemas/og-image.png" />
```

---

### FASE 2: Verificación de Assets

**Objetivo**: Verificar que los assets de Pintemas se cargan correctamente

#### 2.1. Verificar Carga de Logo

**Herramienta**: MCP Browser - Network Tab

**Pasos**:
1. Abrir DevTools → Network
2. Filtrar por "logo" o "pintemas"
3. Recargar la página
4. Verificar requests a:
   - `/tenants/pintemas/logo.svg`
   - `/tenants/pintemas/logo-dark.svg`

**Resultado esperado**:
- Status: `200 OK`
- Content-Type: `image/svg+xml`
- Tamaño: > 0 bytes

**Si falla (404 o error)**:
- Verificar que el archivo existe en `public/tenants/pintemas/`
- Verificar que el build de Vercel incluyó los assets
- Verificar configuración de `next.config.js` para assets estáticos

#### 2.2. Verificar CSS Variables del Tenant

**Herramienta**: MCP Browser - Computed Styles

**Pasos**:
1. Inspeccionar elemento del header
2. Verificar CSS variables en `:root`:
   - `--tenant-primary`
   - `--tenant-primary-dark`
   - `--tenant-header-bg`

**Resultado esperado**:
```css
:root {
  --tenant-primary: #1e88e5;  /* Azul de Pintemas */
  --tenant-primary-dark: #1565c0;
  --tenant-header-bg: #1565c0;
}
```

#### 2.3. Verificar Favicon

**Herramienta**: MCP Browser - Page Source

**Pasos**:
1. Verificar tag `<link rel="icon">` en el `<head>`
2. Verificar que apunta a `/tenants/pintemas/favicon.svg`

**Resultado esperado**:
```html
<link rel="icon" href="/tenants/pintemas/favicon.svg" type="image/svg+xml" />
```

---

### FASE 3: Verificación de Funcionalidad

**Objetivo**: Verificar que las funcionalidades básicas funcionan con el tenant Pintemas

#### 3.1. Verificar Productos

**Herramienta**: MCP Browser - Network Tab

**Pasos**:
1. Navegar a la página principal
2. Verificar request a `/api/products`
3. Inspeccionar respuesta JSON
4. Verificar que los productos tienen `tenant_id` correcto

**Resultado esperado**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Producto",
      "tenant_products": {
        "tenant_id": "1bd519c5-1a14-4757-b91a-41bb32cbbea3",  // ID de Pintemas
        "is_visible": true
      }
    }
  ]
}
```

#### 3.2. Verificar Analytics

**Herramienta**: MCP Browser - Network Tab

**Pasos**:
1. Filtrar por "google-analytics" o "facebook"
2. Verificar que se cargan scripts de GA4 y Meta Pixel
3. Verificar que los IDs corresponden a Pintemas (si están configurados)

**Resultado esperado**:
- Scripts de analytics se cargan (si están configurados)
- IDs correctos en los scripts

---

### FASE 4: Diagnóstico de Problemas de Assets

**Objetivo**: Diagnosticar por qué los assets no cargan después del deploy

#### 4.1. Verificar Build de Vercel

**Herramienta**: Vercel Dashboard

**Pasos**:
1. Ir a Vercel Dashboard → Proyecto → Deployments
2. Abrir el último deployment
3. Verificar Build Logs
4. Buscar errores relacionados con assets o `public/tenants/`

**Posibles problemas**:
- Assets no incluidos en el build
- Errores de compilación
- Timeouts durante el build

#### 4.2. Verificar Assets en el Build

**Herramienta**: Vercel CLI o Dashboard

**Pasos**:
1. Descargar artifacts del build (si es posible)
2. Verificar que `public/tenants/pintemas/` existe en el build
3. Verificar tamaños de archivos

**Comando alternativo**:
```bash
# Si tienes acceso al build local
ls -la .next/static/public/tenants/pintemas/
```

#### 4.3. Verificar y Purgar Caché de Vercel

**Herramienta**: Vercel Dashboard

**Pasos para purgar caché**:
1. Ir a Vercel Dashboard → Tu Proyecto → Settings
2. Navegar a la sección **"Caches"** en el menú lateral
3. En **"CDN Cache"**:
   - Hacer clic en **"Purge CDN Cache"**
   - Esto invalidará todas las respuestas cacheadas usando headers `Cache-Control` o revalidación (ISR, PPR, Image Optimization, etc.)
4. En **"Data Cache"** (si es necesario):
   - Hacer clic en **"Purge Data Cache"**
   - Esto eliminará el contenido de la caché de datos de Vercel Functions

**Cuándo purgar caché**:
- ✅ Después de actualizar assets estáticos (logos, imágenes, favicons)
- ✅ Cuando los cambios no se reflejan en producción
- ✅ Después de cambios en configuración de `next.config.js` que afecten assets
- ✅ Si los assets están en git pero retornan 404 en producción

**Alternativas**:
- Hacer un redeploy forzado en Vercel
- Agregar query parameter `?v=timestamp` a los assets temporalmente
- Verificar configuración de caché en `vercel.json` o `next.config.js`

#### 4.4. Verificar Rutas de Assets

**Herramienta**: MCP Browser - Network Tab

**Pasos**:
1. Verificar URL completa del request fallido
2. Comparar con la ruta esperada
3. Verificar si hay redirects o errores 404

**URLs esperadas**:
- `https://www.pintemas.com/tenants/pintemas/logo.svg`
- `https://www.pintemas.com/tenants/pintemas/favicon.svg`

**Si hay 404**:
- Verificar que el dominio está correctamente configurado en Vercel
- Verificar que el build incluyó los assets
- Verificar configuración de `next.config.js`

---

## 🛠️ Plan de Acción con Herramientas MCP

### Paso 1: Verificación Inicial con MCP Browser

1. **Navegar a producción**:
   ```
   URL: https://www.pintemas.com
   ```

2. **Capturar información inicial**:
   - Screenshot de la página
   - Console logs
   - Network requests fallidos

3. **Verificar detección de tenant**:
   - Buscar en console: `[TenantService]`
   - Verificar headers HTTP
   - Verificar metadata HTML

### Paso 2: Diagnóstico de Assets

1. **Verificar requests de assets**:
   - Filtrar Network por "pintemas" o "logo"
   - Identificar requests con status 404
   - Verificar URLs completas

2. **Verificar build de Vercel**:
   - Revisar logs del último deployment
   - Verificar que los assets se incluyeron
   - Buscar errores relacionados

3. **Verificar configuración**:
   - Revisar `next.config.js` para configuración de assets
   - Verificar `vercel.json` para headers de caché
   - Verificar que `public/` está correctamente configurado

### Paso 3: Soluciones Propuestas

#### Solución 1: Forzar Inclusión de Assets en Build

Si los assets no se incluyen en el build:

1. Verificar `next.config.js`:
```javascript
module.exports = {
  // Asegurar que public/ está incluido
  publicRuntimeConfig: {
    // ...
  }
}
```

2. Verificar que los assets están en git:
```bash
git ls-files public/tenants/pintemas/
```

3. Forzar commit de assets si es necesario:
```bash
git add -f public/tenants/pintemas/
git commit -m "fix: incluir assets de Pintemas en build"
git push
```

#### Solución 2: Invalidar Caché

Si los assets están en el build pero no se cargan:

1. Agregar headers de no-cache temporalmente:
```javascript
// next.config.js
headers: async () => [
  {
    source: '/tenants/:path*',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=0, must-revalidate',
      },
    ],
  },
]
```

2. Hacer redeploy forzado en Vercel

#### Solución 3: Verificar Configuración de Dominio

Si el dominio no detecta el tenant:

1. Verificar en Vercel que el dominio está configurado
2. Verificar en BD que `custom_domain` es correcto
3. Verificar que el middleware detecta el dominio

---

## 📊 Checklist de Verificación Completa

### Pre-Deploy
- [ ] Tenant existe en BD con configuración correcta
- [ ] Assets físicos existen en `public/tenants/pintemas/`
- [ ] Assets están en git (verificado con `git ls-files`)
- [ ] Dominios configurados en Vercel
- [ ] OAuth redirect URIs agregados en Google

### Post-Deploy
- [ ] Dominio `www.pintemas.com` carga correctamente
- [ ] No aparece popup de acceso a red local
- [ ] Logo de Pintemas se muestra en el header
- [ ] Colores del tema (azul #1e88e5) se aplican
- [ ] Favicon de Pintemas se muestra
- [ ] Productos se muestran correctamente
- [ ] Analytics se cargan (si están configurados)
- [ ] No hay errores 404 en Network tab
- [ ] Console no muestra errores relacionados con tenant

### Diagnóstico de Assets
- [ ] Requests a `/tenants/pintemas/logo.svg` retornan 200
- [ ] Requests a `/tenants/pintemas/favicon.svg` retornan 200
- [ ] CSS variables del tenant se aplican correctamente
- [ ] Build de Vercel incluyó los assets
- [ ] No hay problemas de caché

---

## 🔧 Scripts de Verificación

### Script Local de Verificación

```bash
# Verificar configuración del tenant
node scripts/verify-tenant-pintemas.js

# Verificar assets en git
node scripts/verify-assets-git.js
# O manualmente:
git ls-files public/tenants/pintemas/

# Verificar último commit incluye assets
git log --oneline -5 --name-only | grep pintemas
```

### Verificación en Producción (Manual)

1. **Ejecutar script automático**:
   ```bash
   node scripts/verify-production-pintemas.js
   ```

2. **Verificación manual en navegador**:
   - Abrir `https://www.pintemas.com` en navegador
   - Abrir DevTools (F12)
   - Ir a Network y filtrar por "pintemas" o "logo"
   - Verificar status codes de los requests (deben ser 200)
   - Inspeccionar headers de la request principal:
     - `x-tenant-domain`: debe ser `www.pintemas.com`
     - `x-tenant-custom-domain`: debe ser `www.pintemas.com`
   - Inspeccionar elemento del header en Elements
   - Verificar en Computed Styles que `--tenant-primary` es `#1e88e5`

> **Nota**: Los logs `[TenantService]` no aparecen en producción porque solo se muestran en desarrollo.

---

## 🐛 Troubleshooting

### Problema: Assets no cargan (404)

**Causas posibles**:
1. Assets no incluidos en el build de Vercel
2. Problema de caché de CDN
3. Ruta incorrecta en el código
4. Dominio no configurado correctamente

**Soluciones (en orden de prioridad)**:
1. **Verificar que los assets están en git**:
   ```bash
   node scripts/verify-assets-git.js
   ```

2. **Purgar caché de CDN en Vercel**:
   - Vercel Dashboard → Settings → Caches → "Purge CDN Cache"
   - Esto es especialmente importante si los assets están en git pero no se ven en producción

3. **Forzar nuevo build en Vercel**:
   - Vercel Dashboard → Deployments → "Redeploy"

4. **Invalidar caché del navegador**:
   - Ctrl+Shift+R (hard refresh)
   - O abrir en modo incógnito

5. **Verificar configuración de `next.config.js`**:
   - Asegurar que `public/` está correctamente configurado
   - Verificar que no hay configuración que excluya `public/tenants/`

### Problema: Tenant no se detecta

**Causas posibles**:
1. Dominio no configurado en Vercel
2. `custom_domain` incorrecto en BD
3. Middleware no detecta el dominio

**Soluciones**:
1. Verificar configuración en Vercel Dashboard
2. Actualizar `custom_domain` en BD
3. Verificar logs del middleware

### Problema: Popup de acceso a red local

**Causa**: Requests a `127.0.0.1:7242` en el código

**Solución**: Ya eliminados en commit `fa9a5aaa`

---

## 📝 Notas Importantes

1. **Assets en Git**: Los assets deben estar en git para que Vercel los incluya en el build
2. **Caché de CDN**: Vercel cachea assets estáticos en su CDN. Si los assets están en git pero no se ven en producción:
   - **Solución rápida**: Purgar caché de CDN en Vercel Dashboard → Settings → Caches → "Purge CDN Cache"
   - Esto es especialmente importante después de actualizar assets
3. **Build Time**: Los assets en `public/` se copian automáticamente en el build de Next.js
4. **Dominios**: Ambos dominios (`www.pintemas.com` y `www.pintemas.com.ar`) deben estar configurados en Vercel
5. **Verificación de Caché**: Si después de purgar la caché los assets aún no aparecen, verificar:
   - Que el build de Vercel incluyó los assets (revisar build logs)
   - Que no hay errores en el build
   - Que las rutas en el código son correctas

---

## 🔗 Referencias

- `docs/MULTITENANCY.md` - Documentación completa del sistema multitenant
- `docs/GUIA_DEPLOY_PRODUCCION_MULTITENANT.md` - Guía de deployment
- `scripts/verify-tenant-pintemas.js` - Script de verificación del tenant
