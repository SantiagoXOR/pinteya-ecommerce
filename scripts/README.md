# 📁 Scripts Directory - Pinteya E-commerce

## 🎯 Descripción General

Este directorio contiene todos los scripts de automatización, testing, desarrollo y mantenimiento del proyecto Pinteya e-commerce. Los scripts están organizados en carpetas temáticas para facilitar la navegación y el mantenimiento.

## 🗂️ Estructura Organizada

### 📊 database/

Scripts relacionados con la base de datos y migraciones.

```
database/
├── seed-test-data.js          # Poblar BD con datos de prueba
└── migrations/                # Scripts de migración de BD
```

**Comandos disponibles:**

- `npm run seed:test` - Ejecutar seed de datos de prueba

### 🛠️ development/

Scripts para desarrollo, configuración y herramientas de desarrollo.

```
development/
├── assign-admin-role.js       # Asignar rol de administrador
├── check-admin-status.js      # Verificar estado de admin
├── create-demo-screenshots.js # Crear capturas demo
├── debug-clerk-metadata.js    # Debug metadata Clerk
├── debug-mercadopago.js       # Debug integración MercadoPago
├── force-clerk-sync.js        # Forzar sincronización Clerk
├── generate-checkout-screenshots.js # Capturas checkout
├── mcp-status.js              # Estado MCP
├── monitoring-setup.js        # Configurar monitoreo
├── setup-email.js             # Configurar email
├── setup-mcp-limits.js        # Configurar límites MCP
├── setup-monitoring.js        # Setup monitoreo
├── setup-storage.js           # Configurar almacenamiento
├── sync-admin-clerk.js        # Sincronizar admin Clerk
├── update-clerk-metadata.js   # Actualizar metadata Clerk
└── vscode-optimize.js         # Optimizar VSCode
```

**Comandos disponibles:**

- `npm run assign-admin-role` - Asignar rol admin
- `npm run sync-admin-role` - Sincronizar rol admin
- `npm run check-admin-status` - Verificar estado admin
- `npm run screenshots:checkout` - Generar capturas checkout
- `npm run screenshots:demo` - Crear capturas demo
- `npm run debug:mercadopago` - Debug MercadoPago
- `npm run images:setup` - Configurar storage
- `npm run images:email` - Configurar email
- `npm run mcp:setup` - Configurar MCP
- `npm run mcp:status` - Estado MCP
- `npm run monitoring:setup` - Setup monitoreo
- `npm run monitoring:check` - Verificar monitoreo
- `npm run monitoring:force` - Forzar monitoreo
- `npm run vscode:optimize` - Optimizar VSCode

### 🚀 deployment/

Scripts relacionados con despliegue y producción.

```
deployment/
└── force-redeploy.js          # Forzar redespliegue
```

**Comandos disponibles:**

- `npm run force-redeploy` - Forzar redespliegue

### 📊 monitoring/

Scripts de monitoreo y supervisión del sistema.

```
monitoring/
└── check-admin-status.js      # Verificar estado admin
```

### ⚡ performance/

Scripts de optimización y análisis de rendimiento.

```
performance/
├── analyze-bundle.js          # Analizar bundle
├── analyze-bundle-optimization.js # Optimización bundle
├── ci-performance-check.js    # Verificación CI performance
├── lighthouse-performance.js  # Análisis Lighthouse
├── optimize-imports.js        # Optimizar imports
├── performance-monitor.js     # Monitor de performance
├── remove-console-logs.js     # Remover console.log
└── run-quality-tests.js       # Tests de calidad
```

**Comandos disponibles:**

- `npm run performance:lighthouse` - Análisis Lighthouse
- `npm run performance:quality` - Tests de calidad
- `npm run performance:bundle` - Analizar bundle
- `npm run performance:bundle-optimize` - Optimizar bundle
- `npm run performance:ci` - Verificación CI
- `npm run performance:optimize-imports` - Optimizar imports
- `npm run performance:remove-logs` - Remover logs
- `npm run performance:monitor` - Monitor performance
- `npm run test:performance` - Tests performance
- `npm run test:quality` - Tests calidad
- `npm run analyze-bundle` - Analizar bundle
- `npm run analyze-bundle-optimization` - Optimización bundle
- `npm run bundle-optimization:analyze` - Analizar optimización
- `npm run bundle-optimization:report` - Reporte optimización
- `npm run bundle-optimization:check` - Verificar optimización
- `npm run ci:performance-check` - Verificación CI
- `npm run ci:performance-check:verbose` - Verificación CI verbose
- `npm run ci:performance-check:no-fail` - Verificación CI sin fallos
- `npm run optimize-imports` - Optimizar imports
- `npm run remove-console` - Remover console
- `npm run performance-monitor` - Monitor performance

### 🔒 security/

Scripts de seguridad y auditoría.

```
security/
├── security-check.js          # Verificación de seguridad
└── security-monitor.js        # Monitor de seguridad
```

**Comandos disponibles:**

- `npm run security:monitor` - Monitor seguridad
- `npm run security:check` - Verificación seguridad

### 🧪 testing/

Scripts de testing y pruebas automatizadas.

```
testing/
├── manual-test-mercadopago.js # Test manual MercadoPago
├── run-auth-tests.js          # Tests de autenticación
├── test-animations.js         # Tests de animaciones
├── test-enterprise.js         # Tests enterprise
├── test-fase3.js              # Tests fase 3
├── test-orders-enterprise.js  # Tests órdenes enterprise
├── test-payment-flow.js       # Tests flujo de pago
├── test-react-direct.js       # Tests React directos
├── test-react-events.js       # Tests eventos React
└── test-user-interaction.js   # Tests interacción usuario
```

**Comandos disponibles:**

- `npm run test:payment-flow` - Tests flujo pago
- `npm run test:manual-mp` - Test manual MercadoPago
- `npm run test:react-events` - Tests eventos React
- `npm run test:user-interaction` - Tests interacción
- `npm run test:react-direct` - Tests React directos
- `npm run test:auth` - Tests autenticación
- `npm run test:enterprise` - Tests enterprise
- `npm run test:enterprise:unit` - Tests enterprise unitarios
- `npm run test:fase3` - Tests fase 3
- `npm run test:fase3:unit` - Tests fase 3 unitarios
- `npm run test:fase3:components` - Tests componentes fase 3
- `npm run test:fase3:api` - Tests API fase 3
- `npm run test:fase3:integration` - Tests integración fase 3
- `npm run test:fase3:e2e` - Tests E2E fase 3
- `npm run test:fase3:coverage` - Coverage fase 3
- `npm run test:fase3:lint` - Lint fase 3
- `npm run test:monitoring` - Tests monitoreo
- `npm run test:orders:enterprise` - Tests órdenes enterprise
- `npm run test:animations` - Tests animaciones
- `npm run test:animations:unit` - Tests animaciones unitarios
- `npm run test:animations:integration` - Tests animaciones integración
- `npm run test:animations:e2e` - Tests animaciones E2E
- `npm run test:animations:performance` - Tests performance animaciones
- `npm run test:animations:accessibility` - Tests accesibilidad animaciones
- `npm run test:animations:coverage` - Coverage animaciones

### 🔧 utilities/

Scripts de utilidades generales y herramientas auxiliares.

```
utilities/
├── capture-real-screenshots.js # Capturar capturas reales
├── clean-cache.js             # Limpiar caché
├── download-product-images.js # Descargar imágenes productos
├── fix-server-action-error.js # Corregir errores server action
├── optimize-images.js         # Optimizar imágenes
└── upload-edited-images.js    # Subir imágenes editadas
```

**Comandos disponibles:**

- `npm run screenshots:real` - Capturas reales
- `npm run screenshots:real-extended` - Capturas reales extendidas
- `npm run clean:cache` - Limpiar caché
- `npm run images:download` - Descargar imágenes
- `npm run images:optimize` - Optimizar imágenes
- `npm run images:upload` - Subir imágenes
- `npm run fix-server-action` - Corregir server action

### ✅ validation/

Scripts de validación y verificación del sistema.

```
validation/
├── check-db-schema.js         # Verificar esquema BD
├── check-env.js               # Verificar variables entorno
├── run-admin-tests.js         # Ejecutar tests admin
├── run-enterprise-tests.js    # Ejecutar tests enterprise
└── verify-admin-simple.js     # Verificar admin simple
```

**Comandos disponibles:**

- `npm run check-env` - Verificar variables entorno
- `npm run check:db-schema` - Verificar esquema BD
- `npm run test:admin` - Tests admin
- `npm run test:enterprise:panel` - Panel enterprise
- `npm run test:enterprise:report` - Reporte enterprise
- `npm run test:enterprise:health` - Health enterprise
- `npm run verify:admin` - Verificar admin

## 🚀 Uso Rápido

### Comandos Más Utilizados

```bash
# Testing
npm test                    # Tests completos
npm run test:enterprise     # Tests enterprise
npm run test:admin         # Tests admin

# Performance
npm run performance:monitor # Monitor performance
npm run analyze-bundle     # Analizar bundle

# Desarrollo
npm run check-env          # Verificar entorno
npm run clean:cache        # Limpiar caché

# Seguridad
npm run security:check     # Verificar seguridad
```

### Ejecución Directa

También puedes ejecutar scripts directamente:

```bash
# Ejemplo: ejecutar script de testing
node scripts/testing/test-enterprise.js

# Ejemplo: verificar entorno
node scripts/validation/check-env.js

# Ejemplo: limpiar caché
node scripts/utilities/clean-cache.js
```

## 📋 Convenciones

### Nomenclatura

- **Verbos de acción**: `check-`, `test-`, `run-`, `setup-`, `verify-`
- **Sustantivos descriptivos**: `-admin`, `-enterprise`, `-performance`
- **Separación con guiones**: `kebab-case`

### Estructura de Archivos

- **Comentarios de cabecera**: Descripción del propósito
- **Configuración**: Variables de entorno y configuración
- **Funciones principales**: Lógica del script
- **Manejo de errores**: Try-catch y logging
- **Salida limpia**: Process.exit con códigos apropiados

### Logging

- **Colores**: Usar chalk para output colorido
- **Niveles**: INFO, WARN, ERROR, SUCCESS
- **Timestamps**: Incluir marcas de tiempo
- **Contexto**: Información relevante del proceso

## 🔧 Desarrollo

### Agregar Nuevo Script

1. **Ubicación**: Colocar en la carpeta temática apropiada
2. **Nomenclatura**: Seguir convenciones establecidas
3. **package.json**: Agregar comando NPM si es necesario
4. **Documentación**: Actualizar este README
5. **Testing**: Incluir tests si es aplicable

### Ejemplo de Script Básico

```javascript
#!/usr/bin/env node

/**
 * Script de ejemplo para Pinteya E-commerce
 * Descripción: [Propósito del script]
 * Autor: [Nombre]
 * Fecha: [Fecha]
 */

const chalk = require('chalk')

async function main() {
  try {
    console.log(chalk.blue('🚀 Iniciando script...'))

    // Lógica principal aquí

    console.log(chalk.green('✅ Script completado exitosamente'))
    process.exit(0)
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message)
    process.exit(1)
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { main }
```

## 📊 Estadísticas

- **Total de scripts**: 35+
- **Categorías**: 8
- **Comandos NPM**: 80+
- **Cobertura**: Testing, Performance, Seguridad, Desarrollo

## 🔗 Enlaces Relacionados

- [Documentación Principal](../docs/README.md)
- [Guía de Testing](../docs/testing/)
- [Configuración del Proyecto](../README.md)
- [Actualización de Scripts](../docs/SCRIPTS_REORGANIZATION_UPDATE_2025.md)

---

**Última actualización**: Enero 2025  
**Versión**: 2.0  
**Mantenedor**: Equipo Pinteya E-commerce
