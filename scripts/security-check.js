#!/usr/bin/env node

// ===================================
// PINTEYA E-COMMERCE - SCRIPT DE VERIFICACIÓN DE SEGURIDAD
// ===================================

const fs = require('fs');
const path = require('path');

console.log('🔒 Iniciando verificación de seguridad...\n');

// ===================================
// VERIFICACIONES DE ARCHIVOS SENSIBLES
// ===================================

const sensitiveFiles = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
];

const sensitivePatterns = [
  /[STRIPE_SECRET_KEY_REMOVED][a-zA-Z0-9]+/g, // Clerk secret keys
  /sk_live_[a-zA-Z0-9]+/g, // Clerk live secret keys
  /APP_USR-[0-9]+-[0-9]+-[a-zA-Z0-9]+/g, // MercadoPago tokens
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWT tokens
  /[a-zA-Z0-9]{32,}/g, // Posibles API keys
];

function checkSensitiveFiles() {
  console.log('📁 Verificando archivos sensibles...');
  
  let hasIssues = false;
  
  // Verificar que archivos sensibles estén en .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    sensitiveFiles.forEach(file => {
      if (!gitignoreContent.includes(file)) {
        console.error(`❌ ${file} no está en .gitignore`);
        hasIssues = true;
      } else {
        console.log(`✅ ${file} está protegido en .gitignore`);
      }
    });
  } else {
    console.error('❌ .gitignore no encontrado');
    hasIssues = true;
  }
  
  return !hasIssues;
}

// ===================================
// VERIFICACIÓN DE CREDENCIALES EN CÓDIGO
// ===================================

function scanFileForCredentials(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    sensitivePatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Ignorar ejemplos obvios y placeholders
          if (
            match.includes('your-') ||
            match.includes('example') ||
            match.includes('***') ||
            match.includes('tu-') ||
            match.includes('test_your') ||
            match.includes('[STRIPE_PUBLIC_KEY_REMOVED]your') ||
            match.includes('[STRIPE_SECRET_KEY_REMOVED]your') ||
            match.includes('[STRIPE_SECRET_KEY_REMOVED]tu') ||
            match.includes('APP_USR-your') ||
            match.includes('placeholder') ||
            match.includes('dummy') ||
            match.length < 10 // Muy corto para ser una credencial real
          ) {
            return;
          }
          issues.push({
            pattern: index,
            match: match.substring(0, 20) + '...',
            line: content.substring(0, content.indexOf(match)).split('\n').length
          });
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [];
  }
}

function checkCredentialsInCode() {
  console.log('\n🔍 Escaneando código en busca de credenciales...');
  
  const filesToScan = [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.js',
    'src/**/*.jsx',
    'docs/**/*.md',
    '*.md',
    '*.js',
    '*.ts',
  ];
  
  let hasIssues = false;
  
  // Función recursiva para escanear directorios
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.md'))) {
        const issues = scanFileForCredentials(filePath);
        if (issues.length > 0) {
          console.error(`❌ Posibles credenciales encontradas en ${filePath}:`);
          issues.forEach(issue => {
            console.error(`   Línea ${issue.line}: ${issue.match}`);
          });
          hasIssues = true;
        }
      }
    });
  }
  
  try {
    scanDirectory(process.cwd());
    if (!hasIssues) {
      console.log('✅ No se encontraron credenciales expuestas en el código');
    }
  } catch (error) {
    console.error('❌ Error escaneando archivos:', error.message);
    hasIssues = true;
  }
  
  return !hasIssues;
}

// ===================================
// VERIFICACIÓN DE CONFIGURACIÓN
// ===================================

function checkSecurityConfig() {
  console.log('\n⚙️ Verificando configuración de seguridad...');
  
  let hasIssues = false;
  
  // Verificar middleware de seguridad
  const middlewarePath = path.join(process.cwd(), 'src/middleware/security.ts');
  if (fs.existsSync(middlewarePath)) {
    console.log('✅ Middleware de seguridad encontrado');
  } else {
    console.error('❌ Middleware de seguridad no encontrado');
    hasIssues = true;
  }
  
  // Verificar configuración de headers en next.config.js
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    if (content.includes('headers()') && content.includes('X-Frame-Options')) {
      console.log('✅ Headers de seguridad configurados');
    } else {
      console.error('❌ Headers de seguridad no configurados en next.config.js');
      hasIssues = true;
    }
  }
  
  return !hasIssues;
}

// ===================================
// VERIFICACIÓN DE DEPENDENCIAS
// ===================================

function checkDependencies() {
  console.log('\n📦 Verificando dependencias...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json no encontrado');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Verificar dependencias de seguridad críticas
  const securityDeps = ['zod', '@clerk/nextjs'];
  let hasIssues = false;
  
  securityDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep} instalado`);
    } else {
      console.error(`❌ ${dep} no encontrado`);
      hasIssues = true;
    }
  });
  
  return !hasIssues;
}

// ===================================
// EJECUCIÓN PRINCIPAL
// ===================================

async function main() {
  const checks = [
    { name: 'Archivos sensibles', fn: checkSensitiveFiles },
    { name: 'Credenciales en código', fn: checkCredentialsInCode },
    { name: 'Configuración de seguridad', fn: checkSecurityConfig },
    { name: 'Dependencias', fn: checkDependencies },
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const passed = check.fn();
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 Todas las verificaciones de seguridad pasaron');
    console.log('✅ El proyecto está listo para trabajar con Codex Agent');
    process.exit(0);
  } else {
    console.log('⚠️  Se encontraron problemas de seguridad');
    console.log('❌ Resuelve los problemas antes de usar Codex Agent');
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('Error ejecutando verificación de seguridad:', error);
    process.exit(1);
  });
}

module.exports = { main };
