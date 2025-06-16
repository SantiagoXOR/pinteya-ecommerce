// ===================================
// PINTEYA E-COMMERCE - TEST DE CONEXIÓN SUPABASE
// ===================================

import { supabase, supabaseAdmin } from './supabase';

/**
 * Prueba la conexión básica a Supabase
 */
export async function testSupabaseConnection() {
  console.log('🔍 Probando conexión a Supabase...');
  
  try {
    if (!supabase) {
      throw new Error('Cliente de Supabase no disponible');
    }

    // Test 1: Conexión básica
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }

    console.log('✅ Conexión a Supabase exitosa');
    return true;

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

/**
 * Prueba las operaciones CRUD básicas
 */
export async function testCRUDOperations() {
  console.log('🔍 Probando operaciones CRUD...');
  
  try {
    if (!supabase) {
      throw new Error('Cliente de Supabase no disponible');
    }

    // Test 1: Leer categorías
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (categoriesError) {
      console.error('❌ Error leyendo categorías:', categoriesError.message);
      return false;
    }

    console.log('✅ Lectura de categorías exitosa:', categories?.length || 0, 'encontradas');

    // Test 2: Leer productos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ Error leyendo productos:', productsError.message);
      return false;
    }

    console.log('✅ Lectura de productos exitosa:', products?.length || 0, 'encontrados');

    return true;

  } catch (error) {
    console.error('❌ Error en operaciones CRUD:', error);
    return false;
  }
}

/**
 * Verifica que las tablas existan
 */
export async function verifyTables() {
  console.log('🔍 Verificando estructura de tablas...');
  
  const tables = ['users', 'categories', 'products', 'orders', 'order_items'];
  const results: { [key: string]: boolean } = {};

  if (!supabase) {
    console.error('❌ Cliente de Supabase no disponible');
    return {};
  }

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ Tabla '${table}' no existe o no es accesible:`, error.message);
        results[table] = false;
      } else {
        console.log(`✅ Tabla '${table}' existe y es accesible`);
        results[table] = true;
      }
    } catch (error) {
      console.error(`❌ Error verificando tabla '${table}':`, error);
      results[table] = false;
    }
  }

  return results;
}

/**
 * Prueba la conexión administrativa
 */
export async function testAdminConnection() {
  console.log('🔍 Probando conexión administrativa...');
  
  if (!supabaseAdmin) {
    console.error('❌ Cliente administrativo no configurado');
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión administrativa:', error.message);
      return false;
    }

    console.log('✅ Conexión administrativa exitosa');
    return true;

  } catch (error) {
    console.error('❌ Error inesperado en conexión administrativa:', error);
    return false;
  }
}

/**
 * Ejecuta todos los tests de conexión
 */
export async function runAllTests() {
  console.log('🚀 Iniciando tests de Supabase...\n');

  const results = {
    connection: await testSupabaseConnection(),
    adminConnection: await testAdminConnection(),
    tables: await verifyTables(),
    crud: await testCRUDOperations(),
  };

  console.log('\n📊 Resumen de tests:');
  console.log('- Conexión básica:', results.connection ? '✅' : '❌');
  console.log('- Conexión admin:', results.adminConnection ? '✅' : '❌');
  console.log('- Operaciones CRUD:', results.crud ? '✅' : '❌');
  console.log('- Tablas:');
  
  Object.entries(results.tables).forEach(([table, success]) => {
    console.log(`  - ${table}:`, success ? '✅' : '❌');
  });

  const allPassed = results.connection && 
                   results.adminConnection && 
                   results.crud && 
                   Object.values(results.tables).every(Boolean);

  console.log('\n🎯 Estado general:', allPassed ? '✅ TODO OK' : '❌ HAY PROBLEMAS');

  return results;
}
