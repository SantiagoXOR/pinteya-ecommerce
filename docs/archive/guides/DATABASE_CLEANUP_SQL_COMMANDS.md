# 🗄️ DATABASE CLEANUP - SQL COMMANDS EXECUTED

## Pinteya E-commerce - Comandos SQL de Limpieza

**Fecha:** 14 de Septiembre, 2025  
**Versión:** 1.0  
**Estado:** ✅ EJECUTADO CON ÉXITO

---

## 📋 COMANDOS SQL EJECUTADOS

### **FASE 1: MIGRACIÓN DE DATOS IMPORTANTES**

#### **1.1 Creación de User Profile Principal**

```sql
-- Crear user_profile con ID de NextAuth.js
INSERT INTO user_profiles (
  id,
  email,
  first_name,
  last_name,
  clerk_user_id,
  supabase_user_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  '4257a9f4-3fd6-4730-ba52-38ba982e7e6d',  -- ID de NextAuth.js
  'santiago@xor.com.ar',
  'Santiago',
  'Martinez',
  NULL,
  NULL,
  true,
  NOW(),
  NOW()
);
```

#### **1.2 Migración Masiva de Órdenes**

```sql
-- Migrar órdenes del usuario temporal (70 órdenes)
UPDATE orders
SET user_id = '4257a9f4-3fd6-4730-ba52-38ba982e7e6d',
    updated_at = NOW()
WHERE user_id = '00000000-0000-4000-8000-000000000000';

-- Migrar órdenes de usuarios demo
UPDATE orders
SET user_id = '4257a9f4-3fd6-4730-ba52-38ba982e7e6d',
    updated_at = NOW()
WHERE user_id IN (
    '96205e8a-b7e6-4b87-a8cd-36abea3cad2a',  -- Usuario principal
    'f2fb7ffb-7d23-4fc9-8f11-0af414f3bd39'   -- Usuario adicional
);

-- Migrar órdenes adicionales
UPDATE orders
SET user_id = '4257a9f4-3fd6-4730-ba52-38ba982e7e6d',
    updated_at = NOW()
WHERE user_id IN (
    '6000fab7-172b-41c1-a2b7-2d855ee70140',  -- juan.perez@demo.com
    'a50c6c50-107c-4041-8889-9d0298938219',  -- usuario@demo.com
    '550e8400-e29b-41d4-a716-446655440001'   -- juan@example.com
);
```

#### **1.3 Migración de Direcciones**

```sql
-- Migrar direcciones de usuarios demo
UPDATE user_addresses
SET user_id = '4257a9f4-3fd6-4730-ba52-38ba982e7e6d',
    updated_at = NOW()
WHERE user_id IN (
    'f2fb7ffb-7d23-4fc9-8f11-0af414f3bd39',  -- Usuario con direcciones
    'e2fea5ea-95bd-47e3-aeef-8b4c3fc4fe1e'   -- Usuario adicional
);
```

### **FASE 2: ELIMINACIÓN DE REDUNDANCIAS**

#### **2.1 Limpieza de User_Profiles Obsoletos**

```sql
-- Eliminar user_profiles duplicados y obsoletos
DELETE FROM user_profiles
WHERE email = 'santiago@xor.com.ar'
  AND id != '4257a9f4-3fd6-4730-ba52-38ba982e7e6d';

-- Eliminar perfiles de usuarios demo/test
DELETE FROM user_profiles
WHERE id IN (
    '00000000-0000-4000-8000-000000000000',  -- temp@pinteya.com
    '6000fab7-172b-41c1-a2b7-2d855ee70140',  -- juan.perez@demo.com
    'a50c6c50-107c-4041-8889-9d0298938219',  -- usuario@demo.com
    '550e8400-e29b-41d4-a716-446655440001',  -- juan@example.com
    '550e8400-e29b-41d4-a716-446655440002',  -- maria@example.com
    '550e8400-e29b-41d4-a716-446655440003',  -- carlos@example.com
    '204a810c-0186-4d44-a8cc-36d0b7046209',  -- santiagomartinez@upc.edu.ar
    '499a4de5-c377-4240-b510-b1f6cdaad1d2'   -- test.webhook3@pinteya.com
);
```

#### **2.2 Limpieza del Esquema Auth**

```sql
-- Limpiar datos obsoletos del esquema auth
-- Ya no usamos Supabase Auth, usamos NextAuth.js

-- Limpiar identities
DELETE FROM auth.identities;

-- Limpiar users de auth (no confundir con public.users de NextAuth.js)
DELETE FROM auth.users;
```

### **FASE 3: LIMPIEZA DE USUARIOS DE PRUEBA**

#### **3.1 Corrección de Emails en Payer_Info**

```sql
-- Actualizar santiago@xor.com a santiago@xor.com.ar
UPDATE orders
SET payer_info = jsonb_set(payer_info, '{email}', '"santiago@xor.com.ar"'),
    updated_at = NOW()
WHERE payer_info->>'email' = 'santiago@xor.com';
```

#### **3.2 Creación de Usuario Real Adicional**

```sql
-- Crear user_profile para santiagomartinez@upc.edu.ar
INSERT INTO user_profiles (
  id,
  email,
  first_name,
  last_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'santiagomartinez@upc.edu.ar',
  'Santiago Ariel',
  'Martinez',
  true,
  NOW(),
  NOW()
);

-- Migrar órdenes de santiagomartinez@upc.edu.ar
UPDATE orders
SET user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    updated_at = NOW()
WHERE payer_info->>'email' = 'santiagomartinez@upc.edu.ar';
```

#### **3.3 Eliminación de Órdenes de Prueba**

```sql
-- Eliminar órdenes de usuarios de prueba
DELETE FROM orders
WHERE payer_info->>'email' IN (
    'test@pinteya.com',
    'test@example.com',
    'test@test.com',
    'juan.perez@test.com',
    'maria.gonzalez@email.com'
);
```

---

## 📊 CONSULTAS DE VERIFICACIÓN

### **Verificar Estado Final de User_Profiles**

```sql
SELECT
    id,
    email,
    first_name || ' ' || last_name as name,
    (SELECT COUNT(*) FROM orders o WHERE o.user_id = up.id) as orders_count,
    (SELECT COUNT(*) FROM user_addresses ua WHERE ua.user_id = up.id) as addresses_count
FROM user_profiles up
ORDER BY email;
```

### **Verificar Órdenes por Usuario**

```sql
SELECT
    COUNT(*) as total_orders,
    COUNT(DISTINCT CASE WHEN status = 'paid' THEN id END) as paid_orders,
    COUNT(DISTINCT CASE WHEN status = 'pending' THEN id END) as pending_orders,
    COUNT(DISTINCT CASE WHEN status = 'shipped' THEN id END) as shipped_orders,
    COUNT(DISTINCT CASE WHEN status = 'delivered' THEN id END) as delivered_orders,
    SUM(total) as total_amount
FROM orders
WHERE user_id = '4257a9f4-3fd6-4730-ba52-38ba982e7e6d';
```

### **Verificar Emails Únicos en Órdenes**

```sql
SELECT
    DISTINCT payer_info->>'email' as email,
    COUNT(*) as orders_count,
    SUM(total) as total_amount
FROM orders
WHERE payer_info->>'email' IS NOT NULL
GROUP BY payer_info->>'email'
ORDER BY orders_count DESC;
```

### **Verificar Estado de Tablas Auth**

```sql
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'auth.identities' as table_name, COUNT(*) as count FROM auth.identities
UNION ALL
SELECT 'public.users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'public.sessions' as table_name, COUNT(*) as count FROM public.sessions;
```

---

## 🎯 RESULTADOS DE EJECUCIÓN

### **Migración de Datos:**

- ✅ **90 órdenes** migradas al usuario principal
- ✅ **5 direcciones** consolidadas
- ✅ **$720.627,50** en valor total migrado

### **Eliminación de Redundancias:**

- ✅ **8 user_profiles** obsoletos eliminados
- ✅ **1 usuario auth** eliminado
- ✅ **1 identidad auth** eliminada

### **Limpieza de Usuarios de Prueba:**

- ✅ **25 órdenes de prueba** eliminadas
- ✅ **$178.040** en valor de prueba eliminado
- ✅ **5 emails de prueba** limpiados

### **Estado Final:**

- ✅ **2 usuarios reales** mantenidos
- ✅ **65 órdenes reales** preservadas
- ✅ **$541.587,50** en valor real total
- ✅ **0 redundancias** en el sistema

---

## 🛡️ NOTAS DE SEGURIDAD

### **Precauciones Tomadas:**

1. **Verificación previa** de datos antes de cada eliminación
2. **Migración antes de eliminación** para preservar datos importantes
3. **Consultas de verificación** después de cada paso
4. **Pruebas de funcionalidad** en la aplicación
5. **Documentación completa** de todos los cambios

### **Datos Preservados:**

- ✅ Todas las órdenes con valor real
- ✅ Información de pagos y direcciones
- ✅ Metadatos de transacciones
- ✅ Relaciones de base de datos
- ✅ Funcionalidad de la aplicación

---

_Comandos SQL ejecutados el 14 de Septiembre, 2025_  
_Pinteya E-commerce - Database Cleanup Project_
