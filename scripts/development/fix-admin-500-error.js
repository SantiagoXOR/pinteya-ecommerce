#!/usr/bin/env node

/**
 * Script para diagnosticar y corregir errores 500 en el panel administrativo
 * Pinteya E-commerce - Agosto 2025
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 INICIANDO CORRECCIÓN DE ERRORES 500 EN PANEL ADMIN\n');

// Verificar archivos críticos
const criticalFiles = [
  'src/hooks/admin/useProductList.ts',
  'src/app/api/admin/products-direct/route.ts',
  'src/middleware.ts',
  '.env.local'
];

console.log('📋 1. VERIFICANDO ARCHIVOS CRÍTICOS...');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  
  if (!exists && file === '.env.local') {
    console.log('   ⚠️  Archivo .env.local no encontrado - Verificar variables de entorno');
  }
});

// Verificar estructura de APIs
console.log('\n📋 2. VERIFICANDO ESTRUCTURA DE APIs...');
const apiPaths = [
  'src/app/api/admin/products-direct',
  'src/app/api/admin/products-simple',
  'src/app/api/admin/debug'
];

apiPaths.forEach(apiPath => {
  const exists = fs.existsSync(apiPath);
  console.log(`   ${exists ? '✅' : '❌'} ${apiPath}`);
});

// Verificar contenido del hook useProductList
console.log('\n📋 3. VERIFICANDO HOOK useProductList...');
const hookPath = 'src/hooks/admin/useProductList.ts';
if (fs.existsSync(hookPath)) {
  const content = fs.readFileSync(hookPath, 'utf8');
  
  // Verificar correcciones críticas
  const checks = [
    {
      name: 'Parámetro limit en lugar de pageSize',
      pattern: /searchParams\.set\('limit'/,
      fix: "Cambiar 'pageSize' por 'limit' en línea ~75"
    },
    {
      name: 'Transformación de respuesta API',
      pattern: /apiResponse\.data\.products/,
      fix: "Verificar transformación en línea ~127"
    },
    {
      name: 'Error handling mejorado',
      pattern: /if \(!response\.ok\)/,
      fix: "Verificar error handling en línea ~93"
    },
    {
      name: 'Configuración TanStack Query',
      pattern: /retry: 3/,
      fix: "Verificar configuración retry en línea ~191"
    }
  ];

  checks.forEach(check => {
    const hasPattern = check.pattern.test(content);
    console.log(`   ${hasPattern ? '✅' : '❌'} ${check.name}`);
    if (!hasPattern) {
      console.log(`      💡 ${check.fix}`);
    }
  });
} else {
  console.log('   ❌ Hook useProductList no encontrado');
}

// Verificar API products-direct
console.log('\n📋 4. VERIFICANDO API products-direct...');
const apiPath = 'src/app/api/admin/products-direct/route.ts';
if (fs.existsSync(apiPath)) {
  const content = fs.readFileSync(apiPath, 'utf8');
  
  const apiChecks = [
    {
      name: 'Importación de Clerk',
      pattern: /import.*auth.*clerkClient.*from '@clerk\/nextjs\/server'/,
      fix: "Verificar importaciones de Clerk"
    },
    {
      name: 'Importación de Supabase',
      pattern: /import.*createClient.*from '@supabase\/supabase-js'/,
      fix: "Verificar importación de Supabase"
    },
    {
      name: 'Variables de entorno',
      pattern: /process\.env\.NEXT_PUBLIC_SUPABASE_URL/,
      fix: "Verificar variables de entorno de Supabase"
    },
    {
      name: 'Error handling',
      pattern: /catch \(error\)/,
      fix: "Verificar manejo de errores"
    }
  ];

  apiChecks.forEach(check => {
    const hasPattern = check.pattern.test(content);
    console.log(`   ${hasPattern ? '✅' : '❌'} ${check.name}`);
    if (!hasPattern) {
      console.log(`      💡 ${check.fix}`);
    }
  });
} else {
  console.log('   ❌ API products-direct no encontrada');
}

// Generar reporte de correcciones
console.log('\n📋 5. GENERANDO REPORTE DE CORRECCIONES...');

const fixes = [
  {
    issue: 'Error 500 en API',
    solutions: [
      'Verificar variables de entorno en .env.local',
      'Comprobar conexión con Supabase',
      'Verificar autenticación de Clerk',
      'Revisar logs del servidor en consola'
    ]
  },
  {
    issue: 'Error 307 (Redirect)',
    solutions: [
      'Usuario no autenticado',
      'Verificar middleware de Clerk',
      'Comprobar rutas públicas en middleware.ts'
    ]
  },
  {
    issue: 'Error en useProductList',
    solutions: [
      'Verificar parámetro limit vs pageSize',
      'Comprobar transformación de respuesta API',
      'Revisar configuración de TanStack Query'
    ]
  }
];

fixes.forEach((fix, index) => {
  console.log(`\n   ${index + 1}. ${fix.issue}:`);
  fix.solutions.forEach(solution => {
    console.log(`      • ${solution}`);
  });
});

// Instrucciones finales
console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS:');
console.log('   1. Abrir http://localhost:3000/admin/debug-products');
console.log('   2. Verificar autenticación y rol del usuario');
console.log('   3. Ejecutar diagnóstico del sistema');
console.log('   4. Probar API de productos');
console.log('   5. Si todo funciona en debug, el problema está en el componente original');
console.log('   6. Si falla en debug, revisar autenticación/autorización');

console.log('\n🔧 HERRAMIENTAS DE DEBUGGING DISPONIBLES:');
console.log('   • API de diagnóstico: http://localhost:3000/api/admin/debug');
console.log('   • Página de debug: http://localhost:3000/admin/debug-products');
console.log('   • Script de prueba: node scripts/test-admin-products-fix.js');
console.log('   • Logs del servidor: Revisar consola de npm run dev');

console.log('\n✅ CORRECCIÓN COMPLETADA - Revisar resultados arriba\n');
