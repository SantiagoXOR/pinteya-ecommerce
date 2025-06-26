#!/usr/bin/env node

/**
 * Script para configurar el deploy automático de Storybook
 * 
 * Este script ayuda a configurar:
 * 1. Proyecto en Vercel para Storybook
 * 2. Variables de entorno necesarias
 * 3. Configuración de GitHub Actions
 * 4. Chromatic (opcional)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 Configurando deploy automático de Storybook...\n');

// Verificar que Storybook esté configurado
if (!fs.existsSync('.storybook/main.ts')) {
  console.error('❌ Error: No se encontró la configuración de Storybook');
  console.log('   Ejecuta: npm run storybook para verificar la instalación');
  process.exit(1);
}

// Verificar que el build de Storybook funcione
console.log('🔨 Verificando build de Storybook...');
try {
  execSync('npm run build-storybook', { stdio: 'inherit' });
  console.log('✅ Build de Storybook exitoso\n');
} catch (error) {
  console.error('❌ Error en el build de Storybook');
  console.log('   Revisa los errores arriba y corrige antes de continuar');
  process.exit(1);
}

// Crear archivo de configuración de Vercel si no existe
const vercelConfigPath = 'vercel-storybook.json';
if (!fs.existsSync(vercelConfigPath)) {
  console.log('📝 Creando configuración de Vercel...');
  const vercelConfig = {
    name: 'pinteya-storybook',
    version: 2,
    buildCommand: 'npm run build-storybook',
    outputDirectory: 'storybook-static',
    installCommand: 'npm install',
    framework: null,
    public: false
  };
  
  fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
  console.log('✅ Configuración de Vercel creada\n');
}

// Crear .gitignore para Storybook si no existe
const gitignorePath = '.gitignore';
const storybookIgnore = 'storybook-static/';

if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignoreContent.includes(storybookIgnore)) {
    fs.appendFileSync(gitignorePath, `\n# Storybook\n${storybookIgnore}\n`);
    console.log('✅ Agregado storybook-static/ a .gitignore\n');
  }
} else {
  fs.writeFileSync(gitignorePath, `# Storybook\n${storybookIgnore}\n`);
  console.log('✅ Creado .gitignore con configuración de Storybook\n');
}

// Verificar GitHub Actions
const workflowPath = '.github/workflows/storybook-deploy.yml';
if (fs.existsSync(workflowPath)) {
  console.log('✅ Workflow de GitHub Actions encontrado\n');
} else {
  console.log('⚠️  Workflow de GitHub Actions no encontrado');
  console.log('   El archivo debería estar en: .github/workflows/storybook-deploy.yml\n');
}

// Mostrar instrucciones de configuración
console.log('🚀 Configuración completada!\n');
console.log('📋 Próximos pasos para completar el deploy:\n');

console.log('1️⃣  Crear proyecto en Vercel:');
console.log('   • Ve a https://vercel.com/new');
console.log('   • Importa este repositorio');
console.log('   • Configura el proyecto con:');
console.log('     - Build Command: npm run build-storybook');
console.log('     - Output Directory: storybook-static');
console.log('     - Install Command: npm install\n');

console.log('2️⃣  Configurar variables de entorno en GitHub:');
console.log('   • Ve a Settings > Secrets and variables > Actions');
console.log('   • Agrega estos secrets:');
console.log('     - VERCEL_TOKEN: Token de tu cuenta de Vercel');
console.log('     - VERCEL_ORG_ID: ID de tu organización en Vercel');
console.log('     - VERCEL_STORYBOOK_PROJECT_ID: ID del proyecto de Storybook\n');

console.log('3️⃣  Obtener IDs de Vercel:');
console.log('   • Instala Vercel CLI: npm i -g vercel');
console.log('   • Ejecuta: vercel link');
console.log('   • Los IDs estarán en .vercel/project.json\n');

console.log('4️⃣  (Opcional) Configurar Chromatic:');
console.log('   • Ve a https://chromatic.com');
console.log('   • Conecta tu repositorio');
console.log('   • Agrega CHROMATIC_PROJECT_TOKEN a GitHub Secrets\n');

console.log('5️⃣  Probar el deploy:');
console.log('   • Haz un commit y push a main');
console.log('   • Verifica que el workflow se ejecute en GitHub Actions');
console.log('   • Revisa el deploy en Vercel\n');

console.log('📚 URLs útiles:');
console.log('   • Vercel Dashboard: https://vercel.com/dashboard');
console.log('   • GitHub Actions: https://github.com/tu-usuario/tu-repo/actions');
console.log('   • Chromatic: https://chromatic.com\n');

console.log('🎉 ¡Listo! Tu Storybook se desplegará automáticamente en cada push a main.');

// Verificar si hay cambios pendientes
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('\n📝 Cambios detectados:');
    console.log('   Recuerda hacer commit de los archivos de configuración creados');
  }
} catch (error) {
  // Git no está inicializado o hay algún error, no es crítico
}

console.log('\n✨ Setup completado exitosamente!');
