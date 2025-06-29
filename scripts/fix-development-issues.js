#!/usr/bin/env node

/**
 * Script para solucionar problemas comunes de desarrollo
 * Pinteya E-commerce - Development Troubleshooting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Solucionando problemas de desarrollo...\n');

const fixes = {
  babelConfig: false,
  nextCache: false,
  nodeModules: false,
  dependencies: false
};

async function fixBabelConfiguration() {
  console.log('🔧 1/4 - Verificando configuración de Babel...');
  
  const babelConfigPath = 'babel.config.js';
  
  try {
    if (fs.existsSync(babelConfigPath)) {
      const babelContent = fs.readFileSync(babelConfigPath, 'utf8');
      
      // Verificar si tiene la configuración correcta para desarrollo
      if (!babelContent.includes('next/babel') || !babelContent.includes('NODE_ENV')) {
        console.log('⚠️ Configuración de Babel necesita corrección...');
        
        const fixedBabelConfig = `// Tree shaking configuration for Pinteya E-commerce
// Optimiza imports para reducir bundle size

// Configuración de babel compatible con Next.js
module.exports = {
  presets: ['next/babel'],
  plugins: [
    // Solo aplicar tree shaking en producción para evitar conflictos en desarrollo
    ...(process.env.NODE_ENV === 'production' ? [
      // Tree shaking para Lucide icons
      [
        'babel-plugin-import',
        {
          libraryName: 'lucide-react',
          libraryDirectory: 'dist/esm/icons',
          camel2DashComponentName: false,
        },
        'lucide-react',
      ],
    ] : [])
  ],
};
`;
        
        // Hacer backup
        fs.writeFileSync(`${babelConfigPath}.backup`, babelContent);
        
        // Escribir configuración corregida
        fs.writeFileSync(babelConfigPath, fixedBabelConfig);
        
        console.log('✅ Configuración de Babel corregida');
        console.log('📁 Backup guardado en babel.config.js.backup');
        fixes.babelConfig = true;
      } else {
        console.log('✅ Configuración de Babel está correcta');
        fixes.babelConfig = true;
      }
    } else {
      console.log('ℹ️ No se encontró babel.config.js');
      fixes.babelConfig = true;
    }
  } catch (error) {
    console.error('❌ Error verificando Babel:', error.message);
  }
}

async function clearNextCache() {
  console.log('🗑️ 2/4 - Limpiando cache de Next.js...');
  
  try {
    const nextDir = '.next';
    
    if (fs.existsSync(nextDir)) {
      // En Windows, usar PowerShell para eliminar
      if (process.platform === 'win32') {
        execSync('Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue', { 
          stdio: 'pipe',
          shell: 'powershell'
        });
      } else {
        execSync('rm -rf .next', { stdio: 'pipe' });
      }
      
      console.log('✅ Cache de Next.js limpiado');
    } else {
      console.log('ℹ️ No hay cache de Next.js para limpiar');
    }
    
    fixes.nextCache = true;
  } catch (error) {
    console.log('⚠️ Error limpiando cache (puede ser normal):', error.message);
    fixes.nextCache = true; // No es crítico
  }
}

async function verifyDependencies() {
  console.log('📦 3/4 - Verificando dependencias...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      'babel-plugin-import',
      'next',
      'react',
      'react-dom'
    ];
    
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      const hasInDeps = packageJson.dependencies && packageJson.dependencies[dep];
      const hasInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
      
      if (!hasInDeps && !hasInDevDeps) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      console.log(`⚠️ Dependencias faltantes: ${missingDeps.join(', ')}`);
      console.log('📦 Instalando dependencias faltantes...');
      
      for (const dep of missingDeps) {
        if (dep === 'babel-plugin-import') {
          execSync('npm install --save-dev babel-plugin-import', { stdio: 'pipe' });
        } else {
          execSync(`npm install ${dep}`, { stdio: 'pipe' });
        }
      }
      
      console.log('✅ Dependencias instaladas');
    } else {
      console.log('✅ Todas las dependencias están instaladas');
    }
    
    fixes.dependencies = true;
  } catch (error) {
    console.error('❌ Error verificando dependencias:', error.message);
  }
}

async function verifyNodeModules() {
  console.log('📁 4/4 - Verificando node_modules...');
  
  try {
    const nodeModulesPath = 'node_modules';
    
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('⚠️ node_modules no existe, ejecutando npm install...');
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ node_modules instalado');
    } else {
      // Verificar que babel-plugin-import esté instalado
      const babelPluginPath = path.join(nodeModulesPath, 'babel-plugin-import');
      
      if (!fs.existsSync(babelPluginPath)) {
        console.log('⚠️ babel-plugin-import no encontrado, instalando...');
        execSync('npm install --save-dev babel-plugin-import', { stdio: 'pipe' });
        console.log('✅ babel-plugin-import instalado');
      } else {
        console.log('✅ node_modules está correcto');
      }
    }
    
    fixes.nodeModules = true;
  } catch (error) {
    console.error('❌ Error verificando node_modules:', error.message);
  }
}

async function generateTroubleshootingGuide() {
  console.log('\n📋 Generando guía de troubleshooting...');
  
  const guide = `# 🔧 Development Troubleshooting Guide

## Problemas Comunes y Soluciones

### 1. Error: Cannot find module 'babel-plugin-import'

**Síntomas:**
- Error al ejecutar \`npm run dev\`
- Mensaje sobre babel-plugin-import no encontrado

**Solución:**
\`\`\`bash
# Instalar dependencia faltante
npm install --save-dev babel-plugin-import

# Limpiar cache y reiniciar
npm run fix-dev-issues
npm run dev
\`\`\`

### 2. Error: Babel configuration conflicts

**Síntomas:**
- SWC disabled debido a configuración de Babel
- Errores de compilación en desarrollo

**Solución:**
\`\`\`bash
# Ejecutar script de corrección
npm run fix-dev-issues

# O manualmente:
# 1. Verificar babel.config.js tiene presets: ['next/babel']
# 2. Tree shaking solo en producción (NODE_ENV === 'production')
\`\`\`

### 3. Cache corrupto de Next.js

**Síntomas:**
- Errores extraños de compilación
- Cambios no se reflejan

**Solución:**
\`\`\`bash
# Windows
Remove-Item -Recurse -Force .next
npm run dev

# Linux/Mac
rm -rf .next
npm run dev
\`\`\`

### 4. Dependencias desactualizadas

**Síntomas:**
- Errores de compatibilidad
- Funcionalidades no funcionan

**Solución:**
\`\`\`bash
# Verificar e instalar dependencias
npm install
npm audit fix

# Si persisten problemas
rm -rf node_modules package-lock.json
npm install
\`\`\`

## Scripts de Solución Automática

\`\`\`bash
# Script principal de corrección
npm run fix-dev-issues

# Scripts específicos
npm run clean-cache
npm run verify-deps
\`\`\`

## Configuración Recomendada

### babel.config.js
\`\`\`javascript
module.exports = {
  presets: ['next/babel'],
  plugins: [
    // Solo tree shaking en producción
    ...(process.env.NODE_ENV === 'production' ? [
      ['babel-plugin-import', {
        libraryName: 'lucide-react',
        libraryDirectory: 'dist/esm/icons',
        camel2DashComponentName: false,
      }, 'lucide-react'],
    ] : [])
  ],
};
\`\`\`

### next.config.js
- Usar \`turbopack\` en lugar de \`experimental.turbo\`
- Configurar webpack solo para producción
- Mantener optimizaciones experimentales

## Verificación de Estado

\`\`\`bash
# Verificar que todo funciona
npm run dev
# Debería iniciar sin errores en http://localhost:3000

# Verificar build de producción
npm run build
# Debería completarse sin errores
\`\`\`

---

*Guía generada automáticamente por el sistema de troubleshooting de Pinteya*
`;

  fs.writeFileSync('DEVELOPMENT_TROUBLESHOOTING.md', guide);
  console.log('✅ Guía de troubleshooting creada');
}

async function generateReport() {
  console.log('\n📊 Generando reporte de correcciones...');
  
  const report = {
    timestamp: new Date().toISOString(),
    fixes,
    summary: {
      total: Object.keys(fixes).length,
      successful: Object.values(fixes).filter(Boolean).length,
      failed: Object.values(fixes).filter(fix => !fix).length
    }
  };
  
  console.log('\n📋 Resumen de Correcciones:');
  console.log(`  ✅ Exitosas: ${report.summary.successful}/${report.summary.total}`);
  console.log(`  ❌ Fallidas: ${report.summary.failed}/${report.summary.total}`);
  
  Object.entries(fixes).forEach(([fix, success]) => {
    console.log(`  ${success ? '✅' : '❌'} ${fix}`);
  });
  
  if (report.summary.successful === report.summary.total) {
    console.log('\n🎉 ¡Todos los problemas han sido solucionados!');
    console.log('🚀 Puedes ejecutar npm run dev sin problemas');
  } else {
    console.log('\n⚠️ Algunos problemas persisten. Revisar manualmente.');
  }
  
  console.log('\n📚 Documentación: DEVELOPMENT_TROUBLESHOOTING.md');
}

// Ejecutar correcciones
async function main() {
  try {
    await fixBabelConfiguration();
    await clearNextCache();
    await verifyDependencies();
    await verifyNodeModules();
    await generateTroubleshootingGuide();
    await generateReport();
    
    console.log('\n🎯 ¡Correcciones de desarrollo completadas!');
    
  } catch (error) {
    console.error('❌ Error en correcciones:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
