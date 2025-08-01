#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - AUDITORÍA DE SEGURIDAD MEJORADA
 * Script para detectar credenciales expuestas y vulnerabilidades de seguridad
 * Incluye verificación de archivos de backup y patrones de alta entropía
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔒 AUDITORÍA DE SEGURIDAD MEJORADA - PINTEYA E-COMMERCE\n');

// Patrones de credenciales críticas
const CRITICAL_PATTERNS = [
  // Supabase
  { pattern: /eyJ[a-zA-Z0-9_-]{100,}\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, type: 'Supabase JWT Token', severity: 'CRITICAL' },
  { pattern: /https:\/\/[a-zA-Z0-9]+\.supabase\.co/g, type: 'Supabase URL', severity: 'HIGH' },
  
  // Clerk
  { pattern: /pk_live_[a-zA-Z0-9]+/g, type: 'Clerk Live Publishable Key', severity: 'CRITICAL' },
  { pattern: /sk_live_[a-zA-Z0-9]+/g, type: 'Clerk Live Secret Key', severity: 'CRITICAL' },
  { pattern: /pk_test_[a-zA-Z0-9]+/g, type: 'Clerk Test Publishable Key', severity: 'MEDIUM' },
  { pattern: /sk_test_[a-zA-Z0-9]+/g, type: 'Clerk Test Secret Key', severity: 'MEDIUM' },
  
  // MercadoPago
  { pattern: /APP_USR-[0-9]+-[0-9]+-[a-zA-Z0-9]+-[0-9]+/g, type: 'MercadoPago Access Token', severity: 'CRITICAL' },
  { pattern: /APP_USR-[a-zA-Z0-9-]+/g, type: 'MercadoPago Public Key', severity: 'HIGH' },
  
  // Genéricos de alta entropía
  { pattern: /[a-zA-Z0-9]{64,}/g, type: 'High Entropy String (64+ chars)', severity: 'MEDIUM' },
  { pattern: /[a-zA-Z0-9]{32,63}/g, type: 'Medium Entropy String (32-63 chars)', severity: 'LOW' }
];

// Archivos y directorios a escanear
const SCAN_TARGETS = [
  'src/**/*',
  'docs/**/*',
  'scripts/**/*',
  '*.js',
  '*.ts',
  '*.tsx',
  '*.jsx',
  '*.md',
  '*.json',
  '.env*',
  '*.backup*',
  'backup.*'
];

// Archivos a excluir
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'storybook-static',
  'test-results',
  'playwright-report'
];

let totalIssues = 0;
let criticalIssues = 0;
let highIssues = 0;

/**
 * Calcula la entropía de una cadena
 */
function calculateEntropy(str) {
  const freq = {};
  for (let char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  for (let count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Verifica si un archivo debe ser excluido
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

/**
 * Escanea un archivo en busca de credenciales
 */
function scanFile(filePath) {
  try {
    if (shouldExclude(filePath)) return [];
    
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    CRITICAL_PATTERNS.forEach(({ pattern, type, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Filtrar falsos positivos
          if (isLikelyFalsePositive(match, filePath)) return;
          
          const entropy = calculateEntropy(match);
          const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
          
          issues.push({
            file: filePath,
            line: lineNumber,
            type,
            severity,
            match: match.substring(0, 20) + '...',
            entropy: entropy.toFixed(2),
            fullMatch: match
          });
          
          // Contar por severidad
          if (severity === 'CRITICAL') criticalIssues++;
          else if (severity === 'HIGH') highIssues++;
          totalIssues++;
        });
      }
    });
    
    return issues;
  } catch (error) {
    console.warn(`⚠️  Error escaneando ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Detecta falsos positivos comunes
 */
function isLikelyFalsePositive(match, filePath) {
  const falsePositives = [
    'your-', 'example', 'test_your', 'tu-', 'placeholder', 'dummy',
    'ABCDEFGHIJKLMNOP', 'SearchAutocomplete', 'reactInternal',
    'Provider', 'Component', 'Function'
  ];
  
  // Si es un archivo de test y contiene patrones de test
  if (filePath.includes('test') || filePath.includes('spec')) {
    if (match.includes('test') || match.includes('mock') || match.includes('fake')) {
      return true;
    }
  }
  
  return falsePositives.some(fp => match.includes(fp)) || match.length < 10;
}

/**
 * Escanea recursivamente un directorio
 */
function scanDirectory(dir) {
  const issues = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !shouldExclude(filePath)) {
        issues.push(...scanDirectory(filePath));
      } else if (stat.isFile()) {
        issues.push(...scanFile(filePath));
      }
    });
  } catch (error) {
    console.warn(`⚠️  Error accediendo a ${dir}: ${error.message}`);
  }
  
  return issues;
}

/**
 * Genera reporte de seguridad
 */
function generateSecurityReport(issues) {
  console.log('📊 REPORTE DE SEGURIDAD:\n');
  
  if (issues.length === 0) {
    console.log('✅ No se encontraron problemas de seguridad');
    return;
  }
  
  // Agrupar por severidad
  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const high = issues.filter(i => i.severity === 'HIGH');
  const medium = issues.filter(i => i.severity === 'MEDIUM');
  const low = issues.filter(i => i.severity === 'LOW');
  
  console.log(`🚨 CRÍTICOS: ${critical.length}`);
  console.log(`⚠️  ALTOS: ${high.length}`);
  console.log(`📋 MEDIOS: ${medium.length}`);
  console.log(`ℹ️  BAJOS: ${low.length}\n`);
  
  // Mostrar issues críticos
  if (critical.length > 0) {
    console.log('🚨 PROBLEMAS CRÍTICOS:');
    critical.forEach(issue => {
      console.log(`❌ ${issue.file}:${issue.line}`);
      console.log(`   Tipo: ${issue.type}`);
      console.log(`   Match: ${issue.match}`);
      console.log(`   Entropía: ${issue.entropy}\n`);
    });
  }
  
  // Mostrar issues altos
  if (high.length > 0) {
    console.log('⚠️  PROBLEMAS ALTOS:');
    high.forEach(issue => {
      console.log(`⚠️  ${issue.file}:${issue.line} - ${issue.type}`);
    });
    console.log('');
  }
  
  return issues.length === 0;
}

/**
 * Función principal
 */
function main() {
  console.log('🔍 Iniciando escaneo de seguridad...\n');
  
  const allIssues = scanDirectory(process.cwd());
  const isSecure = generateSecurityReport(allIssues);
  
  console.log('='.repeat(60));
  if (isSecure) {
    console.log('✅ AUDITORÍA COMPLETADA - REPOSITORIO SEGURO');
    process.exit(0);
  } else {
    console.log('❌ AUDITORÍA COMPLETADA - SE ENCONTRARON PROBLEMAS');
    console.log(`Total de problemas: ${totalIssues}`);
    console.log(`Críticos: ${criticalIssues}, Altos: ${highIssues}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory, generateSecurityReport };
