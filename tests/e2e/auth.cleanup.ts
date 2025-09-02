/**
 * CLEANUP DE AUTENTICACIÓN PARA PLAYWRIGHT
 * 
 * Este archivo se ejecuta después de todos los tests para
 * limpiar archivos temporales y estado de autenticación.
 */

import { test as cleanup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = 'tests/e2e/.auth/admin.json';

cleanup('cleanup auth files', async () => {
  console.log('🧹 Iniciando limpieza de archivos de autenticación...');
  
  try {
    const authDir = path.dirname(authFile);
    
    if (fs.existsSync(authDir)) {
      // Listar archivos en el directorio
      const files = fs.readdirSync(authDir);
      console.log(`📁 Archivos encontrados: ${files.length}`);
      
      // Eliminar archivos de autenticación
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(authDir, file);
          fs.unlinkSync(filePath);
          console.log(`🗑️ Eliminado: ${file}`);
        }
      }
      
      // Eliminar directorio si está vacío
      const remainingFiles = fs.readdirSync(authDir);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(authDir);
        console.log('📁 Directorio .auth eliminado');
      }
    }
    
    console.log('✅ Limpieza de autenticación completada');
    
  } catch (error) {
    console.warn('⚠️ Error durante limpieza:', error.message);
    // No fallar por errores de limpieza
  }
});

cleanup('cleanup test artifacts', async () => {
  console.log('🧹 Limpiando artefactos de tests...');
  
  try {
    const testResultsDir = 'test-results';
    
    if (fs.existsSync(testResultsDir)) {
      const files = fs.readdirSync(testResultsDir);
      
      // Eliminar screenshots y archivos HTML antiguos (más de 1 hora)
      for (const file of files) {
        if (file.includes('auth-') && (file.endsWith('.png') || file.endsWith('.html'))) {
          const filePath = path.join(testResultsDir, file);
          const stats = fs.statSync(filePath);
          const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          
          if (ageInHours > 1) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Artefacto antiguo eliminado: ${file}`);
          }
        }
      }
    }
    
    console.log('✅ Limpieza de artefactos completada');
    
  } catch (error) {
    console.warn('⚠️ Error durante limpieza de artefactos:', error.message);
  }
});
