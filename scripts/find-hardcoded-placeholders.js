#!/usr/bin/env node
// Script para encontrar placeholders hardcodeados

const fs = require('fs');
const path = require('path');

function searchInFile(filePath, searchTerms) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];
    
    searchTerms.forEach(term => {
      if (content.includes(term)) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(term)) {
            results.push({
              term,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    });
    
    return results;
  } catch (error) {
    return [];
  }
}

function searchInDirectory(dir, searchTerms, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        results.push(...searchInDirectory(filePath, searchTerms, extensions));
      } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
        const fileResults = searchInFile(filePath, searchTerms);
        if (fileResults.length > 0) {
          results.push({
            file: filePath,
            matches: fileResults
          });
        }
      }
    });
  } catch (error) {
    // Ignorar errores de permisos
  }
  
  return results;
}

function main() {
  console.log('🔍 Buscando placeholders hardcodeados...');
  
  const searchTerms = [
    'placeholder-bg.jpg',
    'placeholder-sm.jpg',
    'placeholder-bg',
    'placeholder-sm'
  ];
  
  const results = searchInDirectory('.', searchTerms);
  
  if (results.length === 0) {
    console.log('✅ No se encontraron placeholders hardcodeados');
    return;
  }
  
  console.log(`\n🔧 Encontrados ${results.length} archivos con placeholders hardcodeados:`);
  
  results.forEach(result => {
    console.log(`\n📁 ${result.file}:`);
    result.matches.forEach(match => {
      console.log(`  Línea ${match.line}: ${match.content}`);
      console.log(`  Término: ${match.term}`);
    });
  });
}

main();
