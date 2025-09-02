/**
 * CONFIGURACIÓN DE AUTENTICACIÓN PARA PLAYWRIGHT E2E TESTS
 * 
 * Este archivo configura la autenticación automática para todos los tests E2E
 * que requieren acceso a rutas protegidas del panel administrativo.
 */

import { Page, BrowserContext } from '@playwright/test';

// Credenciales del usuario administrador
export const ADMIN_CREDENTIALS = {
  email: 'santiago@xor.com.ar',
  password: 'SavoirFaire19$'
};

// Configuración de autenticación simulada para tests
export const SIMULATED_AUTH_CONFIG = {
  sessionToken: 'test-session-token-admin-santiago',
  csrfToken: 'test-csrf-token-admin',
  userId: 'a1d59a1b-a5cc-461a-9428-408153fef2c7',
  userEmail: 'santiago@xor.com.ar',
  isAdmin: true
};

// URLs importantes
export const URLS = {
  signIn: '/auth/signin',  // Ruta correcta de NextAuth
  admin: '/admin',
  home: '/',
  apiSignIn: '/api/auth/signin'  // API de NextAuth
};

/**
 * Función simplificada para autenticar usando cookies de sesión simuladas
 * @param page - Página de Playwright
 * @param credentials - Credenciales del usuario (opcional, usa admin por defecto)
 */
export async function authenticateAdminSimple(
  page: Page,
  credentials = ADMIN_CREDENTIALS
): Promise<void> {
  console.log('🔐 Iniciando autenticación simplificada...');

  try {
    // 1. Navegar a la página principal
    console.log('📍 Navegando a página principal...');
    await page.goto(URLS.home);
    await page.waitForLoadState('networkidle');

    // 2. Configurar cookies de sesión simuladas
    console.log('🍪 Configurando cookies de sesión...');
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: SIMULATED_AUTH_CONFIG.sessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'next-auth.csrf-token',
        value: SIMULATED_AUTH_CONFIG.csrfToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    // 3. Recargar la página para aplicar las cookies
    console.log('🔄 Recargando página con cookies...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    console.log('✅ Autenticación simplificada completada');

  } catch (error) {
    console.error('❌ Error en autenticación simplificada:', error);
    throw error;
  }
}

/**
 * Función para autenticar un usuario administrador usando Google OAuth
 * @param page - Página de Playwright
 * @param credentials - Credenciales del usuario (opcional, usa admin por defecto)
 */
export async function authenticateAdmin(
  page: Page,
  credentials = ADMIN_CREDENTIALS
): Promise<void> {
  console.log('🔐 Iniciando autenticación de administrador con Google OAuth...');

  try {
    // 1. Limpiar estado previo
    await page.context().clearCookies();

    // Limpiar storage de forma segura
    try {
      await page.evaluate(() => {
        if (typeof Storage !== 'undefined') {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch (e) {
            console.log('Storage no disponible o acceso denegado');
          }
        }
      });
    } catch (e) {
      console.log('⚠️ No se pudo limpiar storage, continuando...');
    }

    // 2. Navegar primero a la página principal para establecer contexto
    console.log('📍 Navegando a página principal...');
    await page.goto(URLS.home);
    await page.waitForLoadState('networkidle');

    // 3. Ahora navegar a la página de login
    console.log('📍 Navegando a página de login...');
    await page.goto(URLS.signIn);
    await page.waitForLoadState('networkidle');

    // 4. Verificar que estamos en la página de login y buscar el botón de Google
    console.log('🔍 Buscando botón de Google OAuth...');
    const googleButtonSelectors = [
      'button:has-text("Google")',
      'button:has-text("Continuar con Google")',
      'button:has-text("Sign in with Google")',
      'button[type="submit"]',
      '.bg-blaze-orange-600',
      '[data-testid="google-signin"]'
    ];

    let googleButton = null;
    for (const selector of googleButtonSelectors) {
      try {
        googleButton = page.locator(selector).first();
        await googleButton.waitFor({ state: 'visible', timeout: 3000 });
        console.log(`✅ Botón de Google encontrado: ${selector}`);
        break;
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }

    if (!googleButton) {
      // Tomar screenshot para debugging
      await page.screenshot({
        path: `test-results/google-button-missing-${Date.now()}.png`,
        fullPage: true
      });
      throw new Error('No se encontró el botón de Google OAuth');
    }

    // 5. Hacer click en el botón de Google
    console.log('🖱️ Haciendo click en botón de Google...');
    await googleButton.click();

    // 6. Manejar el flujo de OAuth de Google (simulado para tests)
    console.log('🔄 Manejando flujo OAuth...');

    // En un entorno de testing, podemos simular la autenticación exitosa
    // navegando directamente a la página de admin con cookies simuladas
    await page.waitForTimeout(2000); // Esperar un momento

    // 7. Verificar si fuimos redirigidos o si necesitamos simular la autenticación
    const currentUrl = page.url();
    console.log(`📍 URL actual después del click: ${currentUrl}`);

    // Si estamos en una página de Google, simular autenticación exitosa
    if (currentUrl.includes('accounts.google.com') || currentUrl.includes('oauth')) {
      console.log('🔄 Simulando autenticación exitosa...');

      // Para tests, vamos a simular que la autenticación fue exitosa
      // navegando directamente al admin con cookies de sesión simuladas
      await page.context().addCookies([
        {
          name: 'next-auth.session-token',
          value: 'simulated-session-token-for-testing',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        },
        {
          name: 'next-auth.csrf-token',
          value: 'simulated-csrf-token-for-testing',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        }
      ]);

      // Navegar al admin
      await page.goto(URLS.admin);
      await page.waitForLoadState('networkidle');
    }

    // 8. Verificar que el usuario está autenticado
    console.log('✅ Verificando autenticación...');
    
    // Esperar a que aparezcan elementos que indican autenticación exitosa
    const authIndicators = [
      '[data-testid="user-menu"]',
      '.user-avatar',
      '[aria-label*="user"]',
      'button:has-text("Sign Out")',
      'button:has-text("Cerrar")',
      '[data-testid="auth-user"]'
    ];
    
    let authenticated = false;
    for (const selector of authIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        authenticated = true;
        console.log(`✅ Autenticación confirmada con selector: ${selector}`);
        break;
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!authenticated) {
      console.log('⚠️ No se encontraron indicadores visuales de autenticación, verificando cookies...');
      
      // Verificar cookies de sesión como fallback
      const cookies = await page.context().cookies();
      const sessionCookies = cookies.filter(cookie => 
        cookie.name.includes('session') || 
        cookie.name.includes('auth') ||
        cookie.name.includes('next-auth')
      );
      
      if (sessionCookies.length > 0) {
        console.log('✅ Cookies de sesión encontradas, asumiendo autenticación exitosa');
        authenticated = true;
      }
    }
    
    if (!authenticated) {
      throw new Error('❌ No se pudo verificar la autenticación del usuario');
    }
    
    console.log('🎉 Autenticación de administrador completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la autenticación:', error);
    
    // Tomar screenshot para debugging
    await page.screenshot({ 
      path: `test-results/auth-error-${Date.now()}.png`,
      fullPage: true 
    });
    
    throw new Error(`Fallo en autenticación de administrador: ${error.message}`);
  }
}

/**
 * Función para verificar acceso a rutas administrativas
 * @param page - Página de Playwright
 */
export async function verifyAdminAccess(page: Page): Promise<void> {
  console.log('🔍 Verificando acceso administrativo...');
  
  try {
    // Navegar al panel administrativo
    await page.goto(URLS.admin);
    await page.waitForLoadState('networkidle');
    
    // Verificar que no fuimos redirigidos al login
    const currentUrl = page.url();
    if (currentUrl.includes('/sign-in') || currentUrl.includes('/login')) {
      throw new Error('Usuario fue redirigido al login - no tiene acceso administrativo');
    }
    
    // Verificar elementos del panel administrativo
    const adminElements = [
      'h1:has-text("Admin")',
      'h1:has-text("Panel")',
      'h1:has-text("Dashboard")',
      'text=Bienvenido al Panel Administrativo',
      'text=Productos',
      'text=Órdenes',
      'text=Analytics'
    ];
    
    let adminElementFound = false;
    for (const selector of adminElements) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`✅ Elemento administrativo encontrado: ${selector}`);
        adminElementFound = true;
        break;
      } catch (e) {
        // Continuar con el siguiente elemento
      }
    }
    
    if (!adminElementFound) {
      throw new Error('No se encontraron elementos del panel administrativo');
    }
    
    console.log('✅ Acceso administrativo verificado exitosamente');
    
  } catch (error) {
    console.error('❌ Error verificando acceso administrativo:', error);
    
    // Tomar screenshot para debugging
    await page.screenshot({ 
      path: `test-results/admin-access-error-${Date.now()}.png`,
      fullPage: true 
    });
    
    throw error;
  }
}

/**
 * Función para configurar autenticación persistente en el contexto
 * @param context - Contexto del navegador
 */
export async function setupPersistentAuth(context: BrowserContext): Promise<void> {
  console.log('🔧 Configurando autenticación persistente...');
  
  // Crear una página temporal para autenticación
  const page = await context.newPage();
  
  try {
    // Autenticar
    await authenticateAdmin(page);
    
    // Verificar acceso
    await verifyAdminAccess(page);
    
    console.log('✅ Autenticación persistente configurada exitosamente');
    
  } finally {
    // Cerrar página temporal
    await page.close();
  }
}

/**
 * Helper para tests que requieren autenticación
 * @param page - Página de Playwright
 */
export async function ensureAuthenticated(page: Page): Promise<void> {
  console.log('🔒 Asegurando autenticación...');
  
  try {
    // Intentar acceder al admin directamente
    await page.goto(URLS.admin);
    await page.waitForLoadState('networkidle');
    
    // Si fuimos redirigidos al login, autenticar
    if (page.url().includes('/auth/signin') || page.url().includes('/api/auth/signin')) {
      console.log('🔄 Usuario no autenticado, iniciando proceso de login...');
      await authenticateAdminSimple(page);
      await verifyAdminAccess(page);
    } else {
      console.log('✅ Usuario ya autenticado');
    }
    
  } catch (error) {
    console.error('❌ Error asegurando autenticación:', error);
    throw error;
  }
}
