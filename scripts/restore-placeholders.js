#!/usr/bin/env node
// Script para restaurar placeholders desde backup
const fs = require('fs');
const path = require('path');

const backupDir = path.join('public', 'images', 'products', 'backups');
const targetDir = path.join('public', 'images', 'products');

if (!fs.existsSync(backupDir)) {
  console.log('❌ No existe directorio de backup');
  process.exit(1);
}

const backupFiles = fs.readdirSync(backupDir).filter(file => 
  file.startsWith('placeholder-')
);

console.log(`🔄 Restaurando ${backupFiles.length} placeholders...`);

backupFiles.forEach(file => {
  const backupPath = path.join(backupDir, file);
  const targetFile = file.replace('placeholder-', '');
  const targetPath = path.join(targetDir, targetFile);
  fs.copyFileSync(backupPath, targetPath);
  console.log(`  ✅ ${targetFile}`);
});

console.log('🔄 Restauración completada!');