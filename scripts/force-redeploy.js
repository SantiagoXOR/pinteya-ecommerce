#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - FORZAR REDEPLOY PARA SOLUCIONAR SERVER ACTION ERROR
 * Soluciona el error "Failed to find Server Action" forzando un redeploy limpio
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 FORZAR REDEPLOY - PINTEYA E-COMMERCE');
console.log('Solucionando error: Failed to find Server Action\n');

/**
 * Limpia cache local
 */
function clearLocalCache() {
  console.log('🧹 Limpiando cache local...');
  
  const cacheDirs = ['.next', '.vercel'];
  
  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        execSync(`rmdir /s /q "${dir}"`, { stdio: 'inherit' });
        console.log(`✅ Eliminado: ${dir}`);
      } catch (error) {
        console.warn(`⚠️  No se pudo eliminar ${dir}: ${error.message}`);
      }
    }
  });
}

/**
 * Crea un commit dummy para forzar redeploy
 */
function createDummyCommit() {
  console.log('\n📝 Creando commit para forzar redeploy...');
  
  try {
    // Crear archivo temporal
    const timestamp = new Date().toISOString();
    const dummyFile = 'FORCE_REDEPLOY.txt';
    
    fs.writeFileSync(dummyFile, `Force redeploy - ${timestamp}\nSoluciona error Server Action: 7f5f9d7998e7acf502fc7de855d63eee23c42abf1a`);
    
    // Hacer commit
    execSync('git add FORCE_REDEPLOY.txt', { stdio: 'inherit' });
    execSync(`git commit -m "🔧 Force redeploy - Fix Server Action error ${timestamp}"`, { stdio: 'inherit' });
    
    // Eliminar archivo temporal
    fs.unlinkSync(dummyFile);
    execSync('git add FORCE_REDEPLOY.txt', { stdio: 'inherit' });
    execSync(`git commit -m "🧹 Clean up force redeploy file"`, { stdio: 'inherit' });
    
    console.log('✅ Commits creados para forzar redeploy');
  } catch (error) {
    console.error('❌ Error creando commit:', error.message);
  }
}

/**
 * Actualiza timestamp en un archivo para forzar cambio
 */
function updateTimestamp() {
  console.log('\n⏰ Actualizando timestamp...');
  
  const timestampFile = 'src/app/layout.tsx';
  
  if (fs.existsSync(timestampFile)) {
    let content = fs.readFileSync(timestampFile, 'utf8');
    
    // Buscar y actualizar timestamp existente o agregar uno nuevo
    const timestampComment = `// Last updated: ${new Date().toISOString()}`;
    
    if (content.includes('// Last updated:')) {
      content = content.replace(/\/\/ Last updated:.*/, timestampComment);
    } else {
      // Agregar al inicio del archivo
      content = `${timestampComment}\n${content}`;
    }
    
    fs.writeFileSync(timestampFile, content);
    console.log('✅ Timestamp actualizado en layout.tsx');
  }
}

/**
 * Verifica estado de git
 */
function checkGitStatus() {
  console.log('\n📊 Verificando estado de git...');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (status.trim()) {
      console.log('📋 Cambios pendientes:');
      console.log(status);
    } else {
      console.log('✅ Working directory limpio');
    }
    
    // Verificar branch actual
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    console.log(`🌿 Branch actual: ${branch}`);
    
    return { hasChanges: !!status.trim(), branch };
  } catch (error) {
    console.error('❌ Error verificando git:', error.message);
    return { hasChanges: false, branch: 'unknown' };
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando proceso de redeploy forzado...\n');
    
    // Paso 1: Verificar git
    const gitStatus = checkGitStatus();
    
    // Paso 2: Limpiar cache local
    clearLocalCache();
    
    // Paso 3: Actualizar timestamp
    updateTimestamp();
    
    // Paso 4: Crear commit para forzar redeploy
    createDummyCommit();
    
    console.log('\n✅ PROCESO COMPLETADO!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ejecuta: git push origin main');
    console.log('2. Vercel detectará los cambios y hará redeploy automático');
    console.log('3. Espera 2-3 minutos para que complete el deploy');
    console.log('4. Verifica que el error se haya solucionado');
    
    console.log('\n🔗 Enlaces útiles:');
    console.log('- Dashboard Vercel: https://vercel.com/dashboard');
    console.log('- Logs de deploy: https://vercel.com/santiagoXOR/pinteya-ecommerce');
    console.log('- Aplicación: https://pinteya-ecommerce.vercel.app');
    
  } catch (error) {
    console.error('\n❌ ERROR EN EL PROCESO:', error.message);
    console.log('\n🔧 Soluciones alternativas:');
    console.log('1. Hacer un cambio manual en cualquier archivo');
    console.log('2. Hacer commit y push');
    console.log('3. Ir a Vercel dashboard y hacer redeploy manual');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  clearLocalCache,
  createDummyCommit,
  updateTimestamp,
  checkGitStatus
};
