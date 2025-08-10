#!/usr/bin/env node

/**
 * Script para configurar la variable de entorno ADMIN_USER_IDS en Vercel
 * Uso: node scripts/configure-admin-allowlist.js
 */

const { execSync } = require('child_process');

// Tu userId de Clerk (del screenshot que mostraste)
const ADMIN_USER_ID = 'user_3Oi3_gYZBVoqBD';

console.log('🔧 Configurando allowlist temporal de admin...');
console.log(`📋 User ID: ${ADMIN_USER_ID}`);

try {
  // Configurar variable de entorno en Vercel para todos los entornos
  const command = `vercel env add ADMIN_USER_IDS production`;
  
  console.log('⚡ Ejecutando comando Vercel CLI...');
  console.log(`Comando: ${command}`);
  console.log('📝 Cuando se solicite, ingresa el valor:', ADMIN_USER_ID);
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Variable de entorno configurada exitosamente');
  console.log('🚀 Ahora necesitas hacer un redeploy para que tome efecto');
  console.log('💡 Ejecuta: vercel --prod');
  
} catch (error) {
  console.error('❌ Error configurando variable de entorno:', error.message);
  console.log('\n📋 Configuración manual:');
  console.log('1. Ve a: https://vercel.com/santiagoxor/pinteya-ecommerce/settings/environment-variables');
  console.log('2. Agrega nueva variable:');
  console.log('   - Name: ADMIN_USER_IDS');
  console.log(`   - Value: ${ADMIN_USER_ID}`);
  console.log('   - Environment: Production');
  console.log('3. Redeploy el proyecto');
}
