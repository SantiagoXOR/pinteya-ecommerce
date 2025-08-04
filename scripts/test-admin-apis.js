/**
 * Script de testing para validar las APIs administrativas seguras
 * Prueba autenticación, autorización, y funcionalidad básica
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminEmail = 'santiago@xor.com.ar';
const adminPassword = 'SavoirFaire19$';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para hacer requests autenticados
async function authenticatedRequest(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No hay sesión activa');
  }

  const headers = {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
}

// Tests
async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  try {
    // Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (error) {
      console.error('❌ Error en login:', error.message);
      return false;
    }

    if (!data.user) {
      console.error('❌ No se obtuvo usuario después del login');
      return false;
    }

    console.log('✅ Login exitoso:', data.user.email);

    // Verificar rol
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        email,
        user_roles (
          role_name
        )
      `)
      .eq('supabase_user_id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError.message);
      return false;
    }

    if (profile.user_roles?.role_name !== 'admin') {
      console.error('❌ Usuario no tiene rol admin:', profile.user_roles?.role_name);
      return false;
    }

    console.log('✅ Rol admin verificado');
    return true;

  } catch (error) {
    console.error('❌ Error en test de autenticación:', error.message);
    return false;
  }
}

async function testSecureProductsAPI() {
  console.log('📦 Testing Secure Products API...');
  
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.pinteya.com' 
      : 'http://localhost:3000';

    // Test GET products
    console.log('  📋 Testing GET /api/admin/products-secure...');
    
    const response = await authenticatedRequest(
      `${baseUrl}/api/admin/products-secure?page=1&limit=5`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en GET products:', response.status, errorText);
      return false;
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ API retornó error:', data.error);
      return false;
    }

    if (!data.data || !Array.isArray(data.data.products)) {
      console.error('❌ Estructura de respuesta inválida:', data);
      return false;
    }

    console.log('✅ GET products exitoso:', {
      total: data.data.total,
      products: data.data.products.length,
      authenticated: data.meta.authenticated
    });

    return true;

  } catch (error) {
    console.error('❌ Error en test de API products:', error.message);
    return false;
  }
}

async function testMonitoringAPI() {
  console.log('📊 Testing Monitoring API...');
  
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.pinteya.com' 
      : 'http://localhost:3000';

    const response = await authenticatedRequest(
      `${baseUrl}/api/admin/monitoring?timeframe=1h`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en monitoring API:', response.status, errorText);
      return false;
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Monitoring API retornó error:', data.error);
      return false;
    }

    console.log('✅ Monitoring API exitoso:', {
      hasPerformanceData: !!data.data.performance,
      hasAlerts: !!data.data.alerts,
      systemUptime: data.data.system.uptime
    });

    return true;

  } catch (error) {
    console.error('❌ Error en test de monitoring:', error.message);
    return false;
  }
}

async function testRateLimiting() {
  console.log('🚦 Testing Rate Limiting...');
  
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.pinteya.com' 
      : 'http://localhost:3000';

    // Hacer múltiples requests rápidos
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        authenticatedRequest(`${baseUrl}/api/admin/products-secure?page=1&limit=1`)
      );
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.ok).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    console.log('✅ Rate limiting test:', {
      totalRequests: responses.length,
      successful: successCount,
      rateLimited: rateLimitedCount
    });

    return true;

  } catch (error) {
    console.error('❌ Error en test de rate limiting:', error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('🔒 Testing Unauthorized Access...');
  
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.pinteya.com' 
      : 'http://localhost:3000';

    // Logout primero
    await supabase.auth.signOut();

    // Intentar acceso sin autenticación
    const response = await fetch(`${baseUrl}/api/admin/products-secure?page=1&limit=1`);

    if (response.ok) {
      console.error('❌ API permitió acceso sin autenticación');
      return false;
    }

    if (response.status !== 401) {
      console.error('❌ Status code incorrecto para acceso no autorizado:', response.status);
      return false;
    }

    console.log('✅ Acceso no autorizado correctamente bloqueado');
    return true;

  } catch (error) {
    console.error('❌ Error en test de acceso no autorizado:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Iniciando tests de APIs administrativas...\n');

  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Secure Products API', fn: testSecureProductsAPI },
    { name: 'Monitoring API', fn: testMonitoringAPI },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      console.error(`❌ Error en test ${test.name}:`, error.message);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }

  // Resumen
  console.log('\n📋 RESUMEN DE TESTS:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  console.log('='.repeat(50));
  console.log(`📊 Resultado: ${passed}/${total} tests pasaron`);
  
  if (passed === total) {
    console.log('🎉 ¡Todos los tests pasaron! Sistema listo para producción.');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisar antes de migrar a producción.');
  }

  return passed === total;
}

// Ejecutar tests
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando tests:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
