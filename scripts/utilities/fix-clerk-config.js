#!/usr/bin/env node

/**
 * Script para diagnosticar y corregir la configuración de Clerk
 * Uso: node scripts/fix-clerk-config.js
 */

console.log('🔧 Diagnóstico de configuración de Clerk...\n');

// Verificar variables de entorno actuales
const clerkVars = {
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY,
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL': process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL': process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
};

console.log('📋 Variables de entorno actuales:');
Object.entries(clerkVars).forEach(([key, value]) => {
  if (value) {
    const masked = key.includes('SECRET') ? 
      value.substring(0, 10) + '...' : 
      value;
    console.log(`✅ ${key}: ${masked}`);
  } else {
    console.log(`❌ ${key}: NO CONFIGURADA`);
  }
});

console.log('\n🔍 Análisis de problemas:');

// Verificar si las claves están completas
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

if (publishableKey && publishableKey.length < 50) {
  console.log('❌ PROBLEMA: Clave pública truncada o incompleta');
  console.log(`   Longitud actual: ${publishableKey.length} caracteres`);
  console.log('   Longitud esperada: ~100+ caracteres');
}

if (secretKey && secretKey.length < 50) {
  console.log('❌ PROBLEMA: Clave secreta truncada o incompleta');
  console.log(`   Longitud actual: ${secretKey.length} caracteres`);
  console.log('   Longitud esperada: ~100+ caracteres');
}

// Verificar tipo de claves
if (publishableKey) {
  if (publishableKey.startsWith('pk_live_')) {
    console.log('⚠️  ADVERTENCIA: Usando claves de PRODUCCIÓN');
    console.log('   Esto requiere dominio autorizado en Clerk');
  } else if (publishableKey.startsWith('pk_test_')) {
    console.log('✅ Usando claves de DESARROLLO (correcto para testing)');
  } else {
    console.log('❌ PROBLEMA: Formato de clave pública no reconocido');
  }
}

console.log('\n🛠️  Soluciones recomendadas:');
console.log('1. Verificar que las claves estén completas en Vercel');
console.log('2. Usar claves de desarrollo para testing');
console.log('3. Agregar dominio pinteya-ecommerce.vercel.app a Clerk si usas producción');

console.log('\n📝 Para configurar en Vercel:');
console.log('1. Ve a: https://vercel.com/santiagoxor/pinteya-ecommerce/settings/environment-variables');
console.log('2. Verifica que las claves estén completas');
console.log('3. Redeploy después de cambios');

console.log('\n🔗 Dashboard de Clerk:');
console.log('https://dashboard.clerk.com/');
