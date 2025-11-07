# 🔍 DEBUG EN PRODUCCIÓN - Flash Days

## ❌ Problema Actual

El usuario intenta participar en el sorteo desde **pinteya.com.ar** (producción) y recibe:

```
Error al registrar participación. Intentá de nuevo.
```

---

## 🧪 Tests Realizados

### ✅ Base de Datos
- Tabla `flash_days_participants` **SÍ existe** en producción
- Políticas RLS **correctamente configuradas**
- INSERT directo a Supabase **funciona OK**

### ❌ API Route
- La petición no llega a Supabase (no hay logs)
- El error viene del API de Next.js (Vercel)
- El código **ya tiene logging mejorado** para diagnosticar

---

## 🎯 Próximos Pasos para Diagnosticar

### 1. Verificar Logs de Vercel

```bash
# Acceder a Vercel Dashboard
https://vercel.com/tu-proyecto/logs

# Buscar logs de:
[FLASH_DAYS]
```

**Los logs nuevos incluyen:**
- `[FLASH_DAYS] POST /participate - Inicio`
- `[FLASH_DAYS] Phone recibido: 3547527070`
- `[FLASH_DAYS] Phone normalizado: 5493547527070`
- `[FLASH_DAYS] Metadata: { ip: "...", deviceType: "mobile" }`
- `[FLASH_DAYS] Conectando a Supabase...`
- `[FLASH_DAYS] Cliente Supabase creado OK`
- `[FLASH_DAYS] Verificando duplicados...`
- `[FLASH_DAYS] Preparando INSERT...`
- `[FLASH_DAYS] CATCH - Error...` (si falla)

### 2. Verificar Variables de Entorno en Vercel

Asegúrate de que en **Vercel > Settings > Environment Variables** tengas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aakzspzfulgftqlgwkpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui (opcional)
```

### 3. Verificar que el Deploy Incluyó los Archivos

En Vercel, verifica que estos archivos estén deployados:

- ✅ `src/app/api/flash-days/participate/route.ts`
- ✅ `src/app/api/flash-days/participants/route.ts`
- ✅ `src/app/api/flash-days/raffle/route.ts`

### 4. Test Manual desde el Navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Test manual del API
fetch('https://www.pinteya.com.ar/api/flash-days/participate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phoneNumber: '3547527070',
    metadata: {
      deviceType: 'mobile',
      screenResolution: '360x800',
      browserLanguage: 'es-AR',
      timezone: 'America/Argentina/Buenos_Aires',
      referrer: 'direct',
    }
  })
})
.then(r => r.json())
.then(data => console.log('✅ Respuesta:', data))
.catch(err => console.error('❌ Error:', err))
```

---

## 🔧 Posibles Causas del Error

### 1. El API Route No Se Deployó
**Solución:** Hacer redeploy desde Vercel

```bash
git add .
git commit -m "feat: add flash days logging"
git push origin main
```

### 2. Error de TypeScript en Build
**Verificar:** Logs de build en Vercel

Si hay errores de tipo, verás:
```
Type error: Property 'role_name' does not exist on type...
```

**Ya corregido en el código actual con `as any`**

### 3. Variables de Entorno Faltantes
**Verificar:** Que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén en Vercel

### 4. Timeout de Supabase
**Verificar:** Si la conexión a Supabase tarda mucho

Agregar timeout:
```typescript
const response = await fetch('/api/flash-days/participate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber, metadata }),
  signal: AbortSignal.timeout(10000), // 10 segundos
})
```

---

## 📊 Cómo Leer los Logs de Vercel

### Acceder a los Logs

1. Ve a **https://vercel.com/tu-proyecto**
2. Click en **Logs** (menú lateral)
3. Filtra por **Runtime Logs**
4. Busca `[FLASH_DAYS]`

### Logs que Esperamos Ver

**Caso de Éxito:**
```
[FLASH_DAYS] POST /participate - Inicio
[FLASH_DAYS] Phone recibido: 3547527070
[FLASH_DAYS] Phone normalizado: 5493547527070
[FLASH_DAYS] Metadata: { ip: "181.2.22.96", deviceType: "mobile" }
[FLASH_DAYS] Conectando a Supabase...
[FLASH_DAYS] Cliente Supabase creado OK
[FLASH_DAYS] Verificando duplicados...
[FLASH_DAYS] No hay duplicados, procediendo a guardar...
[FLASH_DAYS] Preparando INSERT...
[FLASH_DAYS] Datos a insertar: { phone_number: "3547527070", ... }
[FLASH_DAYS] Participante registrado: { id: "uuid", phone: "3547527070", ... }
```

**Caso de Error:**
```
[FLASH_DAYS] POST /participate - Inicio
[FLASH_DAYS] CATCH - Error in participate endpoint: ...
```

---

## 🚀 Solución Rápida (mientras investigamos)

### Opción 1: Modo Fallback (Solo WhatsApp, sin DB)

Si necesitas que funcione YA mientras arreglamos la DB, podemos hacer un rollback temporal:

```typescript
// En WhatsAppPopup.tsx, comentar la llamada a API:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  // TEMPORAL: Saltar DB y abrir WhatsApp directamente
  const message = `🎨 *¡Hola desde Pinteya!* ...`
  const whatsappUrl = `https://wa.me/5493513411796?text=${encodeURIComponent(message)}`
  
  window.open(whatsappUrl, '_blank')
  setIsOpen(false)
}
```

### Opción 2: Verificar Build de Vercel

1. Ve a **Vercel Dashboard > Deployments**
2. Click en el último deployment
3. Click en **Build Logs**
4. Busca errores de TypeScript

---

## 📝 Checklist de Verificación

- [ ] Verificar que el API route está deployado en Vercel
- [ ] Verificar variables de entorno en Vercel
- [ ] Verificar logs de Runtime en Vercel
- [ ] Verificar logs de Build en Vercel
- [ ] Test manual desde consola del navegador
- [ ] Verificar que Supabase está accesible desde Vercel

---

## 💡 Próxima Acción Recomendada

**EJECUTAR ESTE COMANDO EN VERCEL (o localmente con mismo .env de producción):**

1. Ve a tu proyecto local
2. Copia las variables de entorno de Vercel a `.env.local`
3. Ejecuta:

```bash
npm run dev
```

4. Abre el navegador
5. Intenta participar
6. Ve los logs en la terminal

**Los logs con `[FLASH_DAYS]` te dirán EXACTAMENTE dónde está fallando.**

---

## 🔑 Verificar que Supabase Acepta la Conexión

Ejecuta este query en Supabase SQL Editor:

```sql
-- Ver si la tabla tiene las columnas correctas
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'flash_days_participants'
ORDER BY ordinal_position;

-- Ver participantes actuales
SELECT * FROM flash_days_participants
ORDER BY participated_at DESC
LIMIT 10;
```

---

## ✅ Una Vez Solucionado

Cuando funcione, verás en Supabase logs:

```
POST | 201 | [IP] | [ID] | /rest/v1/flash_days_participants
```

Y en Vercel logs:

```
[FLASH_DAYS] Participante registrado: { id: "...", phone: "3547527070" }
```

---

**Estado Actual:** Esperando logs de Vercel para identificar causa exacta del error 🔍











