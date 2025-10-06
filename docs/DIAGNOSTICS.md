# 🔧 Herramientas de Diagnóstico - Pinteya E-commerce

## 📋 Descripción General

Este documento describe las herramientas de diagnóstico y debugging disponibles en el sistema Pinteya E-commerce. Estas herramientas están diseñadas para facilitar el mantenimiento, debugging y monitoreo del sistema.

## 🏗️ Arquitectura de Diagnósticos

### Estructura de Directorios

```
src/app/
├── admin/                          # Panel de administración
│   ├── layout.tsx                  # Layout específico para admin
│   ├── page.tsx                    # Página principal de admin
│   └── diagnostics/
│       └── page.tsx                # Dashboard de diagnósticos
├── test-env/                       # Test de variables de entorno
├── debug-clerk/                    # Debug específico de Clerk
├── test-clerk/                     # Test de componentes Clerk
└── api/debug/
    └── env/route.ts                # API de verificación de entorno
```

## 🔍 Herramientas Disponibles

### 1. Panel de Administración (`/admin`)

**Acceso:** Protegido con contraseña
**Propósito:** Dashboard centralizado para todas las herramientas de admin

**Características:**

- Autenticación simple con localStorage
- Categorización de herramientas
- Estado del sistema en tiempo real
- Acciones rápidas

**Contraseñas de acceso:**

- `pinteya2024` (principal)
- `admin` (alternativa)

### 2. Dashboard de Diagnósticos (`/admin/diagnostics`)

**Acceso:** A través del panel de admin
**Propósito:** Centralizar todas las herramientas de diagnóstico

**Características:**

- Filtrado por categorías
- Estado de cada herramienta
- Enlaces directos a herramientas
- Información de última actualización

### 3. Test de Variables de Entorno (`/test-env`)

**Acceso:** Público (solo variables NEXT*PUBLIC*\*)
**Propósito:** Verificar configuración de variables de entorno en el cliente

**Verifica:**

- ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
- ✅ NEXT_PUBLIC_APP_URL

### 4. Debug de Clerk (`/debug-clerk`)

**Acceso:** Público
**Propósito:** Diagnóstico específico de autenticación con Clerk

**Características:**

- Verificación de carga de scripts
- Test de conectividad
- Importación dinámica de Clerk
- Recomendaciones específicas

### 5. Test de Componentes Clerk (`/test-clerk`)

**Acceso:** Público
**Propósito:** Probar componentes de autenticación

**Características:**

- Estado de autenticación
- Información del usuario
- Componentes SignedIn/SignedOut
- Enlaces a páginas de auth

### 6. API de Debug de Entorno (`/api/debug/env`)

**Acceso:** Protegido con parámetro `?debug=pinteya2024`
**Propósito:** Verificar configuración del servidor

**Características:**

- Variables públicas (valores completos)
- Variables privadas (solo existencia)
- Análisis automático de configuración
- Detección de problemas

## 🔒 Seguridad y Acceso

### Niveles de Protección

1. **Público:** Herramientas que solo exponen información no sensible
   - `/test-env` - Solo variables NEXT*PUBLIC*\*
   - `/debug-clerk` - Sin información sensible
   - `/test-clerk` - Componentes de UI

2. **Protegido con Contraseña:** Panel de admin
   - `/admin/*` - Requiere autenticación simple

3. **Protegido con Parámetro:** APIs sensibles
   - `/api/debug/env` - Requiere parámetro debug

### Configuración de Seguridad

```typescript
// En producción, la API de debug requiere parámetro especial
if (process.env.NODE_ENV === 'production' && debug !== 'pinteya2024') {
  return NextResponse.json({ error: 'Debug endpoint not available in production' }, { status: 403 })
}
```

## 🚀 Uso en Diferentes Entornos

### Desarrollo Local

- Todas las herramientas están disponibles
- Sin restricciones de acceso
- Información completa visible

### Staging/Testing

- Herramientas disponibles con autenticación
- Logs detallados habilitados
- Acceso completo para QA

### Producción

- Herramientas protegidas
- APIs requieren parámetros especiales
- Información sensible oculta

## 📊 Categorías de Herramientas

### 🌐 Environment (Entorno)

- Variables de entorno
- Configuración del sistema
- Estado de servicios externos

### 🔐 Authentication (Autenticación)

- Estado de Clerk
- Componentes de auth
- Flujos de autenticación

### 🗄️ Database (Base de Datos)

- Conexión a Supabase
- Estado de tablas
- Queries de diagnóstico

### 💳 Payments (Pagos)

- Configuración MercadoPago
- Estado de webhooks
- Transacciones de prueba

### 🛡️ Security (Seguridad)

- Headers de seguridad
- CSP configuration
- Rate limiting

## 🔧 Mantenimiento

### Agregar Nueva Herramienta

1. **Crear la página/API**
2. **Agregar al array en `/admin/diagnostics/page.tsx`:**

```typescript
{
  id: 'nueva-herramienta',
  name: 'Nueva Herramienta',
  description: 'Descripción de la herramienta',
  path: '/nueva-herramienta',
  category: 'environment',
  status: 'active',
  lastUpdated: '2024-12-16',
  icon: '🔧'
}
```

3. **Documentar en este archivo**
4. **Agregar tests si es necesario**

### Deprecar Herramienta

1. **Cambiar status a 'deprecated'**
2. **Agregar aviso en la herramienta**
3. **Planificar eliminación**

## 🧪 Testing

### Tests Recomendados

- Verificar que todas las herramientas cargan
- Validar autenticación del panel admin
- Comprobar APIs de diagnóstico
- Verificar información mostrada

### Comandos de Test

```bash
# Test de build (incluye todas las páginas)
npm run build

# Test de tipos
npm run type-check

# Test de linting
npm run lint
```

## 📝 Logs y Monitoreo

### Información Registrada

- Accesos al panel de admin
- Uso de herramientas de diagnóstico
- Errores en APIs de debug
- Cambios de configuración

### Ubicación de Logs

- Console del navegador (desarrollo)
- Vercel Function Logs (producción)
- Logs de aplicación (futuro)

## 🔄 Roadmap

### Próximas Herramientas

- [ ] Monitor de performance
- [ ] Logs del sistema en tiempo real
- [ ] Herramientas de base de datos
- [ ] Monitor de webhooks
- [ ] Dashboard de métricas

### Mejoras Planificadas

- [ ] Autenticación con Clerk para admin
- [ ] Persistencia de configuraciones
- [ ] Notificaciones de alertas
- [ ] Exportación de reportes

## 📞 Soporte

Para problemas con las herramientas de diagnóstico:

1. Verificar documentación
2. Revisar logs de console
3. Usar herramientas de debug disponibles
4. Contactar al equipo de desarrollo

---

**Última actualización:** 16 de Diciembre, 2024
**Versión:** 1.0.0
**Mantenido por:** Equipo de Desarrollo Pinteya
