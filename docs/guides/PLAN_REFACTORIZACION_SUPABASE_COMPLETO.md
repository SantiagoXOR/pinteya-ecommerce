# 🔧 PLAN DE REFACTORIZACIÓN EXHAUSTIVA SUPABASE
## Eliminación de Dependencias Legacy Clerk + Optimización Completa

**Fecha**: 13 de Septiembre, 2025  
**Objetivo**: Base de datos limpia, eficiente y alineada con NextAuth  
**Tiempo estimado**: 4-6 horas  
**Riesgo**: MEDIO (con plan de rollback)

---

## 📊 ANÁLISIS DETALLADO DE TABLAS

### **ESQUEMA AUTH (17 tablas)**
```
🔴 PROBLEMA IDENTIFICADO:
- auth.users (1 registro) ← Usuario Supabase Auth activo
- auth.identities (1 registro) ← Identidad OAuth activa
- Resto de tablas auth.* ← Sistema Supabase Auth completo

❌ NO ELIMINAR: Aunque usamos NextAuth JWT, hay 1 usuario activo
⚠️ RIESGO: Eliminar auth.* podría romper funcionalidades futuras
```

### **ESQUEMA NEXT_AUTH (4 tablas)**
```
✅ CONFIRMAR ELIMINACIÓN SEGURA:
- next_auth.users (0 registros)
- next_auth.sessions (0 registros)  
- next_auth.accounts (0 registros)
- next_auth.verification_tokens (0 registros)

✅ SEGURO ELIMINAR: NextAuth usa JWT, no base de datos
```

### **ESQUEMA PUBLIC - ANÁLISIS CRÍTICO**

#### **🚨 TABLAS CON DEPENDENCIAS CLERK**
```sql
1. users (6 registros)
   - clerk_id: text NOT NULL ← PROBLEMA CRÍTICO
   - Referenciada por: orders, user_addresses, user_activity, etc.
   - ACCIÓN: Migrar a estructura sin Clerk

2. user_profiles (3 registros)  
   - clerk_user_id: varchar NULLABLE ← Mejor estructura
   - ACCIÓN: Consolidar como tabla principal
```

#### **✅ TABLAS CORE E-COMMERCE (PRESERVAR)**
```
- products (53 registros) ✅
- categories (11 registros) ✅
- orders (87 registros) ✅
- order_items ✅
- user_addresses (2 registros) ✅
```

#### **✅ TABLAS LOGÍSTICA (PRESERVAR - FUNCIONALIDAD FUTURA)**
```
- drivers (0 registros) ✅ Preservar
- fleet_vehicles (0 registros) ✅ Preservar  
- vehicle_locations (0 registros) ✅ Preservar
```

#### **✅ TABLAS ANALYTICS (PRESERVAR - ACTIVAS)**
```
- analytics_events (3,127 registros) ✅
- analytics_* (múltiples con datos) ✅
```

#### **❌ TABLAS CANDIDATAS A ELIMINACIÓN**
```
- data_export_requests (funcionalidad no implementada)
- user_sessions (duplica auth.sessions)
```

---

## 🎯 ESTRATEGIA DE MIGRACIÓN

### **FASE 1: CONSOLIDACIÓN DE USUARIOS**

#### **Opción Seleccionada: Migrar a user_profiles como tabla principal**

**Ventajas:**
- ✅ Estructura más robusta (roles, metadata, campos separados)
- ✅ Campo clerk_user_id NULLABLE (compatible con NextAuth)
- ✅ Referencia a auth.users (mejor integración Supabase)
- ✅ Sistema de roles implementado
- ✅ Metadata JSONB flexible

**Plan de Migración:**
```sql
-- 1. Migrar datos de users → user_profiles
-- 2. Actualizar todas las foreign keys
-- 3. Eliminar tabla users legacy
-- 4. Renombrar user_profiles → users (opcional)
```

### **FASE 2: ELIMINACIÓN SEGURA DE ESQUEMAS**

#### **next_auth.* - ELIMINACIÓN CONFIRMADA**
```sql
-- Seguro eliminar: 0 registros en todas las tablas
-- NextAuth usa JWT, no requiere base de datos
DROP SCHEMA next_auth CASCADE;
```

#### **auth.* - MANTENER**
```sql
-- NO ELIMINAR: 1 usuario activo + 1 identidad
-- Puede ser necesario para funcionalidades futuras
-- Mantener intacto
```

### **FASE 3: LIMPIEZA DE TABLAS INNECESARIAS**

```sql
-- Eliminar funcionalidades no implementadas
DROP TABLE data_export_requests;
DROP TABLE user_sessions; -- Duplica auth.sessions
```

---

## 📋 SCRIPTS DE MIGRACIÓN

### **SCRIPT 1: BACKUP Y PREPARACIÓN**
```sql
-- ===================================
-- BACKUP COMPLETO ANTES DE MIGRACIÓN
-- ===================================

-- Crear esquema de backup
CREATE SCHEMA IF NOT EXISTS backup_migration;

-- Backup tablas críticas
CREATE TABLE backup_migration.users_backup AS SELECT * FROM users;
CREATE TABLE backup_migration.user_profiles_backup AS SELECT * FROM user_profiles;
CREATE TABLE backup_migration.user_addresses_backup AS SELECT * FROM user_addresses;
CREATE TABLE backup_migration.orders_backup AS SELECT * FROM orders;

-- Verificar backups
SELECT 'users_backup' as tabla, COUNT(*) as registros FROM backup_migration.users_backup
UNION ALL
SELECT 'user_profiles_backup' as tabla, COUNT(*) as registros FROM backup_migration.user_profiles_backup
UNION ALL  
SELECT 'user_addresses_backup' as tabla, COUNT(*) as registros FROM backup_migration.user_addresses_backup
UNION ALL
SELECT 'orders_backup' as tabla, COUNT(*) as registros FROM backup_migration.orders_backup;
```

### **SCRIPT 2: MIGRACIÓN DE DATOS USUARIOS**
```sql
-- ===================================
-- MIGRACIÓN users → user_profiles
-- ===================================

-- Paso 1: Migrar usuarios faltantes de users a user_profiles
INSERT INTO user_profiles (
    id,
    email, 
    first_name,
    last_name,
    clerk_user_id,
    role_id,
    is_active,
    metadata,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    SPLIT_PART(u.name, ' ', 1) as first_name,
    CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(u.name, ' '), 1) > 1 
        THEN ARRAY_TO_STRING(ARRAY_REMOVE(STRING_TO_ARRAY(u.name, ' '), SPLIT_PART(u.name, ' ', 1)), ' ')
        ELSE ''
    END as last_name,
    u.clerk_id as clerk_user_id,
    (SELECT id FROM user_roles WHERE role_name = 'customer') as role_id,
    true as is_active,
    jsonb_build_object(
        'migrated_from', 'users_table',
        'migration_date', NOW(),
        'original_clerk_id', u.clerk_id
    ) as metadata,
    u.created_at,
    u.updated_at
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.email = u.email OR up.clerk_user_id = u.clerk_id
);

-- Verificar migración
SELECT 'Usuarios migrados' as resultado, COUNT(*) as cantidad
FROM user_profiles 
WHERE metadata->>'migrated_from' = 'users_table';
```

### **SCRIPT 3: ACTUALIZACIÓN DE FOREIGN KEYS**
```sql
-- ===================================
-- ACTUALIZAR REFERENCIAS A TABLA users
-- ===================================

-- Paso 1: Agregar columna temporal en user_addresses
ALTER TABLE user_addresses ADD COLUMN new_user_id UUID;

-- Paso 2: Mapear user_addresses.user_id → user_profiles.id
UPDATE user_addresses 
SET new_user_id = (
    SELECT up.id 
    FROM user_profiles up 
    JOIN users u ON u.email = up.email 
    WHERE u.id = user_addresses.user_id
);

-- Paso 3: Verificar mapeo completo
SELECT 
    COUNT(*) as total_addresses,
    COUNT(new_user_id) as mapped_addresses,
    COUNT(*) - COUNT(new_user_id) as unmapped_addresses
FROM user_addresses;

-- Paso 4: Actualizar constraint (solo si mapeo es 100%)
-- ALTER TABLE user_addresses DROP CONSTRAINT user_addresses_user_id_fkey;
-- ALTER TABLE user_addresses DROP COLUMN user_id;
-- ALTER TABLE user_addresses RENAME COLUMN new_user_id TO user_id;
-- ALTER TABLE user_addresses ADD CONSTRAINT user_addresses_user_id_fkey 
--     FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
```

---

## 🔧 ACTUALIZACIONES DE CÓDIGO REQUERIDAS

### **ARCHIVOS A ACTUALIZAR**

#### **1. Tipos TypeScript**
```typescript
// src/types/database.ts
export interface Database {
  public: {
    Tables: {
      users: {  // Cambiar a user_profiles
        Row: {
          id: string;
          // clerk_id: string; ← ELIMINAR
          email: string;
          first_name: string | null;
          last_name: string | null;
          role_id: string | null;
          is_active: boolean;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        // ... Insert, Update
      };
    };
  };
}
```

#### **2. APIs de Usuario**
```typescript
// src/app/api/user/addresses/route.ts
// Cambiar referencias de 'users' a 'user_profiles'
const { data: user } = await supabaseAdmin
  .from('user_profiles')  // ← Cambio
  .select('id')
  .eq('id', session.user.id)  // ← Sin clerk_id
  .single();
```

#### **3. Webhooks Clerk (ELIMINAR)**
```typescript
// src/app/api/webhooks/clerk/route.ts
// ← ARCHIVO COMPLETO A ELIMINAR
```

#### **4. Scripts de Migración (LIMPIAR)**
```bash
# Eliminar scripts legacy
rm scripts/sync-admin-clerk.js
rm scripts/update-clerk-metadata.js
rm scripts/migrate-clerk-*.js
```

---

## ⚠️ PLAN DE ROLLBACK

### **En caso de problemas durante la migración:**

```sql
-- ROLLBACK COMPLETO
-- 1. Restaurar tablas desde backup
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE users AS SELECT * FROM backup_migration.users_backup;
CREATE TABLE user_profiles AS SELECT * FROM backup_migration.user_profiles_backup;

-- 2. Recrear constraints
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE user_addresses ADD CONSTRAINT user_addresses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- 3. Verificar integridad
SELECT 'users' as tabla, COUNT(*) FROM users
UNION ALL
SELECT 'user_profiles' as tabla, COUNT(*) FROM user_profiles;
```

---

## 📊 ESTIMACIÓN DE TIEMPO Y RIESGOS

### **CRONOGRAMA DETALLADO**
```
Fase 1 - Backup y Preparación: 30 minutos
Fase 2 - Migración de Datos: 1 hora  
Fase 3 - Actualización FK: 1 hora
Fase 4 - Actualización Código: 2 horas
Fase 5 - Testing Completo: 1 hora
Fase 6 - Limpieza Final: 30 minutos

TOTAL: 6 horas
```

### **NIVELES DE RIESGO**
```
🟢 BAJO: Eliminación next_auth.* (0 datos)
🟡 MEDIO: Migración users → user_profiles (datos existentes)
🔴 ALTO: Actualización foreign keys (múltiples tablas)
```

### **MITIGACIÓN DE RIESGOS**
- ✅ Backup completo antes de iniciar
- ✅ Migración por fases con verificaciones
- ✅ Plan de rollback detallado
- ✅ Testing exhaustivo en cada fase

---

## 🎯 RESULTADOS ESPERADOS

### **BASE DE DATOS OPTIMIZADA**
- ❌ 0 referencias a Clerk
- ✅ Estructura de usuarios consolidada y moderna
- ✅ 4 tablas menos (next_auth.* eliminado)
- ✅ Compatibilidad total con NextAuth JWT
- ✅ Preservación de funcionalidades core y futuras

### **CÓDIGO LIMPIO**
- ❌ 0 archivos con referencias Clerk
- ✅ APIs actualizadas a nueva estructura
- ✅ Tipos TypeScript consistentes
- ✅ Scripts legacy eliminados

**Estado Final**: Base de datos moderna, eficiente y preparada para escalar 🚀

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### **EJECUCIÓN INMEDIATA**
1. **Revisar y aprobar el plan completo**
2. **Ejecutar Fase 1 (Backup)** - Sin riesgo
3. **Validar backups** antes de continuar

### **EJECUCIÓN GRADUAL**
1. **Fase 2-3**: Migración de datos (1-2 horas)
2. **Fase 4**: Actualización de código (2 horas)
3. **Fase 5**: Testing exhaustivo (1 hora)
4. **Fase 6**: Limpieza final (30 minutos)

### **VALIDACIÓN FINAL**
- ✅ Funcionalidad de direcciones operativa
- ✅ Sistema de órdenes funcionando
- ✅ Analytics sin interrupciones
- ✅ Autenticación NextAuth estable

¿Deseas que proceda con la **Fase 1 (Backup)** para comenzar la refactorización?
