# 🔧 Guía de Configuración MCP - Límites y Optimización

## 📋 Resumen Ejecutivo

Esta guía documenta la configuración de límites para procesos MCP (Model Context Protocol) para prevenir duplicación de procesos y optimizar el uso de recursos del sistema.

## 🎯 Objetivos

- **Prevenir duplicación** de procesos MCP
- **Limitar uso de memoria** por proceso (máximo 100MB)
- **Controlar instancias** máximas por servidor (1 instancia)
- **Monitoreo automático** de recursos
- **Limpieza automática** de procesos huérfanos

## 📁 Archivos de Configuración

### 1. `.mcp-config.json` - Configuración del Proyecto
```json
{
  "mcpServers": {
    "filesystem": { "maxInstances": 1, "timeout": 30000 },
    "sequential-thinking": { "maxInstances": 1, "timeout": 30000 },
    "context7": { "maxInstances": 1, "timeout": 30000 },
    "playwright": { "maxInstances": 1, "timeout": 30000 },
    "supabase": { "maxInstances": 1, "timeout": 30000 }
  },
  "globalSettings": {
    "maxTotalInstances": 5,
    "processMonitoring": { "enabled": true, "maxMemoryMB": 100 }
  }
}
```

### 2. `scripts/mcp-process-manager.ps1` - Gestor de Procesos
Script PowerShell para monitoreo y limpieza automática de procesos MCP.

### 3. `scripts/setup-mcp-limits.js` - Configurador Automático
Script Node.js para configurar límites en Claude Desktop automáticamente.

## 🚀 Comandos NPM Disponibles

### Configuración Inicial
```bash
# Configurar límites MCP por primera vez
npm run mcp:setup
```

### Monitoreo y Gestión
```bash
# Ver estado actual de procesos MCP
npm run mcp:status

# Limpiar procesos duplicados
npm run mcp:cleanup

# Monitoreo continuo (Ctrl+C para detener)
npm run mcp:monitor

# Terminar TODOS los procesos MCP (emergencia)
npm run mcp:kill-all
```

## 📊 Límites Configurados

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **Instancias por servidor** | 1 | Máximo de procesos por tipo de servidor MCP |
| **Instancias totales** | 5 | Máximo total de procesos MCP simultáneos |
| **Memoria por proceso** | 100MB | Límite de RAM por proceso individual |
| **Memoria total** | 500MB | Límite total de RAM para todos los procesos MCP |
| **CPU por proceso** | 10% | Límite de CPU por proceso individual |
| **Intervalo de monitoreo** | 30s | Frecuencia de verificación automática |

## 🔍 Tipos de Servidores MCP Monitoreados

1. **filesystem** - Acceso al sistema de archivos
2. **sequential-thinking** - Procesamiento de pensamiento secuencial
3. **context7** - Gestión de contexto avanzado
4. **playwright** - Automatización de navegador
5. **supabase** - Integración con base de datos

## 🛠️ Configuración Manual

### Claude Desktop Configuration
Ubicación del archivo de configuración:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/.config/claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

### Ejemplo de Configuración Claude Desktop
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\ruta\\proyecto"],
      "env": {
        "MCP_MAX_INSTANCES": "1",
        "MCP_MAX_MEMORY_MB": "100"
      }
    }
  },
  "globalSettings": {
    "maxTotalInstances": 5,
    "processMonitoring": {
      "enabled": true,
      "checkInterval": 30000
    }
  }
}
```

## 📈 Monitoreo y Alertas

### Métricas Monitoreadas
- **Número de procesos** por tipo de servidor
- **Uso de memoria** por proceso y total
- **Tiempo de ejecución** de cada proceso
- **Procesos duplicados** o huérfanos

### Acciones Automáticas
- **Terminación de duplicados** (mantiene el más reciente)
- **Limpieza por memoria** (termina procesos que excedan 100MB)
- **Logging estructurado** en `.mcp-logs.json`

## 🚨 Solución de Problemas

### Problema: Múltiples Procesos Duplicados
```bash
# Solución inmediata
npm run mcp:cleanup

# Verificar estado
npm run mcp:status
```

### Problema: Alto Uso de Memoria
```bash
# Terminar procesos que excedan límites
npm run mcp:cleanup

# Monitoreo continuo
npm run mcp:monitor
```

### Problema: Procesos No Responden
```bash
# Terminar todos los procesos MCP
npm run mcp:kill-all

# Reiniciar Claude Desktop
# Verificar configuración
npm run mcp:setup
```

## 📝 Logs y Diagnóstico

### Archivo de Logs
- **Ubicación**: `.mcp-logs.json`
- **Formato**: JSON estructurado con timestamp
- **Información**: Acciones realizadas, errores, métricas

### Ejemplo de Log
```json
{
  "timestamp": "2025-01-09 15:30:45",
  "level": "INFO",
  "message": "Terminado proceso duplicado: PID 12345 (context7)"
}
```

## 🔄 Mantenimiento Recomendado

### Diario
- Ejecutar `npm run mcp:status` para verificar estado
- Revisar logs en `.mcp-logs.json`

### Semanal
- Ejecutar `npm run mcp:cleanup` para limpieza preventiva
- Verificar configuración con `npm run mcp:setup`

### Mensual
- Revisar y actualizar límites según uso real
- Actualizar servidores MCP a versiones más recientes

## 🎯 Beneficios Implementados

✅ **Reducción de 1.2GB RAM** por eliminación de duplicados
✅ **Prevención automática** de nuevos duplicados
✅ **Monitoreo en tiempo real** de recursos
✅ **Limpieza automática** de procesos huérfanos
✅ **Configuración centralizada** y documentada
✅ **Scripts NPM** para gestión fácil

## 📞 Soporte

Para problemas con la configuración MCP:
1. Verificar logs en `.mcp-logs.json`
2. Ejecutar `npm run mcp:status` para diagnóstico
3. Usar `npm run mcp:cleanup` para solución rápida
4. Reiniciar Claude Desktop si es necesario



