#!/usr/bin/env node
// Script para hacer backup de placeholders antes de reemplazar con imágenes reales
const fs = require('fs');
const path = require('path');

const sourceDir = path.join('public', 'images', 'products');
const backupDir = path.join('public', 'images', 'products', 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const files = fs.readdirSync(sourceDir).filter(file => 
  file.endsWith('.jpg') && !file.includes('petrilac')
);

console.log(`📦 Haciendo backup de ${files.length} placeholders...`);

files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const backupPath = path.join(backupDir, `placeholder-${file}`);
  fs.copyFileSync(sourcePath, backupPath);
  console.log(`  ✅ ${file}`);
});

console.log('📦 Backup completado!');