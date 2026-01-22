# Guía de Configuración de Credenciales - Analytics APIs

Esta guía te ayudará a configurar las credenciales necesarias para integrar Google Analytics 4 Data API y Meta Marketing API.

## Índice

1. [Variables de Entorno Requeridas](#variables-de-entorno-requeridas)
2. [Configuración de Google Analytics 4](#configuración-de-google-analytics-4)
3. [Configuración de Meta Marketing API](#configuración-de-meta-marketing-api)
4. [Verificación de la Configuración](#verificación-de-la-configuración)
5. [Solución de Problemas](#solución-de-problemas)

---

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```bash
# ===========================================
# GOOGLE ANALYTICS 4 DATA API
# ===========================================

# Opción 1: Path al archivo JSON de credenciales (local)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Opción 2: Credenciales JSON como string (para Vercel/producción)
GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# ID numérico de la propiedad GA4 (NO es el Measurement ID G-XXXXXXXX)
GA4_PROPERTY_ID=123456789

# ===========================================
# META MARKETING API
# ===========================================

# Token de acceso de larga duración
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxx

# Pixel ID (puede ser el mismo que NEXT_PUBLIC_META_PIXEL_ID)
META_PIXEL_ID=1234567890123456

# ID de cuenta publicitaria (opcional, para métricas de ads)
META_AD_ACCOUNT_ID=act_1234567890
```

---

## Configuración de Google Analytics 4

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID**

### Paso 2: Habilitar la API

1. Ve a **APIs & Services** > **Library**
2. Busca "**Google Analytics Data API**"
3. Haz clic en **Enable**

![Habilitar GA4 Data API](https://developers.google.com/static/analytics/images/reporting/data-api/v1/quickstart/enable-api.png)

### Paso 3: Crear Service Account

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **Service Account**
3. Completa los datos:
   - **Name**: `pinteya-analytics` (o el nombre que prefieras)
   - **Description**: Service account para GA4 Data API
4. Haz clic en **Create and Continue**
5. Omite los roles opcionales y haz clic en **Done**

### Paso 4: Generar Clave JSON

1. En la lista de Service Accounts, haz clic en el email del que acabas de crear
2. Ve a la pestaña **Keys**
3. Haz clic en **Add Key** > **Create new key**
4. Selecciona **JSON** y haz clic en **Create**
5. El archivo JSON se descargará automáticamente

⚠️ **IMPORTANTE**: Guarda este archivo de forma segura. No lo subas a Git.

### Paso 5: Agregar Service Account a GA4

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Selecciona tu propiedad GA4
3. Ve a **Admin** (⚙️) > **Property Access Management**
4. Haz clic en el botón **+** y luego **Add users**
5. Ingresa el **email del Service Account** (termina en `@...iam.gserviceaccount.com`)
6. Asigna el rol **Viewer** (solo lectura)
7. Haz clic en **Add**

### Paso 6: Obtener el Property ID

1. En Google Analytics, ve a **Admin** (⚙️)
2. En la columna de **Property**, haz clic en **Property Settings**
3. Copia el **Property ID** (número, ej: `123456789`)

⚠️ **NOTA**: El Property ID es un número. NO es el Measurement ID (que empieza con `G-`).

### Paso 7: Configurar Variables de Entorno

**Para desarrollo local:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=C:/ruta/a/tu/service-account.json
GA4_PROPERTY_ID=123456789
```

**Para Vercel/producción:**
1. Abre el archivo JSON y copia todo su contenido
2. En Vercel, ve a **Settings** > **Environment Variables**
3. Crea `GOOGLE_CREDENTIALS_JSON` con el contenido del JSON (como string)
4. Crea `GA4_PROPERTY_ID` con el ID numérico

---

## Configuración de Meta Marketing API

### Paso 1: Crear App en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Haz clic en **My Apps** > **Create App**
3. Selecciona **Business** como tipo de app
4. Completa los datos y crea la app

### Paso 2: Agregar Marketing API

1. En el Dashboard de tu app, haz clic en **Add Product**
2. Busca **Marketing API** y haz clic en **Set Up**
3. Acepta los términos

### Paso 3: Generar Access Token

**Opción A: Token de Prueba (expira en ~2 horas)**
1. Ve a [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecciona tu app
3. Haz clic en **Generate Access Token**
4. Selecciona permisos: `ads_read`, `read_insights`

**Opción B: Token de Larga Duración (recomendado para producción)**

1. Primero obtén un token de corta duración desde Graph API Explorer
2. Ve a [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
3. Pega el token y haz clic en **Debug**
4. Haz clic en **Extend Access Token** al final de la página
5. Copia el nuevo token de larga duración (~60 días)

**Opción C: System User Token (permanente, mejor para producción)**

1. Ve a [Business Settings](https://business.facebook.com/settings)
2. Ve a **Users** > **System Users**
3. Haz clic en **Add**
4. Crea un System User con rol **Admin**
5. Haz clic en **Generate New Token**
6. Selecciona tu app y los permisos: `ads_read`, `read_insights`
7. Este token no expira

### Paso 4: Verificar Dominio (Opcional pero recomendado)

1. Ve a [Business Settings](https://business.facebook.com/settings)
2. Ve a **Brand Safety** > **Domains**
3. Agrega tu dominio y verifica usando meta-tag o DNS

### Paso 5: Obtener IDs

**Pixel ID:**
1. Ve a [Events Manager](https://business.facebook.com/events_manager)
2. Selecciona tu Pixel
3. El ID está en la URL o en la configuración del Pixel

**Ad Account ID (opcional):**
1. Ve a [Ads Manager](https://business.facebook.com/adsmanager)
2. El ID está en la URL después de `act_` (ej: `act_1234567890`)

### Paso 6: Configurar Variables de Entorno

```bash
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxx
META_PIXEL_ID=1234567890123456
META_AD_ACCOUNT_ID=1234567890  # Sin el prefijo act_
```

---

## Verificación de la Configuración

### Verificar Google Analytics

```bash
# Desde el navegador o Postman
GET /api/analytics/google?type=status
```

Respuesta esperada:
```json
{
  "success": true,
  "status": {
    "connected": true,
    "propertyId": "123456789"
  }
}
```

### Verificar Meta

```bash
GET /api/analytics/meta?type=status
```

Respuesta esperada:
```json
{
  "success": true,
  "status": {
    "connected": true,
    "pixelId": "1234567890123456",
    "pixelName": "Tu Pixel"
  }
}
```

### Verificar Servicio Unificado

```bash
GET /api/analytics/external?type=status
```

---

## Solución de Problemas

### Error: "Credenciales de Google no configuradas"

**Causa**: Las variables `GOOGLE_APPLICATION_CREDENTIALS` o `GOOGLE_CREDENTIALS_JSON` no están definidas.

**Solución**:
- Verifica que el archivo `.env.local` tiene las variables
- En Vercel, verifica que están en Environment Variables
- Reinicia el servidor de desarrollo después de cambiar `.env.local`

### Error: "GA4_PROPERTY_ID no configurado"

**Causa**: Falta el Property ID numérico.

**Solución**:
- El Property ID es un número (ej: `123456789`)
- NO uses el Measurement ID (ej: `G-XXXXXXXXXX`)
- Encuéntralo en GA4 > Admin > Property Settings

### Error: "Permission denied" en GA4

**Causa**: El Service Account no tiene acceso a la propiedad GA4.

**Solución**:
1. Ve a GA4 > Admin > Property Access Management
2. Verifica que el email del Service Account está listado
3. El email termina en `@...iam.gserviceaccount.com`

### Error: "META_ACCESS_TOKEN no configurado"

**Causa**: Falta el token de acceso de Meta.

**Solución**:
- Genera un nuevo token desde Graph API Explorer
- Para producción, usa un System User Token

### Error: "Invalid OAuth access token" en Meta

**Causa**: El token expiró o es inválido.

**Solución**:
1. Ve a [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
2. Verifica si el token es válido
3. Si expiró, genera uno nuevo

### Los datos de GA4 no aparecen

**Causa posible**: GA4 Data API tiene un delay de 24-48 horas para datos históricos.

**Solución**:
- Para datos en tiempo real (últimos 30 min), usa `type=realtime`
- Los datos de compras pueden tardar 24-48h en aparecer

### Los eventos de Meta no coinciden

**Causa**: Meta no permite consultar eventos individuales por transaction_id.

**Solución**:
- Meta solo devuelve eventos agregados por rango de fechas
- Usa el Events Manager para ver eventos individuales
- Implementa Conversions API para tracking server-side redundante

---

## Recursos Adicionales

- [Google Analytics Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Meta Marketing API Documentation](https://developers.facebook.com/docs/marketing-api)
- [Meta Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [GA4 Property ID vs Measurement ID](https://support.google.com/analytics/answer/12270356)

---

## Ejemplo de Uso

Una vez configurado, puedes usar el servicio así:

```typescript
// Consultar journey de una orden
const journey = await externalAnalyticsService.getOrderJourney('395')

console.log(journey)
// {
//   local: { events: [...], purchaseEvent: {...} },
//   googleAnalytics: { available: true, purchase: {...} },
//   metaPixel: { available: true, eventsSent: true },
//   verification: {
//     ga4PurchaseReceived: true,
//     metaPurchaseReceived: true,
//     dataMatch: true
//   }
// }

// Comparar métricas entre fuentes
const comparison = await externalAnalyticsService.compareAnalytics('2024-01-01', '2024-01-31')
```

---

*Última actualización: Enero 2026*
