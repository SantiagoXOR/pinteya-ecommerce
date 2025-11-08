# 📁 Scripts - Pinteya E-commerce

**Última actualización**: 8 de Noviembre, 2025  
**Estado**: ✅ Limpieza completada

---

## 📂 Estructura de Carpetas

```
/scripts/
├── /database/          # Scripts de base de datos
├── /debug/             # Scripts de debugging
├── /deployment/        # Scripts de deployment
├── /development/       # Scripts de desarrollo (21 scripts)
├── /monitoring/        # Scripts de monitoreo
├── /optimization/      # Scripts de optimización
├── /performance/       # Scripts de análisis de performance
├── /security/          # Scripts de seguridad
├── /setup/             # Scripts de configuración inicial
├── /testing/           # Scripts de testing (48 scripts)
├── /utilities/         # Utilidades generales (29 scripts)
└── /validation/        # Scripts de validación (24 scripts)
```

---

## 🔧 Scripts de Uso Común

### Performance y Optimización
```bash
# Analizar bundle
npm run analyze-bundle-optimization

# Análisis detallado con reporte
npm run bundle-optimization:analyze

# Optimizar imágenes
npm run optimize:images
```

### Seguridad
```bash
# Auditoría completa de seguridad
npm run security:audit

# Actualizar configuración CORS
npm run security:cors-update

# Analizar logs de autenticación
npm run security:auth-logs
```

### Testing
```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:coverage

# Tests E2E de admin
npm run test:admin:products
```

---

## 📚 Scripts por Categoría

### `/database/` - Base de Datos
**Propósito**: Scripts para migraciones y seed de datos

- `seed-test-data.js` - Crear datos de prueba
- `validate-auth-migration.js` - Validar migración de auth

### `/development/` - Desarrollo (21 scripts)
**Propósito**: Herramientas para desarrollo activo

**Scripts Útiles**:
- `setup-analytics.js` - Configurar analytics
- `setup-storage.js` - Configurar Supabase Storage
- `setup-email.js` - Configurar email
- `setup-chromatic.js` - Configurar testing visual
- `verify-admin-apis.js` - Verificar APIs de admin
- `debug-mercadopago.js` - Debug de MercadoPago
- `generate-test-report.js` - Generar reportes de test
- `generate-optimization-report.js` - Reportes de optimización

**Scripts de Setup**:
- `setup-accessibility-testing.js` - A11y testing
- `setup-analytics-cron.js` - Cron de analytics
- `setup-vercel-env.js` - Variables de Vercel
- `setup-mcp-limits.js` - Límites MCP

### `/monitoring/` - Monitoreo
**Propósito**: Scripts de monitoreo y health checks

- `check-admin-status.js` - Verificar estado admin
- `check-products.js` - Verificar productos
- `setup-monitoring.js` - Configurar monitoreo
- `apply-monitoring-migration.js` - Aplicar migración de monitoreo

### `/performance/` - Performance (9 scripts)
**Propósito**: Análisis y optimización de performance

- `analyze-bundle-optimization.js` - Analizar optimizaciones de bundle
- `analyze-real-bundle.js` - Análisis detallado del bundle
- `ci-performance-check.js` - Performance check para CI/CD

### `/security/` - Seguridad (5 scripts)
**Propósito**: Auditoría y mejoras de seguridad

- `security-audit-enhanced.js` - Auditoría completa
- `security-check.js` - Verificación de seguridad
- Otros scripts de seguridad enterprise

### `/testing/` - Testing (48 scripts)
**Propósito**: Scripts para testing automatizado

**Categorías**:
- Tests de admin
- Tests de webhooks
- Tests de middleware
- Tests de integración
- Tests E2E

### `/utilities/` - Utilidades (29 scripts)
**Propósito**: Utilidades generales del proyecto

- Verificación de configuración
- Helpers de deployment
- Scripts de mantenimiento

### `/validation/` - Validación (20 scripts restantes)
**Propósito**: Scripts de validación de features

**Scripts Principales**:
- `check-env.js` - Verificar variables de entorno
- `check-db-schema.js` - Verificar esquema DB
- `check-oauth-config.js` - Verificar OAuth
- `validate-webhooks-robust.js` - Validar webhooks
- `validate-security-audit-enhanced.js` - Validar seguridad
- `validate-logistics-implementation.js` - Validar logística
- `final-verification.js` - Verificación final

---

## 🧹 Limpieza Reciente (2025-11-08)

### Scripts Eliminados
**Clerk** (14 scripts):
- debug-clerk-auth.js
- fix-clerk-config.js
- test-webhook-clerk.js
- migrate-clerk-to-nextauth.js
- Y 10 más relacionados con Clerk

**Migraciones completadas** (4 scripts):
- migrate-auth-tests-phase2.js
- migrate-massive-phase3.js
- migrate-global-phase5.js
- switch-middleware.js

**Debug one-time** (5 scripts):
- validate-phase2-integration.js
- validate-regression-testing.js
- validate-user-sync.js
- validate-session-management.js
- simple-seed.js
- Y varios scripts de development/debug-*

**Total eliminado**: ~23 scripts obsoletos

---

## 📝 Guía de Uso

### Cómo Ejecutar un Script

```bash
# Directamente con Node
node scripts/<categoria>/<nombre-script>.js

# O si tiene comando npm asociado
npm run <comando>
```

### Agregar Nuevo Script

1. Crear en la carpeta apropiada según categoría
2. Seguir convención de nombres: `verbo-sustantivo.js`
3. Agregar comentarios al inicio explicando propósito
4. Si es de uso común, agregar comando npm en `package.json`
5. Documentar aquí en este README

### Mantenimiento

**Eliminar scripts obsoletos**:
- Scripts de migración ya aplicada
- Scripts de debug one-time resueltos
- Scripts de features removidas

**Consolidar funcionalidad**:
- Si múltiples scripts hacen lo mismo, consolidar
- Mover lógica reutilizable a `/lib`

---

## ⚠️ Scripts Deprecados

Los siguientes scripts ya NO existen (eliminados en limpieza 2025-11-08):
- ❌ Todos los scripts relacionados con Clerk
- ❌ Scripts de migración de Clerk a NextAuth
- ❌ Scripts de debug de Clerk
- ❌ Scripts de validación de fases antiguas

Ver: `/docs/archive/completed-migrations/` para documentación histórica

---

## 🔗 Referencias

- **Documentación del Proyecto**: `/docs/README.md`
- **Log de Limpieza**: `/CLEANUP_LOG_2025-11-08.md`
- **Archivo de Docs**: `/docs/archive/`

---

**Nota**: Este README se actualiza después de cada limpieza o reorganización significativa de scripts.
