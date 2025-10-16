# 🔐 Configuración de Google Maps API Key

## ⚠️ INCIDENTE DE SEGURIDAD RESUELTO

Se ha detectado y solucionado un incidente de seguridad donde una clave de Google Maps API estaba hardcodeada en el código fuente.

## ✅ Acciones Completadas

1. **Clave anterior revocada** - La clave `AIzaSyBBDvjcC42QcHu7qlToPK4tTaV7EdvtJmc` ha sido revocada
2. **Código limpiado** - Se eliminaron todas las referencias hardcodeadas
3. **Archivos de documentación actualizados** - Se reemplazaron las claves expuestas
4. **Reportes de testing eliminados** - Se removieron archivos que contenían la clave

## 🚀 Pasos para Configurar Nueva Clave

### 1. Generar Nueva Clave en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Navega a **APIs & Services** → **Credentials**
4. Haz clic en **+ CREATE CREDENTIALS** → **API Key**
5. Copia la nueva clave generada

### 2. Configurar Restricciones de Seguridad

**IMPORTANTE**: Configura restricciones para mayor seguridad:

#### Restricciones de Aplicación:
- **HTTP referrers (web sites)**: 
  - `localhost:3000/*`
  - `tu-dominio.com/*`
  - `*.vercel.app/*` (si usas Vercel)

#### Restricciones de API:
- **Maps JavaScript API**
- **Geocoding API**
- **Places API**
- **Directions API**

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Google Maps API Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_nueva_api_key_aqui
GOOGLE_MAPS_API_KEY=tu_nueva_api_key_aqui
```

### 4. Verificar Configuración

1. Reinicia el servidor de desarrollo
2. Verifica que los mapas funcionen correctamente
3. Revisa la consola del navegador para errores

## 🛡️ Mejores Prácticas de Seguridad

1. **Nunca hardcodees claves** en el código fuente
2. **Usa variables de entorno** para todas las claves
3. **Configura restricciones** en Google Cloud Console
4. **Revisa regularmente** las claves activas
5. **Rota las claves** periódicamente
6. **Monitorea el uso** de las APIs

## 📁 Archivos Modificados

- `src/components/ui/AddressMapSelector.tsx`
- `src/app/test-map-selector/page.tsx`
- `src/components/Checkout/ExpressForm.tsx`
- `src/app/test-address-validation/page.tsx`
- `src/lib/services/addressValidation.ts`
- `VALIDACION_DIRECCIONES_FINAL.md`
- `SELECTOR_MAPA_INTERACTIVO.md`
- `SECURITY_INCIDENT_RESPONSE.md`

## 🔍 Verificación

Para verificar que no hay más claves expuestas, ejecuta:

```bash
# Buscar patrones de claves de API
grep -r "AIza[A-Za-z0-9_-]{35}" src/
grep -r "sk-[A-Za-z0-9]{48}" src/
grep -r "pk_[A-Za-z0-9]{24}" src/
```

## 📞 Soporte

Si encuentras algún problema con la configuración, revisa:
1. Los logs de la consola del navegador
2. Los logs del servidor de desarrollo
3. La configuración en Google Cloud Console
