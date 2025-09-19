#!/usr/bin/env node

// =====================================================
// SCRIPT: SEED SIMPLE PARA TESTING
// Descripción: Crear datos mínimos para que las pruebas funcionen
// =====================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingData() {
  console.log('🔍 Verificando datos existentes...');
  
  // Verificar usuarios
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(5);
  
  console.log(`👥 Usuarios existentes: ${users?.length || 0}`);
  if (users?.length > 0) {
    console.log('   Primer usuario:', users[0].email);
  }
  
  // Verificar órdenes
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(5);
  
  console.log(`📋 Órdenes existentes: ${orders?.length || 0}`);
  if (orders?.length > 0) {
    console.log('   Primera orden ID:', orders[0].id);
    console.log('   Estado:', orders[0].status);
    console.log('   Total:', orders[0].total);
  }
  
  // Verificar productos
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .limit(5);
  
  console.log(`📦 Productos existentes: ${products?.length || 0}`);
  if (products?.length > 0) {
    console.log('   Primer producto:', products[0].name);
  }
  
  return { users, orders, products };
}

async function createTestOrdersFromExistingData() {
  console.log('🔄 Creando órdenes de prueba con datos existentes...');
  
  // Obtener un usuario existente
  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
  
  if (!users || users.length === 0) {
    console.log('❌ No hay usuarios existentes. Creando uno...');
    
    // Crear un usuario básico
    const { data: newUser, error: userError } = await supabase
      .from('user_profiles')
      .insert({
        clerk_user_id: 'test_user_' + Date.now(),
        email: 'test@pinteya.com',
        first_name: 'Usuario',
        last_name: 'Prueba',
        role_id: 'customer',
        is_active: true
      })
      .select()
      .single();
    
    if (userError) {
      console.log('❌ Error creando usuario:', userError);
      return;
    }
    
    console.log('✅ Usuario creado:', newUser.email);
    users.push(newUser);
  }
  
  const userId = users[0].id;
  console.log('👤 Usando usuario:', users[0].email);
  
  // Crear órdenes de prueba simples
  const testOrders = [
    {
      user_id: userId,
      status: 'pending',
      total: 15750.00,
      payment_id: 'test_payment_1',
      shipping_address: {
        street_name: 'Av. Corrientes',
        street_number: '1234',
        city_name: 'Buenos Aires',
        state_name: 'CABA',
        zip_code: '1043',
        country: 'Argentina'
      },
      external_reference: 'TEST-ORD-001'
    },
    {
      user_id: userId,
      status: 'confirmed',
      total: 8900.00,
      payment_id: 'test_payment_2',
      shipping_address: {
        street_name: 'Calle Florida',
        street_number: '567',
        city_name: 'La Plata',
        state_name: 'Buenos Aires',
        zip_code: '1900',
        country: 'Argentina'
      },
      external_reference: 'TEST-ORD-002'
    },
    {
      user_id: userId,
      status: 'shipped',
      total: 12300.00,
      payment_id: 'test_payment_3',
      shipping_address: {
        street_name: 'Av. Santa Fe',
        street_number: '890',
        city_name: 'Córdoba',
        state_name: 'Córdoba',
        zip_code: '5000',
        country: 'Argentina'
      },
      external_reference: 'TEST-ORD-003'
    }
  ];
  
  for (const order of testOrders) {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    
    if (error) {
      console.log(`❌ Error creando orden ${order.external_reference}:`, error.message);
    } else {
      console.log(`✅ Orden creada: ${order.external_reference} (ID: ${data.id})`);
    }
  }
}

async function createTestOrderItems() {
  console.log('🔄 Creando items de órdenes...');
  
  // Obtener órdenes de prueba
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .like('external_reference', 'TEST-ORD-%')
    .limit(3);
  
  // Obtener productos existentes
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .limit(5);
  
  if (!orders || orders.length === 0) {
    console.log('❌ No hay órdenes de prueba');
    return;
  }
  
  if (!products || products.length === 0) {
    console.log('❌ No hay productos existentes');
    return;
  }
  
  // Crear items para cada orden
  for (const order of orders) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    
    const { data, error } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: randomProduct.id,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: randomProduct.price
      })
      .select()
      .single();
    
    if (error) {
      console.log(`❌ Error creando item para orden ${order.id}:`, error.message);
    } else {
      console.log(`✅ Item creado para orden ${order.external_reference}`);
    }
  }
}

async function cleanTestData() {
  console.log('🧹 Limpiando datos de prueba...');
  
  // Eliminar órdenes de prueba
  await supabase.from('orders').delete().like('external_reference', 'TEST-ORD-%');
  
  // Eliminar usuarios de prueba
  await supabase.from('user_profiles').delete().like('email', '%test@pinteya.com%');
  
  console.log('✅ Datos de prueba limpiados');
}

async function main() {
  try {
    console.log('🚀 INICIANDO SEED SIMPLE');
    console.log('========================');
    
    const command = process.argv[2];
    
    if (command === 'clean') {
      await cleanTestData();
      return;
    }
    
    if (command === 'check') {
      await checkExistingData();
      return;
    }
    
    // Verificar datos existentes
    const existing = await checkExistingData();
    
    // Crear órdenes de prueba
    await createTestOrdersFromExistingData();
    
    // Crear items de órdenes
    await createTestOrderItems();
    
    console.log('========================');
    console.log('✅ SEED SIMPLE COMPLETADO');
    
    // Verificar resultado final
    await checkExistingData();
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
