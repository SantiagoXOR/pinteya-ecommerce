# Documentación de Seguridad - Pinteya E-commerce

## 🛡️ Resumen de Seguridad

Este documento describe las medidas de seguridad implementadas en el proyecto Pinteya E-commerce para garantizar un entorno seguro para el desarrollo con Codex Agent.

## 🔒 Medidas de Seguridad Implementadas

### 1. Protección de Credenciales

#### Variables de Entorno Seguras
- ✅ Todas las credenciales en archivos `.env.local`
- ✅ Archivos sensibles incluidos en `.gitignore`
- ✅ Validación de variables de entorno en tiempo de ejecución
- ✅ Documentación sin credenciales reales

#### Archivos Protegidos
```
.env.local          # Variables de producción
.env                # Variables de desarrollo
.env.production     # Variables específicas de producción
.env.development    # Variables específicas de desarrollo
```

### 2. Seguridad de APIs

#### Rate Limiting
- ✅ Implementado para todas las rutas `/api/`
- ✅ Límites específicos por endpoint:
  - `/api/payments`: 10 requests/minuto
  - `/api/user`: 30 requests/minuto
  - `/api/orders`: 20 requests/minuto
  - `/api/products`: 100 requests/minuto

#### Validación de Entrada
- ✅ Schemas Zod para todas las APIs
- ✅ Sanitización de entrada para prevenir XSS
- ✅ Validación de parámetros de URL
- ✅ Validación de Content-Type

#### Headers de Seguridad
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ HSTS en producción

### 3. Autenticación y Autorización

#### Clerk Authentication
- ✅ JWT tokens seguros
- ✅ Middleware de autenticación
- ✅ Rutas protegidas configuradas
- ✅ Manejo de sesiones seguro

#### Supabase RLS
- ✅ Row Level Security habilitado
- ✅ Políticas de acceso por usuario
- ✅ Separación de clientes público/admin
- ✅ Validación de permisos en base de datos

### 4. Seguridad de Pagos

#### MercadoPago
- ✅ Validación robusta de webhooks
- ✅ Verificación de firmas HMAC
- ✅ Validación de timestamp
- ✅ Protección contra timing attacks
- ✅ Validación de origen de requests

### 5. Monitoreo y Logging

#### Eventos de Seguridad
- ✅ Logging de rate limiting
- ✅ Logging de requests inválidos
- ✅ Logging de actividad sospechosa
- ✅ Timestamps y metadata completos

## 🔧 Configuración para Codex Agent

### Dominios Permitidos
```
# Esenciales
github.com
githubusercontent.com
npmjs.com
nodejs.org
supabase.co
clerk.com
mercadopago.com

# Documentación
developer.mozilla.org
nextjs.org
reactjs.org
tailwindcss.com
```

### Métodos HTTP Permitidos
- ✅ GET, HEAD, OPTIONS
- ❌ POST, PUT, PATCH, DELETE

### Configuración de Seguridad
```json
{
  "internet_access": "on",
  "domain_allowlist": "common_dependencies + custom",
  "http_methods": ["GET", "HEAD", "OPTIONS"],
  "security_level": "high"
}
```

## 🚨 Procedimientos de Emergencia

### En Caso de Brecha de Seguridad

1. **Inmediato** (0-5 minutos):
   - Revocar todas las credenciales expuestas
   - Cambiar passwords de servicios afectados
   - Documentar el incidente

2. **Corto Plazo** (5-30 minutos):
   - Revisar logs de acceso
   - Identificar alcance del compromiso
   - Notificar a stakeholders

3. **Mediano Plazo** (30 minutos - 2 horas):
   - Implementar medidas correctivas
   - Actualizar configuraciones de seguridad
   - Realizar auditoría completa

### Contactos de Emergencia
- **Administrador del Proyecto**: [Configurar]
- **Supabase Support**: support@supabase.io
- **Clerk Support**: support@clerk.com
- **MercadoPago Support**: [Configurar]

## 📋 Checklist de Verificación

### Antes de Usar Codex Agent
- [ ] Ejecutar `npm run security:check`
- [ ] Verificar que no hay credenciales en código
- [ ] Confirmar configuración de dominios
- [ ] Validar headers de seguridad
- [ ] Revisar logs recientes

### Durante el Uso
- [ ] Monitorear actividad de red
- [ ] Revisar outputs del agente
- [ ] Verificar que no se expongan secretos
- [ ] Validar cambios antes de aplicar

### Después del Uso
- [ ] Revisar logs de seguridad
- [ ] Verificar integridad de configuraciones
- [ ] Documentar cambios realizados
- [ ] Ejecutar auditoría de seguridad

## 🔍 Herramientas de Verificación

### Scripts Disponibles
```bash
# Verificación completa de seguridad
npm run security:check

# Auditoría de dependencias
npm run security:audit

# Verificación de variables de entorno
npm run check:env

# Tests de seguridad
npm run test:security
```

### Archivos de Configuración
- `docs/security/codex-agent-config.md` - Configuración específica para Codex
- `src/middleware/security.ts` - Middleware de seguridad
- `scripts/security-check.js` - Script de verificación
- `.gitignore` - Archivos protegidos

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk Security](https://clerk.com/docs/security)
- [MercadoPago Security](https://www.mercadopago.com.ar/developers/es/guides/notifications/webhooks)

## 📝 Historial de Cambios

### v1.0.0 - Implementación Inicial
- Configuración básica de seguridad
- Protección de credenciales
- Headers de seguridad básicos

### v2.0.0 - Mejoras para Codex Agent
- Rate limiting implementado
- Middleware de seguridad avanzado
- Validación robusta de webhooks
- Sistema de monitoreo mejorado
- Documentación completa de seguridad



