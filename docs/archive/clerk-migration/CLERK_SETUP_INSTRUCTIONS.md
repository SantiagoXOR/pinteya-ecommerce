# 🔧 Instrucciones para Configurar Clerk en Vercel

## Problema Identificado

Clerk está configurado para el dominio `pinteya.com` pero estás usando `pinteya-ecommerce.vercel.app`. Necesitas configurar las claves correctas.

## Solución Paso a Paso

### 1. Obtener las Claves de Clerk

1. Ve a [Clerk Dashboard](https://dashboard.clerk.com/)
2. Selecciona tu aplicación o crea una nueva
3. Ve a **API Keys** en el sidebar
4. Copia las claves de **Development** (no Production)

### 2. Configurar Variables en Vercel

Ve a: https://vercel.com/santiagoxor/pinteya-ecommerce/settings/environment-variables

Agrega estas variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[STRIPE_PUBLIC_KEY_REMOVED]...
CLERK_SECRET_KEY=[STRIPE_SECRET_KEY_REMOVED]...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
```

### 3. Configurar Dominio en Clerk

En Clerk Dashboard:

1. Ve a **Domains**
2. Agrega `pinteya-ecommerce.vercel.app` como dominio autorizado
3. O usa claves de desarrollo que funcionan en cualquier dominio

### 4. Redeploy

Después de configurar las variables:

1. Ve a: https://vercel.com/santiagoxor/pinteya-ecommerce/deployments
2. Haz click en "Redeploy" en el último deployment

### 5. Verificar

Una vez redeployado:

1. Ve a: https://pinteya-ecommerce.vercel.app/debug-clerk
2. Verifica que las variables estén configuradas
3. Prueba el login

### 6. Configurar Rol Admin

Una vez que puedas hacer login:

1. Ve a: https://pinteya-ecommerce.vercel.app/api/admin/setup-role
2. Esto configurará tu rol como admin
3. Luego podrás acceder a: https://pinteya-ecommerce.vercel.app/admin

## Formato de Claves

```
# Desarrollo (recomendado para testing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[STRIPE_PUBLIC_KEY_REMOVED][tu_clave_aqui]
CLERK_SECRET_KEY=[STRIPE_SECRET_KEY_REMOVED][tu_clave_aqui]

# Producción (solo si configuras dominio)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[tu_clave_aqui]
CLERK_SECRET_KEY=sk_live_[tu_clave_aqui]
```

## Verificación de Estado

Después de la configuración, verifica:

1. **Variables cargadas**: https://pinteya-ecommerce.vercel.app/debug-clerk
2. **Login funcional**: https://pinteya-ecommerce.vercel.app/signin
3. **Rol configurado**: https://pinteya-ecommerce.vercel.app/api/admin/setup-role
4. **Acceso admin**: https://pinteya-ecommerce.vercel.app/admin

## Troubleshooting

Si sigues teniendo problemas:

1. **Verifica que las claves estén completas** (no truncadas)
2. **Usa claves de desarrollo** para testing
3. **Redeploy después de cambios** en variables
4. **Revisa logs de Vercel** para errores específicos

## Contacto

Si necesitas ayuda adicional, comparte:

- Screenshot de las variables en Vercel
- Logs de error específicos
- Resultado de /debug-clerk después de la configuración
