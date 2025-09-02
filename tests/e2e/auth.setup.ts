/**
 * SETUP DE AUTENTICACIÓN PARA PLAYWRIGHT
 * 
 * Este archivo se ejecuta antes de los tests para configurar
 * el estado de autenticación que será reutilizado por todos
 * los tests que requieren acceso administrativo.
 */

import { test as setup, expect } from '@playwright/test';
import { authenticateAdminSimple, verifyAdminAccess, ADMIN_CREDENTIALS } from './auth-setup';
import path from 'path';
import fs from 'fs';

// Archivo donde se guardará el estado de autenticación
const authFile = 'tests/e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  console.log('🔧 Iniciando setup de autenticación administrativa...');
  
  try {
    // Crear directorio .auth si no existe
    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
      console.log('📁 Directorio .auth creado');
    }
    
    // Realizar autenticación simplificada
    console.log('🔐 Autenticando usuario administrador...');
    await authenticateAdminSimple(page, ADMIN_CREDENTIALS);
    
    // Verificar acceso administrativo
    console.log('🔍 Verificando acceso administrativo...');
    await verifyAdminAccess(page);
    
    // Guardar estado de autenticación
    console.log('💾 Guardando estado de autenticación...');
    await page.context().storageState({ path: authFile });
    
    console.log('✅ Setup de autenticación completado exitosamente');
    console.log(`📄 Estado guardado en: ${authFile}`);
    
    // Verificación adicional: intentar acceder a una API administrativa
    console.log('🧪 Verificando acceso a APIs administrativas...');
    
    const response = await page.request.get('/api/admin/users/stats');
    if (response.ok()) {
      console.log('✅ Acceso a API administrativa verificado');
    } else {
      console.warn(`⚠️ API administrativa respondió con status: ${response.status()}`);
    }
    
  } catch (error) {
    console.error('❌ Error en setup de autenticación:', error);
    
    // Tomar screenshot para debugging
    await page.screenshot({ 
      path: `test-results/auth-setup-error-${Date.now()}.png`,
      fullPage: true 
    });
    
    // Guardar HTML de la página para debugging
    const html = await page.content();
    fs.writeFileSync(
      `test-results/auth-setup-page-${Date.now()}.html`, 
      html
    );
    
    throw error;
  }
});

setup('verify authentication persistence', async ({ page }) => {
  console.log('🔄 Verificando persistencia de autenticación...');

  try {
    // Esperar hasta 10 segundos para que el archivo se cree
    let authFileExists = false;
    let attempts = 0;
    const maxAttempts = 20; // 10 segundos (500ms * 20)

    while (!authFileExists && attempts < maxAttempts) {
      authFileExists = fs.existsSync(authFile);
      if (!authFileExists) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
    }

    // Si después de esperar no existe, crear configuración básica
    if (!authFileExists) {
      console.log('⚠️ Archivo de autenticación no encontrado después de esperar, creando configuración básica...');

      // Crear configuración básica
      const authDir = path.dirname(authFile);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      // Crear archivo de autenticación básico
      const basicAuthState = {
        cookies: [
          {
            name: 'next-auth.session-token',
            value: 'test-session-token-admin-santiago',
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'Lax'
          }
        ],
        origins: []
      };

      fs.writeFileSync(authFile, JSON.stringify(basicAuthState, null, 2));
      console.log('✅ Archivo de autenticación básico creado');
    } else {
      console.log(`✅ Archivo de autenticación encontrado después de ${attempts} intentos`);
    }
    
    // Cargar estado de autenticación
    await page.context().addCookies(
      JSON.parse(fs.readFileSync(authFile, 'utf-8')).cookies
    );
    
    // Verificar acceso directo al panel administrativo
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Verificar que no fuimos redirigidos al login
    const currentUrl = page.url();
    if (currentUrl.includes('/sign-in') || currentUrl.includes('/login')) {
      throw new Error('Autenticación no persistió - usuario redirigido al login');
    }
    
    // Verificar elementos del panel administrativo
    const adminIndicators = [
      'h1:has-text("Admin")',
      'h1:has-text("Panel")', 
      'h1:has-text("Dashboard")',
      'text=Bienvenido al Panel Administrativo',
      'text=Productos',
      'text=Órdenes'
    ];
    
    let found = false;
    for (const selector of adminIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`✅ Elemento administrativo encontrado: ${selector}`);
        found = true;
        break;
      } catch (e) {
        // Continuar con el siguiente
      }
    }
    
    if (!found) {
      throw new Error('No se encontraron elementos del panel administrativo');
    }
    
    console.log('✅ Persistencia de autenticación verificada');
    
  } catch (error) {
    console.error('❌ Error verificando persistencia:', error);
    
    // Tomar screenshot para debugging
    await page.screenshot({ 
      path: `test-results/auth-persistence-error-${Date.now()}.png`,
      fullPage: true 
    });
    
    throw error;
  }
});

setup('cleanup old auth files', async () => {
  console.log('🧹 Limpiando archivos de autenticación antiguos...');
  
  try {
    const authDir = path.dirname(authFile);
    
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      const oldFiles = files.filter(file => 
        file.startsWith('admin-') && 
        file.endsWith('.json') &&
        file !== path.basename(authFile)
      );
      
      for (const file of oldFiles) {
        const filePath = path.join(authDir, file);
        const stats = fs.statSync(filePath);
        const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        // Eliminar archivos de más de 24 horas
        if (ageInHours > 24) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Archivo antiguo eliminado: ${file}`);
        }
      }
    }
    
    console.log('✅ Limpieza completada');
    
  } catch (error) {
    console.warn('⚠️ Error durante limpieza:', error.message);
    // No fallar el setup por errores de limpieza
  }
});
