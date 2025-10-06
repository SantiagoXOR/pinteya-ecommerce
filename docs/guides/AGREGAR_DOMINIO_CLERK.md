# 🔧 Cómo agregar dominio en Clerk Dashboard

## Problema actual

- ✅ Clerk está funcionando correctamente
- ✅ Tienes claves de producción válidas
- ❌ Solo `pinteya.com` está autorizado
- ❌ `pinteya-ecommerce.vercel.app` no está autorizado

## Solución: Agregar dominio autorizado

### Paso 1: Acceder a Clerk Dashboard

1. Ve a: https://dashboard.clerk.com/
2. Inicia sesión con tu cuenta
3. Selecciona tu aplicación de producción (la que tiene las claves pk*live*)

### Paso 2: Navegar a Domains

1. En el sidebar izquierdo, busca **"Domains"**
2. Haz clic en la sección **"Domains"**

### Paso 3: Agregar nuevo dominio

1. Busca el botón **"Add domain"** o **"+ Add domain"**
2. Haz clic en él
3. En el campo de texto, ingresa: `pinteya-ecommerce.vercel.app`
4. Haz clic en **"Add"** o **"Save"**

### Paso 4: Verificar configuración

Después de agregar el dominio, deberías ver:

- `pinteya.com` ✅ (existente)
- `pinteya-ecommerce.vercel.app` ✅ (nuevo)

### Paso 5: Probar la aplicación

1. Ve a: https://pinteya-ecommerce.vercel.app/clerk-status
2. Verifica que las variables estén cargadas
3. Prueba el login: https://pinteya-ecommerce.vercel.app/signin
4. Configura tu rol admin: https://pinteya-ecommerce.vercel.app/api/admin/setup-role
5. Accede al admin: https://pinteya-ecommerce.vercel.app/admin

## ⚡ Resultado esperado

Una vez agregado el dominio:

- ✅ Login funcionará correctamente
- ✅ No más redirecciones a accounts.pinteya.com
- ✅ Middleware moderno funcionará perfectamente
- ✅ Podrás configurar tu rol admin
- ✅ Acceso completo al panel administrativo

## 🔍 Verificación

Después de agregar el dominio, verifica:

1. **Estado de Clerk**: https://pinteya-ecommerce.vercel.app/clerk-status
2. **Login funcional**: https://pinteya-ecommerce.vercel.app/signin
3. **Configurar rol**: https://pinteya-ecommerce.vercel.app/api/admin/setup-role
4. **Panel admin**: https://pinteya-ecommerce.vercel.app/admin

## 🆘 Si tienes problemas

Si no encuentras la sección "Domains" o tienes problemas:

1. **Verifica que estés en la aplicación correcta** (la de producción)
2. **Busca en "Settings" → "Domains"** (puede estar en configuración)
3. **Contacta soporte de Clerk** si no encuentras la opción
4. **Usa la Opción 2** (claves de desarrollo) como alternativa temporal

## 📞 Contacto

Si necesitas ayuda con algún paso específico, comparte:

- Screenshot del dashboard de Clerk
- Mensaje de error específico (si hay alguno)
- Resultado de /clerk-status después del cambio
