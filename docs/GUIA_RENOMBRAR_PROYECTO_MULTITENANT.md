# Guía de Renombrado de Proyecto - Sistema Multitenant

**Fecha:** 2026-01-23  
**Estado:** 📋 **CHECKLIST DE RENOMBRADO**

---

## 📋 Resumen Ejecutivo

Esta guía detalla todos los lugares donde se debe renombrar el proyecto de `pinteya-ecommerce` a `pintureria-digital` (o el nombre que elijas) para reflejar que ahora es una plataforma multitenant.

---

## 🎯 Nombre Sugerido

**Nombre Actual:** `pinteya-ecommerce`  
**Nombre Sugerido:** `pintureria-digital` o `pintureriadigital`

**Razón:** Refleja que es una plataforma multitenant que soporta múltiples tiendas (Pinteya, Pintemas, etc.)

---

## 📍 Lugares Donde Renombrar

### 1. 🌐 Vercel Dashboard

**Pasos:**
1. Ir a: https://vercel.com/dashboard
2. Seleccionar proyecto: `pinteya-ecommerce`
3. Click en **Settings** (barra superior)
4. Click en **General** (menú lateral)
5. En **Project Name**, cambiar de `pinteya-ecommerce` a `pintureria-digital`
6. Click en **Save**

**⚠️ Nota:** Esto NO afecta el deployment URL ni los dominios. Solo cambia el nombre en el dashboard.

**Archivos que se actualizan automáticamente:**
- `.vercel/project.json` - Se actualiza automáticamente después del cambio

---

### 2. 🗄️ Supabase Dashboard

**Pasos:**
1. Ir a: https://supabase.com/dashboard
2. Seleccionar proyecto: `aakzspzfulgftqlgwkpb` (o el nombre actual)
3. Click en **Settings** (⚙️) en el menú lateral
4. Click en **General** (en el submenú)
5. En **Project Name**, cambiar el nombre
6. Click en **Save**

**⚠️ Nota:** El Project ID (`aakzspzfulgftqlgwkpb`) NO cambia. Solo el nombre de visualización.

**Variables de entorno que NO cambian:**
- `NEXT_PUBLIC_SUPABASE_URL` - Sigue siendo `https://aakzspzfulgftqlgwkpb.supabase.co`
- Las keys de API no cambian

---

### 3. 🔴 Redis (Si usas Redis Cloud, Upstash, etc.)

**Pasos según el proveedor:**

#### Redis Cloud:
1. Ir a: https://redis.com/cloud
2. Seleccionar tu base de datos
3. Click en **Settings** o **Configuration**
4. Cambiar el nombre de la base de datos
5. **⚠️ IMPORTANTE:** Si cambias el nombre, actualizar variables de entorno:
   - `REDIS_HOST` - Puede cambiar si el nombre afecta el hostname
   - Verificar que la conexión sigue funcionando

#### Upstash:
1. Ir a: https://console.upstash.com/
2. Seleccionar tu base de datos
3. Click en **Settings**
4. Cambiar el nombre
5. Verificar que `REDIS_HOST` sigue siendo correcto

**⚠️ Nota:** El nombre de Redis es principalmente para organización. No afecta la funcionalidad si las variables de entorno están correctas.

---

### 4. 📦 GitHub Repository (Opcional)

**Si quieres renombrar el repositorio:**

**Pasos:**
1. Ir a: https://github.com/tu-usuario/pinteya-ecommerce
2. Click en **Settings** (en el repositorio)
3. Scroll down a **Repository name**
4. Cambiar de `pinteya-ecommerce` a `pintureria-digital`
5. Click en **Rename**

**⚠️ IMPORTANTE:** Después de renombrar:
- Actualizar el remote local:
  ```bash
  git remote set-url origin https://github.com/tu-usuario/pintureria-digital.git
  ```
- Verificar que Vercel sigue conectado al repositorio correcto

---

### 5. 📄 Archivos de Configuración Locales

#### `.vercel/project.json`

**Archivo actual:**
```json
{
  "projectId": "prj_hmmWPWlwOGD8SO82Zfp3QmS4HaSj",
  "orgId": "team_GkSyu8uBcOfE0K8XTF4FsMDt",
  "projectName": "pinteya-ecommerce"
}
```

**Cambiar a:**
```json
{
  "projectId": "prj_hmmWPWlwOGD8SO82Zfp3QmS4HaSj",
  "orgId": "team_GkSyu8uBcOfE0K8XTF4FsMDt",
  "projectName": "pintureria-digital"
}
```

**⚠️ Nota:** Este archivo se actualiza automáticamente cuando cambias el nombre en Vercel Dashboard, pero puedes actualizarlo manualmente.

#### `package.json`

**Archivo actual:**
```json
{
  "name": "ecommerce-boilerplate",
  ...
}
```

**Cambiar a (opcional):**
```json
{
  "name": "pintureria-digital",
  ...
}
```

**⚠️ Nota:** Esto es principalmente para npm/yarn. No afecta el deployment.

#### `scripts/development/setup-vercel-env.js`

**Buscar y cambiar:**
```javascript
// Línea ~46
this.projectName = 'pinteya-ecommerce'
```

**Cambiar a:**
```javascript
this.projectName = 'pintureria-digital'
```

#### `src/lib/integrations/supabase/index.ts`

**Buscar y cambiar:**
```typescript
// Línea ~45
'x-client-info': 'pinteya-ecommerce@1.0.0',
```

**Cambiar a:**
```typescript
'x-client-info': 'pintureria-digital@1.0.0',
```

**También cambiar:**
```typescript
// Línea ~67
'x-client-info': 'pinteya-admin@1.0.0',
```

**Cambiar a:**
```typescript
'x-client-info': 'pintureria-digital-admin@1.0.0',
```

#### `src/lib/supabase/index.ts`

**Buscar y cambiar:**
```typescript
// Línea ~36
'x-client-info': 'pinteya-ecommerce/1.0.0',
```

**Cambiar a:**
```typescript
'x-client-info': 'pintureria-digital/1.0.0',
```

---

### 6. 📝 Documentación

**Archivos de documentación que mencionan el nombre:**

- `docs/README.md`
- `docs/CONFIGURATION.md`
- `docs/getting-started/installation.md`
- `docs/getting-started/configuration.md`
- `README.md` (raíz del proyecto)
- Cualquier otro archivo `.md` que mencione `pinteya-ecommerce`

**Búsqueda para encontrar todos:**
```bash
# Buscar todas las referencias
grep -r "pinteya-ecommerce" docs/ README.md
```

**⚠️ Nota:** Esto es principalmente para documentación. No afecta la funcionalidad.

---

### 7. 🔧 Variables de Entorno (NO Cambian)

**Variables que NO necesitan cambiar:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Sigue siendo la misma URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Sigue siendo la misma key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Sigue siendo la misma key
- ✅ `REDIS_HOST`, `REDIS_PORT`, etc. - Siguen siendo los mismos valores
- ✅ Todas las demás variables de entorno

**⚠️ IMPORTANTE:** Las variables de entorno NO cambian cuando renombras el proyecto. Solo cambian si cambias de proyecto/servicio.

---

### 8. 🌍 Dominios y URLs (NO Cambian)

**Dominios que NO cambian:**
- ✅ `www.pinteya.com` - Sigue siendo el mismo dominio
- ✅ `www.pinteya.com.ar` - Sigue siendo el mismo dominio
- ✅ Deployment URL de Vercel - Sigue siendo la misma (a menos que cambies el proyecto)

**⚠️ IMPORTANTE:** Renombrar el proyecto en Vercel NO cambia los dominios configurados.

---

### 9. 📊 Analytics y Tracking (Verificar)

**Lugares donde puede aparecer el nombre:**

#### Google Analytics 4:
- **Property Name:** Puede tener el nombre del proyecto
- **Account Name:** Puede tener el nombre del proyecto
- **⚠️ Nota:** Renombrar aquí es opcional, no afecta el tracking

#### Meta Pixel:
- **App Name:** Puede tener el nombre del proyecto
- **⚠️ Nota:** Renombrar aquí es opcional

#### Vercel Analytics:
- Se actualiza automáticamente con el nombre del proyecto en Vercel

---

### 10. 💳 MercadoPago (Verificar)

**Si tienes una aplicación registrada en MercadoPago:**
- **App Name:** Puede tener el nombre del proyecto
- **⚠️ Nota:** Renombrar aquí es opcional, no afecta los pagos

---

### 11. 🔐 NextAuth / Autenticación (NO Cambia)

**Configuración que NO cambia:**
- ✅ `NEXTAUTH_URL` - Sigue siendo `https://www.pinteya.com`
- ✅ `NEXTAUTH_SECRET` - Sigue siendo el mismo
- ✅ OAuth providers (Google, etc.) - Siguen siendo los mismos

**⚠️ IMPORTANTE:** Renombrar el proyecto NO afecta la autenticación.

---

## ✅ Checklist de Renombrado

### Crítico (Debe hacerse)
- [ ] **Vercel Dashboard** - Renombrar proyecto
- [ ] **Supabase Dashboard** - Renombrar proyecto (opcional pero recomendado)
- [ ] **`.vercel/project.json`** - Actualizar `projectName` (se actualiza automáticamente)

### Importante (Recomendado)
- [ ] **GitHub Repository** - Renombrar si quieres (opcional)
- [ ] **`package.json`** - Actualizar `name` (opcional)
- [ ] **`scripts/development/setup-vercel-env.js`** - Actualizar `projectName`
- [ ] **`src/lib/integrations/supabase/index.ts`** - Actualizar `x-client-info` headers
- [ ] **`src/lib/supabase/index.ts`** - Actualizar `x-client-info` header
- [ ] **Documentación** - Actualizar referencias en archivos `.md`

### Opcional (No afecta funcionalidad)
- [ ] **Redis** - Renombrar base de datos (solo para organización)
- [ ] **Google Analytics** - Renombrar property (solo para organización)
- [ ] **Meta Pixel** - Renombrar app (solo para organización)
- [ ] **MercadoPago** - Renombrar app (solo para organización)

### NO Cambiar (No afecta)
- ❌ Variables de entorno - NO cambian
- ❌ Dominios - NO cambian
- ❌ URLs de APIs - NO cambian
- ❌ Keys de autenticación - NO cambian
- ❌ Configuración de NextAuth - NO cambia

---

## 🚀 Orden Recomendado de Renombrado

### Paso 1: Vercel (Más Importante)
1. Renombrar proyecto en Vercel Dashboard
2. Verificar que `.vercel/project.json` se actualizó automáticamente
3. Si no se actualizó, actualizar manualmente

### Paso 2: Supabase (Recomendado)
1. Renombrar proyecto en Supabase Dashboard
2. Verificar que las variables de entorno siguen funcionando

### Paso 3: Archivos Locales
1. Actualizar `package.json` (opcional)
2. Actualizar `scripts/development/setup-vercel-env.js`
3. Actualizar `src/lib/integrations/supabase/index.ts` (headers `x-client-info`)
4. Actualizar `src/lib/supabase/index.ts` (header `x-client-info`)
5. Actualizar documentación

### Paso 4: GitHub (Opcional)
1. Renombrar repositorio si quieres
2. Actualizar remote local

### Paso 5: Servicios Opcionales
1. Redis - Renombrar si quieres
2. Analytics - Renombrar si quieres
3. MercadoPago - Renombrar si quieres

---

## ⚠️ Advertencias Importantes

### 1. No Afecta Funcionalidad
**Renombrar el proyecto NO afecta:**
- ✅ Funcionalidad de la aplicación
- ✅ Variables de entorno
- ✅ Dominios configurados
- ✅ Deployments existentes
- ✅ Base de datos
- ✅ Autenticación

### 2. Verificar Después de Renombrar
Después de renombrar en Vercel:
- [ ] Verificar que el deployment sigue funcionando
- [ ] Verificar que los dominios siguen apuntando correctamente
- [ ] Verificar que las variables de entorno siguen configuradas
- [ ] Hacer un test deployment para confirmar

### 3. Backup
Antes de renombrar:
- [ ] Hacer backup de configuración importante
- [ ] Documentar el nombre actual por si necesitas revertir
- [ ] Verificar que tienes acceso a todos los servicios

---

## 📝 Notas Adicionales

### Nombre Sugerido: `pintureria-digital`

**Ventajas:**
- ✅ Refleja que es una plataforma multitenant
- ✅ No está atado a un tenant específico (Pinteya)
- ✅ Más profesional y escalable
- ✅ Fácil de entender

**Alternativas:**
- `pintureriadigital` (sin guión)
- `pintureria-digital-platform`
- `pintureria-multitenant`

### Impacto en Usuarios

**Renombrar el proyecto NO afecta:**
- ✅ URLs públicas (`www.pinteya.com` sigue funcionando)
- ✅ Experiencia del usuario
- ✅ Funcionalidad de la aplicación
- ✅ Datos existentes

**Solo afecta:**
- Dashboard interno de Vercel/Supabase
- Nombre en documentación
- Organización interna del proyecto

---

## 🔗 Referencias

- Documentación multitenant: `docs/MULTITENANCY.md`
- Guía de deployment: `docs/GUIA_DEPLOYMENT_MULTITENANT_PRODUCCION.md`
- Configuración: `docs/CONFIGURATION.md`

---

**Última actualización:** 2026-01-23  
**Estado:** ✅ **LISTO PARA RENOMBRAR**
