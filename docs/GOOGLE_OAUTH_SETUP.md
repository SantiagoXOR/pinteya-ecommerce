# Configuración de Google OAuth para Pinteya E-commerce

## Guía Completa de Configuración

Esta guía te ayudará a configurar correctamente Google OAuth para el sistema de autenticación del proyecto Pinteya E-commerce.

## Paso 1: Acceder a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Selecciona o crea un proyecto

## Paso 2: Habilitar APIs Necesarias

1. En el menú lateral, ve a **APIs y servicios** > **Biblioteca**
2. Busca y habilita las siguientes APIs:
   - **Google+ API**
   - **Google Identity Toolkit API** (opcional pero recomendado)

## Paso 3: Configurar Pantalla de Consentimiento OAuth

1. Ve a **APIs y servicios** > **Pantalla de consentimiento de OAuth**
2. Selecciona **Externo** (para uso general) o **Interno** (solo para tu organización)
3. Completa la información requerida:
   - **Nombre de la aplicación**: Pinteya E-commerce
   - **Correo de asistencia del usuario**: tu@email.com
   - **Logo de la aplicación**: (opcional)
   - **Dominios autorizados**: Si estás en producción, agrega tu dominio
   - **Correo de contacto del desarrollador**: tu@email.com
4. Haz clic en **Guardar y continuar**
5. En **Ámbitos**, puedes dejarlo vacío o agregar los ámbitos necesarios
6. Revisa y confirma

## Paso 4: Crear Credenciales OAuth 2.0

1. Ve a **APIs y servicios** > **Credenciales**
2. Haz clic en **+ CREAR CREDENCIALES** > **ID de cliente OAuth 2.0**
3. Selecciona **Aplicación web** como tipo de aplicación
4. Configura los siguientes campos:

### Nombre
```
Pinteya E-commerce - Development
```

### Orígenes de JavaScript autorizados

Para desarrollo local:
```
http://localhost:3000
```

Para producción:
```
https://tu-dominio.com
https://www.tu-dominio.com
```

### URIs de redirección autorizados

⚠️ **MUY IMPORTANTE**: Esta es la configuración crítica

Para desarrollo local:
```
http://localhost:3000/api/auth/callback/google
```

Para producción:
```
https://tu-dominio.com/api/auth/callback/google
https://www.tu-dominio.com/api/auth/callback/google
```

5. Haz clic en **Crear**

## Paso 5: Copiar Credenciales

Después de crear las credenciales, Google te mostrará:

1. **Client ID** (ID de cliente)
2. **Client Secret** (Secreto del cliente)

**IMPORTANTE**: Guarda estas credenciales de forma segura.

## Paso 6: Configurar Variables de Entorno

### Para Desarrollo Local

Edita el archivo `.env.local`:

```bash
# Google OAuth Configuration
AUTH_GOOGLE_ID=tu_client_id_aqui.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=tu_client_secret_aqui

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_nextauth_secret_aqui
```

### Generar NEXTAUTH_SECRET

Ejecuta este comando en tu terminal:

```bash
openssl rand -base64 32
```

O usa este comando de Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Para Producción (Vercel)

En el dashboard de Vercel:

1. Ve a **Settings** > **Environment Variables**
2. Agrega las siguientes variables:

```
AUTH_GOOGLE_ID=tu_client_id_aqui
AUTH_GOOGLE_SECRET=tu_client_secret_aqui
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu_nextauth_secret_aqui
```

## Paso 7: Verificar Configuración

1. Reinicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Navega a `http://localhost:3000/admin`

3. Deberías ver el botón de "Continuar con Google"

4. Al hacer clic, deberías ser redirigido a Google para autenticarte

5. Después de autenticarte, deberías ser redirigido de vuelta a tu aplicación

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problema**: La URL de redirección no coincide con las configuradas en Google Cloud Console.

**Solución**: 
1. Verifica que la URI de redirección en Google Cloud Console sea exactamente:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
2. No debe tener espacios adicionales ni caracteres extra
3. Debe incluir el protocolo `http://` o `https://`

### Error: "invalid_client" o "Unauthorized"

**Problema**: Las credenciales de Google OAuth son incorrectas o han expirado.

**Solución**:
1. Verifica que `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` estén correctamente copiados
2. Asegúrate de que no haya espacios adicionales al inicio o final
3. Verifica que las credenciales sean del proyecto correcto en Google Cloud Console
4. Intenta regenerar las credenciales si es necesario

### Error: "Configuration Error"

**Problema**: Falta alguna variable de entorno o está mal configurada.

**Solución**:
1. Verifica que todas las variables estén en `.env.local`
2. Reinicia el servidor después de modificar `.env.local`
3. Verifica que `NEXTAUTH_URL` coincida con la URL actual (http://localhost:3000 en desarrollo)

### El botón de Google no aparece

**Problema**: NextAuth no está configurado correctamente.

**Solución**:
1. Verifica que el archivo `auth.ts` esté configurado correctamente
2. Asegúrate de que el provider de Google esté habilitado
3. Revisa los logs del servidor para ver errores específicos

## Bypass Temporal para Desarrollo

Si necesitas acceder al panel admin sin configurar Google OAuth (solo en desarrollo):

1. Edita `.env.local`:
   ```bash
   BYPASS_AUTH=true
   ```

2. Reinicia el servidor

3. Accede directamente a `http://localhost:3000/admin`

⚠️ **ADVERTENCIA**: El bypass solo funciona en `NODE_ENV=development` por razones de seguridad.

## Recursos Adicionales

- [Documentación de NextAuth.js](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Best Practices](https://nextjs.org/docs/authentication)

## Contacto

Si tienes problemas con la configuración, contacta a:
- **Email**: soporte@pinteya.com
- **Slack**: #dev-auth-support
