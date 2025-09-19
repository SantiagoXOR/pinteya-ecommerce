#!/usr/bin/env node

/**
 * ===== CONFIGURADOR AUTOMÁTICO DE LÍMITES MCP =====
 * Script para configurar límites de procesos MCP en Claude Desktop
 * Autor: Sistema de Optimización Pinteya E-commerce
 * Fecha: Enero 2025
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuración
const CONFIG = {
  maxInstancesPerServer: 1,
  maxTotalInstances: 5,
  maxMemoryMB: 100,
  maxCpuPercent: 10,
  checkInterval: 30000,
  cleanupEnabled: true
};

// Rutas de configuración de Claude Desktop
const CLAUDE_CONFIG_PATHS = {
  windows: path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
  darwin: path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json'),
  linux: path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json')
};

/**
 * Función para logging con colores
 */
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  const timestamp = new Date().toISOString();
  console.log(`${colors[type]}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
}

/**
 * Obtener ruta de configuración de Claude Desktop
 */
function getClaudeConfigPath() {
  const platform = os.platform();
  return CLAUDE_CONFIG_PATHS[platform] || CLAUDE_CONFIG_PATHS.linux;
}

/**
 * Leer configuración actual de Claude Desktop
 */
function readClaudeConfig() {
  const configPath = getClaudeConfigPath();
  
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    log(`Error leyendo configuración de Claude: ${error.message}`, 'warn');
  }
  
  return { mcpServers: {} };
}

/**
 * Escribir configuración de Claude Desktop
 */
function writeClaudeConfig(config) {
  const configPath = getClaudeConfigPath();
  const configDir = path.dirname(configPath);
  
  try {
    // Crear directorio si no existe
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      log(`Creado directorio de configuración: ${configDir}`, 'info');
    }
    
    // Escribir configuración
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    log(`Configuración guardada en: ${configPath}`, 'success');
    
    return true;
  } catch (error) {
    log(`Error escribiendo configuración: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Configurar límites MCP en Claude Desktop
 */
function setupMCPLimits() {
  log('Configurando límites MCP para Claude Desktop...', 'info');
  
  const config = readClaudeConfig();
  
  // Configurar servidores MCP con límites
  const mcpServers = {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
      env: {
        MCP_MAX_INSTANCES: CONFIG.maxInstancesPerServer.toString(),
        MCP_MAX_MEMORY_MB: CONFIG.maxMemoryMB.toString()
      }
    },
    "sequential-thinking": {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      env: {
        MCP_MAX_INSTANCES: CONFIG.maxInstancesPerServer.toString(),
        MCP_MAX_MEMORY_MB: CONFIG.maxMemoryMB.toString()
      }
    },
    context7: {
      command: "npx",
      args: ["-y", "@upstash/context7-mcp@latest"],
      env: {
        MCP_MAX_INSTANCES: CONFIG.maxInstancesPerServer.toString(),
        MCP_MAX_MEMORY_MB: CONFIG.maxMemoryMB.toString()
      }
    },
    playwright: {
      command: "npx",
      args: ["-y", "@playwright/mcp@latest"],
      env: {
        MCP_MAX_INSTANCES: CONFIG.maxInstancesPerServer.toString(),
        MCP_MAX_MEMORY_MB: CONFIG.maxMemoryMB.toString()
      }
    },
    supabase: {
      command: "npx",
      args: ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", process.env.SUPABASE_ACCESS_TOKEN || ""],
      env: {
        MCP_MAX_INSTANCES: CONFIG.maxInstancesPerServer.toString(),
        MCP_MAX_MEMORY_MB: CONFIG.maxMemoryMB.toString()
      }
    }
  };
  
  // Actualizar configuración
  config.mcpServers = mcpServers;
  
  // Agregar configuración global de límites
  config.globalSettings = {
    maxTotalInstances: CONFIG.maxTotalInstances,
    processMonitoring: {
      enabled: true,
      checkInterval: CONFIG.checkInterval,
      maxMemoryMB: CONFIG.maxMemoryMB,
      maxCpuPercent: CONFIG.maxCpuPercent
    },
    cleanup: {
      enabled: CONFIG.cleanupEnabled,
      orphanedProcessTimeout: 300000,
      duplicateProcessAction: "terminate-oldest"
    }
  };
  
  // Guardar configuración
  if (writeClaudeConfig(config)) {
    log('Límites MCP configurados exitosamente', 'success');
    log(`Máximo de instancias por servidor: ${CONFIG.maxInstancesPerServer}`, 'info');
    log(`Máximo total de instancias: ${CONFIG.maxTotalInstances}`, 'info');
    log(`Límite de memoria por proceso: ${CONFIG.maxMemoryMB}MB`, 'info');
    return true;
  }
  
  return false;
}

/**
 * Crear archivo de configuración del proyecto
 */
function createProjectConfig() {
  const projectConfigPath = path.join(process.cwd(), '.mcp-config.json');
  
  const projectConfig = {
    mcpServers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
        maxInstances: CONFIG.maxInstancesPerServer,
        restartPolicy: "on-failure",
        timeout: 30000
      },
      "sequential-thinking": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
        maxInstances: CONFIG.maxInstancesPerServer,
        restartPolicy: "on-failure",
        timeout: 30000
      },
      context7: {
        command: "npx",
        args: ["-y", "@upstash/context7-mcp@latest"],
        maxInstances: CONFIG.maxInstancesPerServer,
        restartPolicy: "on-failure",
        timeout: 30000
      },
      playwright: {
        command: "npx",
        args: ["-y", "@playwright/mcp@latest"],
        maxInstances: CONFIG.maxInstancesPerServer,
        restartPolicy: "on-failure",
        timeout: 30000
      },
      supabase: {
        command: "npx",
        args: ["-y", "@supabase/mcp-server-supabase@latest"],
        maxInstances: CONFIG.maxInstancesPerServer,
        restartPolicy: "on-failure",
        timeout: 30000
      }
    },
    globalSettings: {
      maxTotalInstances: CONFIG.maxTotalInstances,
      processMonitoring: {
        enabled: true,
        checkInterval: CONFIG.checkInterval,
        maxMemoryMB: CONFIG.maxMemoryMB,
        maxCpuPercent: CONFIG.maxCpuPercent
      },
      cleanup: {
        enabled: CONFIG.cleanupEnabled,
        orphanedProcessTimeout: 300000,
        duplicateProcessAction: "terminate-oldest"
      },
      logging: {
        enabled: true,
        level: "info",
        file: ".mcp-logs.json"
      }
    },
    resourceLimits: {
      memory: {
        perProcess: `${CONFIG.maxMemoryMB}MB`,
        total: `${CONFIG.maxTotalInstances * CONFIG.maxMemoryMB}MB`
      },
      cpu: {
        perProcess: `${CONFIG.maxCpuPercent}%`,
        total: `${CONFIG.maxTotalInstances * CONFIG.maxCpuPercent}%`
      }
    }
  };
  
  try {
    fs.writeFileSync(projectConfigPath, JSON.stringify(projectConfig, null, 2));
    log(`Configuración del proyecto creada: ${projectConfigPath}`, 'success');
    return true;
  } catch (error) {
    log(`Error creando configuración del proyecto: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Función principal
 */
function main() {
  log('=== CONFIGURADOR DE LÍMITES MCP ===', 'info');
  log('Iniciando configuración de límites para procesos MCP...', 'info');
  
  // Crear configuración del proyecto
  if (!createProjectConfig()) {
    log('Error creando configuración del proyecto', 'error');
    process.exit(1);
  }
  
  // Configurar Claude Desktop
  if (!setupMCPLimits()) {
    log('Error configurando Claude Desktop', 'error');
    process.exit(1);
  }
  
  log('=== CONFIGURACIÓN COMPLETADA ===', 'success');
  log('Reinicia Claude Desktop para aplicar los cambios', 'info');
  log('Usa "npm run mcp:status" para monitorear procesos', 'info');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  setupMCPLimits,
  createProjectConfig,
  CONFIG
};
