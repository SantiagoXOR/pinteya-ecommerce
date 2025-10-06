# 🌐 Configurar Dominio Personalizado para Pinteya E-commerce

## Objetivo

Usar un subdominio de `pinteya.com` (como `app.pinteya.com` o `admin.pinteya.com`) para la aplicación de e-commerce, manteniendo las claves de producción de Clerk.

## Ventajas

- ✅ Mantener claves de producción de Clerk
- ✅ Usar dominio autorizado (pinteya.com)
- ✅ URL profesional y consistente con la marca
- ✅ SSL automático con Vercel
- ✅ No modificar configuración de Clerk

## Paso 1: Elegir subdominio

Opciones recomendadas:

- `app.pinteya.com` (para la aplicación completa)
- `admin.pinteya.com` (si es principalmente para admin)
- `tienda.pinteya.com` (para e-commerce)
- `ecommerce.pinteya.com` (descriptivo)

**Recomendación**: `app.pinteya.com`

## Paso 2: Configurar DNS

### En tu proveedor de DNS (donde tienes pinteya.com):

1. **Accede al panel de DNS** de tu proveedor
2. **Crear registro CNAME**:
   - **Nombre**: `app` (o el subdominio elegido)
   - **Tipo**: `CNAME`
   - **Valor**: `pinteya-ecommerce.vercel.app`
   - **TTL**: `300` (5 minutos) o automático

### Ejemplo de configuración:

```
Tipo    Nombre    Valor                           TTL
CNAME   app       pinteya-ecommerce.vercel.app    300
```

## Paso 3: Configurar dominio en Vercel

1. **Ve a Vercel Dashboard**: https://vercel.com/santiagoxor/pinteya-ecommerce
2. **Ve a "Settings" → "Domains"**
3. **Haz clic en "Add"**
4. **Ingresa**: `app.pinteya.com` (o tu subdominio elegido)
5. **Haz clic en "Add"**
6. **Espera la verificación** (puede tomar unos minutos)

## Paso 4: Configurar como dominio principal (Opcional)

Si quieres que `app.pinteya.com` sea el dominio principal:

1. En Vercel → Settings → Domains
2. Busca `app.pinteya.com`
3. Haz clic en los tres puntos (⋯)
4. Selecciona "Set as Primary Domain"

## Paso 5: Actualizar variables de entorno (Si es necesario)

Si Clerk requiere URLs específicas, actualiza en Vercel:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
```

O si necesitas URLs completas:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://app.pinteya.com/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://app.pinteya.com/signup
```

## Paso 6: Verificar configuración

Una vez configurado:

1. **Accede a**: `https://app.pinteya.com`
2. **Verifica SSL**: Debe mostrar certificado válido
3. **Prueba login**: `https://app.pinteya.com/signin`
4. **Verifica Clerk**: `https://app.pinteya.com/clerk-status`

## Paso 7: Configurar rol admin

Una vez funcionando:

1. **Inicia sesión**: `https://app.pinteya.com/signin`
2. **Configura rol**: `https://app.pinteya.com/api/admin/setup-role`
3. **Accede admin**: `https://app.pinteya.com/admin`

## ⏱️ Tiempos de propagación

- **DNS**: 5-60 minutos (depende del proveedor)
- **Vercel**: 1-5 minutos después de la verificación DNS
- **SSL**: Automático una vez verificado el dominio

## 🔍 Verificación de DNS

Para verificar que el DNS está configurado correctamente:

```bash
# En terminal/cmd
nslookup app.pinteya.com

# Debería mostrar:
# app.pinteya.com canonical name = pinteya-ecommerce.vercel.app
```

## 🆘 Troubleshooting

### Si el DNS no propaga:

1. Verifica la configuración en tu proveedor de DNS
2. Espera más tiempo (hasta 24h en casos extremos)
3. Usa herramientas como https://dnschecker.org/

### Si Vercel no verifica:

1. Verifica que el CNAME esté correcto
2. Espera a que propague el DNS
3. Intenta eliminar y volver a agregar el dominio

### Si Clerk no funciona:

1. Verifica que pinteya.com esté autorizado en Clerk
2. Los subdominios heredan la autorización del dominio principal
3. Si no funciona, agrega app.pinteya.com específicamente en Clerk

## 📋 Checklist final

- [ ] DNS configurado (CNAME)
- [ ] Dominio agregado en Vercel
- [ ] SSL funcionando
- [ ] Aplicación accesible en app.pinteya.com
- [ ] Login funcionando
- [ ] Rol admin configurado
- [ ] Panel admin accesible

## 🎯 Resultado esperado

- **URL principal**: `https://app.pinteya.com`
- **Login**: `https://app.pinteya.com/signin`
- **Admin**: `https://app.pinteya.com/admin`
- **SSL**: ✅ Certificado válido
- **Clerk**: ✅ Funcionando con claves de producción
