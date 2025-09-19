#!/usr/bin/env node

/**
 * Script para verificar la estructura detallada de las tablas de Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifySupabaseStructure() {
  console.log('🏗️  VERIFICACIÓN ESTRUCTURA DETALLADA - SUPABASE');
  console.log('=' .repeat(55));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno faltantes');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Verificar estructura de tablas principales
    const mainTables = ['products', 'categories', 'orders', 'order_items', 'user_profiles'];
    
    for (const tableName of mainTables) {
      console.log(`\n📋 Estructura de tabla: ${tableName}`);
      console.log('-'.repeat(40));
      
      // Obtener muestra de datos para ver estructura
      const { data: sample, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        continue;
      }
      
      if (sample && sample.length > 0) {
        const fields = Object.keys(sample[0]);
        console.log(`📊 Campos (${fields.length}):`);
        
        fields.forEach(field => {
          const value = sample[0][field];
          const type = value === null ? 'null' : typeof value;
          const preview = value === null ? 'NULL' : 
                         type === 'string' ? `"${value.toString().substring(0, 30)}${value.toString().length > 30 ? '...' : ''}"` :
                         type === 'object' ? JSON.stringify(value).substring(0, 50) + '...' :
                         value.toString();
          
          console.log(`  • ${field}: ${type} = ${preview}`);
        });
      } else {
        console.log('⚠️  Tabla vacía, no se puede determinar estructura');
      }
      
      // Contar registros
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      console.log(`📈 Total registros: ${count || 0}`);
    }
    
    // Verificar relaciones entre tablas
    console.log('\n🔗 VERIFICACIÓN DE RELACIONES');
    console.log('=' .repeat(35));
    
    // Products -> Categories
    console.log('\n📊 Relación Products -> Categories:');
    const { data: productCategories, error: pcError } = await supabase
      .from('products')
      .select(`
        id, name, category_id,
        categories (id, name)
      `)
      .limit(5);
    
    if (pcError) {
      console.log(`❌ Error en relación: ${pcError.message}`);
    } else {
      console.log(`✅ Relación funcional - ${productCategories.length} productos con categorías`);
      productCategories.forEach(product => {
        const categoryName = product.categories?.name || 'Sin categoría';
        console.log(`  • ${product.name} -> ${categoryName}`);
      });
    }
    
    // Orders -> Order Items
    console.log('\n📊 Relación Orders -> Order Items:');
    const { data: orderItems, error: oiError } = await supabase
      .from('orders')
      .select(`
        id, total, status,
        order_items (id, quantity, price, product_id)
      `)
      .limit(3);
    
    if (oiError) {
      console.log(`❌ Error en relación: ${oiError.message}`);
    } else {
      console.log(`✅ Relación funcional - ${orderItems.length} órdenes con items`);
      orderItems.forEach(order => {
        const itemCount = order.order_items?.length || 0;
        console.log(`  • Orden ${order.id}: ${itemCount} items, Total: $${order.total}`);
      });
    }
    
    // Verificar índices y constraints
    console.log('\n🔍 VERIFICACIÓN DE CONSTRAINTS');
    console.log('=' .repeat(35));
    
    // Verificar foreign keys
    const foreignKeyTests = [
      {
        table: 'products',
        field: 'category_id',
        reference: 'categories',
        description: 'Products.category_id -> Categories.id'
      },
      {
        table: 'order_items',
        field: 'order_id',
        reference: 'orders',
        description: 'Order_items.order_id -> Orders.id'
      },
      {
        table: 'order_items',
        field: 'product_id',
        reference: 'products',
        description: 'Order_items.product_id -> Products.id'
      }
    ];
    
    for (const fk of foreignKeyTests) {
      try {
        const { data, error } = await supabase
          .from(fk.table)
          .select(`${fk.field}`)
          .not(fk.field, 'is', null)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${fk.description}: Error - ${error.message}`);
        } else {
          console.log(`✅ ${fk.description}: Funcional`);
        }
      } catch (err) {
        console.log(`❌ ${fk.description}: Error de acceso`);
      }
    }
    
    // Verificar datos de prueba
    console.log('\n📊 DATOS DE PRUEBA');
    console.log('=' .repeat(20));
    
    const dataCounts = {
      'Productos': await getCount(supabase, 'products'),
      'Categorías': await getCount(supabase, 'categories'),
      'Órdenes': await getCount(supabase, 'orders'),
      'Items de Orden': await getCount(supabase, 'order_items'),
      'Perfiles de Usuario': await getCount(supabase, 'user_profiles'),
      'Items en Carrito': await getCount(supabase, 'cart_items'),
      'Reseñas': await getCount(supabase, 'reviews')
    };
    
    Object.entries(dataCounts).forEach(([name, count]) => {
      const status = count > 0 ? '✅' : '⚠️ ';
      console.log(`${status} ${name}: ${count} registros`);
    });
    
    console.log('\n' + '='.repeat(55));
    console.log('✅ Verificación de estructura completada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

async function getCount(supabase, tableName) {
  try {
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    return count || 0;
  } catch {
    return 0;
  }
}

// Ejecutar verificación
verifySupabaseStructure().catch(console.error);