#!/usr/bin/env node

/**
 * Script para verificar la configuración de Supabase para webhooks
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifySupabaseConfig() {
  console.log('🔍 Verificando configuración de Supabase...\n');
  
  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📋 Variables de entorno:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Configurada' : '❌ Faltante');
  console.log();
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.log('❌ Faltan variables de entorno requeridas');
    return;
  }
  
  // Crear cliente de Supabase
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    // Verificar conexión
    console.log('🔗 Verificando conexión a Supabase...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Error de conexión:', healthError.message);
      return;
    }
    
    console.log('✅ Conexión exitosa\n');
    
    // Verificar tabla user_profiles
    console.log('📊 Verificando estructura de user_profiles...');
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: 'user_profiles'
    });
    
    if (columnsError) {
      console.log('⚠️  No se pudo obtener estructura (usando query alternativa)');
    }
    
    // Verificar rol customer
    console.log('👤 Verificando rol customer...');
    const { data: customerRole, error: roleError } = await supabase
      .from('user_roles')
      .select('id, role_name')
      .eq('role_name', 'customer')
      .single();
    
    if (roleError) {
      console.log('❌ Error obteniendo rol customer:', roleError.message);
      return;
    }
    
    console.log('✅ Rol customer encontrado:', customerRole.id);
    console.log();
    
    // Verificar políticas RLS
    console.log('🔒 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase.rpc('get_table_policies', {
      table_name: 'user_profiles'
    });
    
    if (policiesError) {
      console.log('⚠️  No se pudieron obtener políticas RLS');
    }
    
    // Probar inserción de prueba
    console.log('🧪 Probando inserción de prueba...');
    const testUser = {
      clerk_user_id: 'test_' + Date.now(),
      email: 'test.config@pinteya.com',
      first_name: 'Test',
      last_name: 'Config',
      role_id: customerRole.id,
      is_active: true,
      metadata: { test: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('user_profiles')
      .insert(testUser)
      .select();
    
    if (insertError) {
      console.log('❌ Error en inserción de prueba:', insertError.message);
      console.log('   Detalles:', insertError.details);
      console.log('   Hint:', insertError.hint);
      console.log('   Code:', insertError.code);
    } else {
      console.log('✅ Inserción de prueba exitosa');
      console.log('   ID creado:', insertResult[0]?.id);
      
      // Limpiar datos de prueba
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', insertResult[0].id);
      
      console.log('🧹 Datos de prueba eliminados');
    }
    
    console.log('\n🎉 Verificación completada');
    
  } catch (error) {
    console.error('💥 Error durante verificación:', error.message);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  verifySupabaseConfig();
}

module.exports = { verifySupabaseConfig };
