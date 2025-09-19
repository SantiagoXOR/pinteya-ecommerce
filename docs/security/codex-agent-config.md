# Configuración de Seguridad para Codex Agent - Pinteya E-commerce

## 🔒 Configuración de Acceso a Internet

### Configuración Recomendada

**Modo**: `On` con lista de dominios permitidos
**Métodos HTTP**: Solo `GET`, `HEAD`, `OPTIONS`

### Lista de Dominios Permitidos

#### Dominios Esenciales para Desarrollo
```text
# Repositorio y Control de Versiones
github.com
githubusercontent.com
gitlab.com

# Gestión de Dependencias Node.js
npmjs.com
npmjs.org
nodejs.org
yarnpkg.com

# Servicios de la Aplicación
supabase.co
clerk.com
clerk.dev
mercadopago.com
mercadopago.com.ar

# Documentación y Referencias
developer.mozilla.org
nextjs.org
reactjs.org
tailwindcss.com
typescript-lang.org

# Herramientas de Testing
jestjs.io
playwright.dev
testing-library.com

# CDN y Assets
vercel.app
vercel.com
```

#### Dominios Adicionales (Opcional)
```text
# Stack Overflow para consultas técnicas
stackoverflow.com
stackexchange.com

# Documentación adicional
docs.github.com
docs.npmjs.com
docs.supabase.io
```

### Configuración de Seguridad

#### Métodos HTTP Restringidos
- ✅ **Permitidos**: `GET`, `HEAD`, `OPTIONS`
- ❌ **Bloqueados**: `POST`, `PUT`, `PATCH`, `DELETE`

#### Justificación
- **GET/HEAD/OPTIONS**: Necesarios para consultar documentación y APIs públicas
- **POST/PUT/PATCH/DELETE**: Bloqueados para prevenir modificaciones no autorizadas

## 🛡️ Medidas de Seguridad Implementadas

### 1. Protección de Credenciales
- Variables sensibles solo en archivos `.env.local`
- Documentación sin credenciales reales
- Validación de variables de entorno en tiempo de ejecución

### 2. Validación de Entrada
- Schemas Zod para todas las APIs
- Sanitización de entrada para prevenir XSS
- Validación de parámetros de URL

### 3. Autenticación y Autorización
- JWT con Clerk para autenticación
- RLS en Supabase para autorización a nivel de base de datos
- Middleware para protección de rutas

### 4. Seguridad de APIs
- Rate limiting implementado (pendiente)
- Validación de webhooks con firmas
- Headers de seguridad configurados (pendiente)

## ⚠️ Riesgos Identificados y Mitigaciones

### Riesgo: Prompt Injection
**Descripción**: Contenido malicioso en páginas web que podría manipular al agente
**Mitigación**: 
- Lista de dominios restringida
- Solo métodos GET permitidos
- Revisión manual de outputs del agente

### Riesgo: Exposición de Datos
**Descripción**: Posible filtración de información sensible
**Mitigación**:
- Variables de entorno protegidas
- Logs sin información sensible
- Validación de todas las salidas

### Riesgo: Modificaciones No Autorizadas
**Descripción**: Cambios accidentales en configuraciones críticas
**Mitigación**:
- Métodos POST/PUT/DELETE bloqueados
- Revisión de todos los cambios antes de aplicar
- Backup de configuraciones críticas

## 📋 Checklist de Seguridad

### Antes de Habilitar Codex Agent
- [ ] Verificar que todas las credenciales estén en `.env.local`
- [ ] Confirmar que `.env.local` está en `.gitignore`
- [ ] Revisar que no hay credenciales en archivos de documentación
- [ ] Validar configuración de dominios permitidos
- [ ] Confirmar restricción de métodos HTTP

### Durante el Uso
- [ ] Revisar todos los outputs del agente
- [ ] Verificar que no se expongan credenciales en logs
- [ ] Monitorear accesos a APIs externas
- [ ] Validar cambios antes de aplicar

### Después del Uso
- [ ] Revisar logs de acceso
- [ ] Verificar integridad de configuraciones
- [ ] Confirmar que no se modificaron credenciales
- [ ] Documentar cambios realizados

## 🔧 Configuración Técnica

### Variables de Entorno Críticas
```bash
# NUNCA exponer estas variables
SUPABASE_SERVICE_ROLE_KEY=***
CLERK_SECRET_KEY=***
MERCADOPAGO_ACCESS_TOKEN=***
MERCADOPAGO_WEBHOOK_SECRET=***
```

### Archivos Sensibles a Proteger
- `.env.local`
- `.env`
- `supabase-schema.sql` (credenciales de conexión)
- Cualquier archivo con tokens o claves

### Endpoints Críticos
- `/api/payments/*` - Manejo de pagos
- `/api/user/*` - Datos de usuario
- `/api/orders/*` - Información de pedidos
- Webhooks de servicios externos

## 📞 Contacto de Emergencia

En caso de detectar una brecha de seguridad:
1. **Inmediatamente**: Revocar todas las credenciales expuestas
2. **Contactar**: Administrador del proyecto
3. **Documentar**: Incidente y pasos de mitigación
4. **Revisar**: Logs y accesos recientes



