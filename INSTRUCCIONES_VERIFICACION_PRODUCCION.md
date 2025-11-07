# 🔧 Instrucciones de Verificación y Solución - Flash Days Popup

## ✅ Cambios Implementados

### 1. Rediseño Completo del WhatsApp Popup
- ✅ **Paleta de colores Pinteya aplicada:**
  - Naranja principal: `#eb6313`, `#f27a1d`, `#bd4811`
  - Verde WhatsApp: `#00ca53`, `#009e44`, `#007638`
  - Amarillo dorado: `#FFD700`

- ✅ **Imagen personalizada:**
  - Banner de pintor con la imagen `popuppinteya.png`
  - Optimizado con Next.js Image component

- ✅ **Contenido actualizado:**
  - Fechas: 15 de diciembre - 31 de diciembre
  - Texto simplificado: "Sorteo Flash Days" (sin referencia a Cyber Monday)

### 2. Timing Mejorado (Mejores Prácticas)
- ✅ **Desktop:** 30 segundos + 50% de scroll
- ✅ **Mobile:** 45 segundos + 30% de scroll
- ✅ **Persistencia:** Una vez cada 3 días (no cada sesión)
- ✅ **Coordinación:** No se muestra si ExitIntent apareció hace menos de 24h

### 3. Diagnóstico de Base de Datos
- ✅ **Tabla existe:** `flash_days_participants` con 1 participante
- ✅ **RLS correctamente configurado:**
  - `Anyone can participate` - INSERT público ✅
  - `Admins can read participants` - Solo admins SELECT ✅
  - `Admins can update participants` - Solo admins UPDATE ✅

---

## 🚨 Problema a Resolver

**Error reportado:** "Error al registrar participación. Intentá de nuevo."

### Causa Probable
El error **NO es por la base de datos** (está bien configurada). Posibles causas:

1. **Variables de entorno faltantes en Vercel**
2. **Timeout en la conexión**
3. **Error en el código del API route**

---

## 📋 Pasos de Verificación en Vercel

### Paso 1: Verificar Variables de Entorno

1. Ve a **https://vercel.com/tu-proyecto**
2. Click en **Settings** → **Environment Variables**
3. Verifica que existan:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aakzspzfulgftqlgwkpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu_key_publica_aqui]
```

4. Si faltan, agrégalas y **Redeploy** el proyecto

### Paso 2: Revisar Logs de Producción

1. Ve a **Vercel Dashboard** → **Logs** → **Runtime Logs**
2. Filtra por `[FLASH_DAYS]`
3. Busca el error específico. Los logs esperados:

**Caso Exitoso:**
```
[FLASH_DAYS] POST /participate - Inicio
[FLASH_DAYS] Phone recibido: 3547527070
[FLASH_DAYS] Phone normalizado: 5493547527070
[FLASH_DAYS] Conectando a Supabase...
[FLASH_DAYS] Cliente Supabase creado OK
[FLASH_DAYS] Verificando duplicados...
[FLASH_DAYS] No hay duplicados, procediendo a guardar...
[FLASH_DAYS] Preparando INSERT...
[FLASH_DAYS] Participante registrado: { id: "uuid", phone: "..." }
```

**Caso con Error:**
```
[FLASH_DAYS] POST /participate - Inicio
[FLASH_DAYS] CATCH - Error in participate endpoint: [mensaje]
```

### Paso 3: Verificar Build

1. Ve a **Deployments** → último deployment
2. Click en **Build Logs**
3. Busca errores de TypeScript o compilación

---

## 🔧 Soluciones según Error Encontrado

### Solución A: Variables de Entorno Faltantes

**Si los logs muestran:** `ERROR: Variables de entorno faltantes`

**Acción:**
1. Agregar variables en Vercel Settings
2. Hacer Redeploy desde Dashboard o:

```bash
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### Solución B: Error de Conexión a Supabase

**Si los logs muestran:** Error al conectar con Supabase

**Acción:**
1. Verificar que el proyecto de Supabase esté activo
2. Verificar que las keys sean correctas
3. Verificar políticas RLS (ya están bien según diagnóstico)

### Solución C: El código ya está correcto

**Si todo funciona localmente pero no en producción:**

El código ya usa `createBrowserClient` con keys públicas según `FIX_500_ERROR_FLASH_DAYS.md`.

**Verificar en `src/app/api/flash-days/participate/route.ts`:**

```typescript
// Debe usar cliente público, NO servidor
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## 🧪 Testing Manual (después del fix)

### Desde Consola del Navegador

```javascript
// Test del API en producción
fetch('https://www.pinteya.com/api/flash-days/participate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
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

**Respuesta esperada si funciona:**
```json
{
  "success": true,
  "alreadyParticipated": false,
  "message": "¡Participación registrada! Abrimos WhatsApp para confirmar tu interés.",
  "participantId": "uuid-aqui",
  "participatedAt": "2024-11-07T..."
}
```

### Desde la UI

1. Abre https://www.pinteya.com/
2. Scrollea al menos 50% de la página
3. Espera 30-45 segundos
4. Debería aparecer el popup rediseñado con colores Pinteya
5. Ingresa un número de WhatsApp
6. Click en "Participar por WhatsApp"
7. ✅ Debe abrir WhatsApp y mostrar confirmación

---

## 📊 Verificación en Supabase

### Query para Ver Participantes

```sql
SELECT 
  id,
  phone_number,
  phone_normalized,
  device_type,
  status,
  participated_at,
  whatsapp_opened
FROM flash_days_participants
ORDER BY participated_at DESC
LIMIT 10;
```

### Query para Ver Estadísticas

```sql
SELECT 
  COUNT(*) as total_participantes,
  COUNT(DISTINCT phone_normalized) as numeros_unicos,
  COUNT(CASE WHEN whatsapp_opened THEN 1 END) as abrieron_whatsapp,
  COUNT(CASE WHEN status = 'winner' THEN 1 END) as ganadores
FROM flash_days_participants;
```

---

## 🎨 Cambios de Diseño Implementados

### Colores Actualizados

| Elemento | Antes | Ahora (Pinteya) |
|----------|-------|-----------------|
| Header gradiente | Purple/Blue | `#eb6313` → `#f27a1d` → `#bd4811` |
| Badge Flash Days | Orange/Red | `#f27a1d` → `#eb6313` |
| Gift Cards highlight | Yellow-300 | `#FFD700` (Bright Sun) |
| Input focus | Purple-500 | `#eb6313` (Blaze Orange) |
| Botón WhatsApp | Green-500/600 | `#00ca53` → `#009e44` (Fun Green) |
| Links | Purple-600 | `#eb6313` (Blaze Orange) |
| Confirmación | Purple-600 | `#00ca53` (Fun Green) |

### Timing Actualizado

| Configuración | Antes | Ahora |
|---------------|-------|-------|
| Timer Desktop | 5 segundos | 30 segundos |
| Timer Mobile | 5 segundos | 45 segundos |
| Scroll requerido Desktop | - | 50% |
| Scroll requerido Mobile | - | 30% |
| Persistencia | Por sesión | 3 días |
| Coordinación ExitIntent | - | 24 horas cooldown |

---

## ✅ Checklist Final

- [ ] Variables de entorno en Vercel verificadas
- [ ] Logs de Vercel revisados
- [ ] Test manual del API exitoso
- [ ] Popup aparece con nuevo diseño
- [ ] Colores Pinteya aplicados correctamente
- [ ] Imagen del pintor se muestra
- [ ] Timing mejorado funciona (30-45s + scroll)
- [ ] No se superpone con ExitIntent
- [ ] Registro en base de datos funciona
- [ ] WhatsApp se abre correctamente
- [ ] Mensaje de confirmación aparece

---

## 📞 Si el Problema Persiste

1. **Compartir los logs de Vercel** (filtrados por `[FLASH_DAYS]`)
2. **Verificar en Supabase SQL Editor:**
   ```sql
   SELECT * FROM flash_days_participants ORDER BY created_at DESC LIMIT 5;
   ```
3. **Probar el API directamente** con el snippet de JavaScript arriba
4. **Verificar que la imagen existe:** https://www.pinteya.com/images/promo/popuppinteya.png

---

**Estado:** ✅ Código actualizado y listo para deploy
**Próximo paso:** Verificar variables de entorno en Vercel y testear en producción

