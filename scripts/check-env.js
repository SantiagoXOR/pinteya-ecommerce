#!/usr/bin/env node

// ===================================
// PINTEYA E-COMMERCE - VERIFICADOR DE VARIABLES DE ENTORNO
// ===================================

// Cargar variables de entorno desde .env.local
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const envFile = fs.readFileSync(filePath, 'utf8');
    const lines = envFile.split('\n');

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.log(`⚠️  No se pudo cargar ${filePath}: ${error.message}`);
  }
}

// Cargar archivos de entorno en orden de prioridad
loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

const requiredEnvVars = {
  // Supabase (críticas)
  'NEXT_PUBLIC_SUPABASE_URL': 'URL del proyecto Supabase',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Clave anónima de Supabase',
  'SUPABASE_SERVICE_ROLE_KEY': 'Clave de servicio de Supabase',
  
  // MercadoPago (críticas)
  'MERCADOPAGO_ACCESS_TOKEN': 'Token de acceso de MercadoPago',
  'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY': 'Clave pública de MercadoPago',
  'MERCADOPAGO_CLIENT_ID': 'ID de cliente de MercadoPago',
  
  // Aplicación (críticas)
  'NEXT_PUBLIC_APP_URL': 'URL de la aplicación',
};

const optionalEnvVars = {
  // Clerk (opcionales)
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': 'Clave pública de Clerk',
  'CLERK_SECRET_KEY': 'Clave secreta de Clerk',
  'CLERK_WEBHOOK_SECRET': 'Secret del webhook de Clerk',
  
  // Configuración adicional
  'MERCADOPAGO_CLIENT_SECRET': 'Secret de cliente de MercadoPago',
  'MERCADOPAGO_WEBHOOK_SECRET': 'Secret del webhook de MercadoPago',
  'NODE_ENV': 'Entorno de ejecución',
};

function checkEnvironmentVariables() {
  console.log('🔍 Verificando variables de entorno...\n');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Verificar variables críticas
  console.log('📋 Variables CRÍTICAS:');
  for (const [varName, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: FALTANTE - ${description}`);
      hasErrors = true;
    } else {
      const maskedValue = varName.includes('SECRET') || varName.includes('KEY') 
        ? `${value.substring(0, 10)}...` 
        : value.length > 50 
        ? `${value.substring(0, 50)}...` 
        : value;
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  }
  
  console.log('\n📋 Variables OPCIONALES:');
  for (const [varName, description] of Object.entries(optionalEnvVars)) {
    const value = process.env[varName];
    if (!value) {
      console.log(`⚠️  ${varName}: FALTANTE - ${description}`);
      hasWarnings = true;
    } else {
      const maskedValue = varName.includes('SECRET') || varName.includes('KEY') 
        ? `${value.substring(0, 10)}...` 
        : value.length > 50 
        ? `${value.substring(0, 50)}...` 
        : value;
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (hasErrors) {
    console.log('❌ ERRORES CRÍTICOS: Faltan variables de entorno obligatorias');
    console.log('📖 Consulta VERCEL_ENV_SETUP.md para configurar las variables');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('🚨 Build fallará en producción sin estas variables');
      process.exit(1);
    } else {
      console.log('⚠️  Aplicación puede no funcionar correctamente');
    }
  } else {
    console.log('✅ Todas las variables críticas están configuradas');
  }
  
  if (hasWarnings) {
    console.log('⚠️  Algunas funcionalidades opcionales pueden no estar disponibles');
  }
  
  console.log('✨ Verificación completada\n');
}

// Ejecutar verificación
checkEnvironmentVariables();
