#!/usr/bin/env node

// ===================================
// PINTEYA E-COMMERCE - SETUP EMAIL
// ===================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEmail() {
  console.log('\n🎨 PINTEYA E-COMMERCE - CONFIGURACIÓN DE EMAIL');
  console.log('================================================\n');

  console.log('Este script te ayudará a configurar el sistema de emails personalizados.');
  console.log('Necesitarás una cuenta en Resend (https://resend.com)\n');

  // Verificar si ya existe configuración
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Verificar configuración actual
  const hasResendKey = envContent.includes('RESEND_API_KEY=');
  const hasFromEmail = envContent.includes('RESEND_FROM_EMAIL=');
  const hasSupportEmail = envContent.includes('RESEND_SUPPORT_EMAIL=');

  if (hasResendKey && hasFromEmail && hasSupportEmail) {
    console.log('✅ Ya tienes configuración de email en .env.local');
    const overwrite = await question('¿Quieres reconfigurar? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Configuración mantenida. ¡Listo!');
      rl.close();
      return;
    }
  }

  console.log('\n📧 CONFIGURACIÓN DE RESEND');
  console.log('==========================\n');

  // Solicitar API Key
  const apiKey = await question('1. Ingresa tu API Key de Resend (re_...): ');
  if (!apiKey.startsWith('re_')) {
    console.log('❌ Error: La API Key debe comenzar con "re_"');
    rl.close();
    return;
  }

  // Solicitar email origen
  const fromEmail = await question('2. Email origen (ej: noreply@pinteya.com): ');
  if (!fromEmail.includes('@pinteya.com')) {
    console.log('⚠️  Advertencia: Se recomienda usar @pinteya.com para consistencia de marca');
  }

  // Solicitar email soporte
  const supportEmail = await question('3. Email de soporte (ej: soporte@pinteya.com): ');
  if (!supportEmail.includes('@pinteya.com')) {
    console.log('⚠️  Advertencia: Se recomienda usar @pinteya.com para consistencia de marca');
  }

  // Preparar configuración
  const emailConfig = `
# ===================================
# EMAIL CONFIGURATION (RESEND)
# ===================================
RESEND_API_KEY=${apiKey}
RESEND_FROM_EMAIL=${fromEmail}
RESEND_SUPPORT_EMAIL=${supportEmail}
`;

  // Actualizar .env.local
  if (hasResendKey || hasFromEmail || hasSupportEmail) {
    // Remover configuración existente
    envContent = envContent.replace(/# ===================================\n# EMAIL CONFIGURATION \(RESEND\)\n# ===================================\nRESEND_API_KEY=.*\nRESEND_FROM_EMAIL=.*\nRESEND_SUPPORT_EMAIL=.*\n/g, '');
    envContent = envContent.replace(/RESEND_API_KEY=.*\n/g, '');
    envContent = envContent.replace(/RESEND_FROM_EMAIL=.*\n/g, '');
    envContent = envContent.replace(/RESEND_SUPPORT_EMAIL=.*\n/g, '');
  }

  // Agregar nueva configuración
  envContent += emailConfig;

  // Escribir archivo
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ CONFIGURACIÓN COMPLETADA');
  console.log('============================\n');
  console.log('📁 Archivo actualizado: .env.local');
  console.log('📧 Configuración de email agregada');
  
  console.log('\n🚀 PRÓXIMOS PASOS');
  console.log('==================\n');
  console.log('1. Reinicia el servidor de desarrollo: npm run dev');
  console.log('2. Visita: http://localhost:3001/admin/email-test');
  console.log('3. Prueba el envío de emails');
  console.log('4. Configura el dominio en Resend si no lo has hecho');
  
  console.log('\n📚 DOCUMENTACIÓN');
  console.log('==================\n');
  console.log('• Guía completa: docs/EMAIL_CONFIGURATION.md');
  console.log('• Configuración DNS: Consulta el dashboard de Resend');
  console.log('• Testing: /admin/email-test');

  rl.close();
}

// Ejecutar setup
setupEmail().catch(console.error);
