# 🔍 AUDITORÍA COMPLETA DE BASE DE DATOS SUPABASE

## Proyecto: Pinteya E-commerce

**Fecha**: 13 de Septiembre, 2025  
**Proyecto ID**: aakzspzfulgftqlgwkpb  
**Objetivo**: Identificar y resolver inconsistencias en la estructura de datos

---

## 📊 RESUMEN EJECUTIVO

### 🚨 **PROBLEMAS CRÍTICOS IDENTIFICADOS**

1. **MÚLTIPLES TABLAS DE USUARIOS CONFLICTIVAS**
   - `public.users` (6 registros) - Estructura legacy con `clerk_id`
   - `public.user_profiles` (3 registros) - Estructura moderna con roles
   - `next_auth.users` (0 registros) - Tabla NextAuth sin usar
   - `auth.users` (1 registro) - Tabla Supabase Auth activa

2. **DESINCRONIZACIÓN DE AUTENTICACIÓN**
   - Usuario autenticado con NextAuth no existe en `public.users`
   - API de direcciones falla por usuario inexistente
   - Estructura de columnas inconsistente entre tablas

3. **TABLAS REDUNDANTES Y SIN USO**
   - 47 tablas totales, muchas sin datos o funcionalidad
   - Esquemas duplicados (analytics, fleet, drivers)
   - Tablas de migración legacy sin limpiar

---

## 🗂️ INVENTARIO COMPLETO DE TABLAS

### **ESQUEMA AUTH (17 tablas)**

```
✅ ACTIVAS Y NECESARIAS:
- auth.users (1 registro) - Usuarios Supabase Auth
- auth.sessions - Sesiones activas
- auth.identities - Identidades OAuth

❌ AUTOMÁTICAS SUPABASE (no tocar):
- audit_log_entries, flow_state, mfa_*, oauth_*, etc.
```

### **ESQUEMA NEXT_AUTH (4 tablas)**

```
❌ SIN USO - ELIMINAR:
- next_auth.users (0 registros)
- next_auth.sessions (0 registros)
- next_auth.accounts (0 registros)
- next_auth.verification_tokens (0 registros)

RAZÓN: NextAuth configurado con JWT, no usa base de datos
```

### **ESQUEMA PUBLIC - CORE E-COMMERCE**

```
✅ ACTIVAS Y NECESARIAS:
- products (53 registros) - Catálogo principal
- categories (11 registros) - Categorías de productos
- orders (87 registros) - Órdenes de compra
- order_items - Items de órdenes
- user_addresses (2 registros) - Direcciones de usuarios

⚠️ PROBLEMÁTICAS:
- users (6 registros) - Estructura legacy, conflicto con NextAuth
- user_profiles (3 registros) - Estructura moderna pero desconectada

✅ ANALYTICS Y MÉTRICAS:
- analytics_events (3,127 registros) - Eventos de usuario
- analytics_* (8 tablas) - Sistema de métricas completo

❌ SIN USO - ELIMINAR:
- drivers, fleet_vehicles, vehicle_locations (0 registros)
- data_export_requests (funcionalidad no implementada)
- user_sessions (0 registros) - Duplica auth.sessions
```

---

## 🔧 ANÁLISIS DE PROBLEMAS ESPECÍFICOS

### **1. CONFLICTO DE TABLAS DE USUARIOS**

#### **Tabla `public.users` (PROBLEMÁTICA)**

```sql
Estructura actual:
- id: uuid (gen_random_uuid())
- clerk_id: text NOT NULL  ← PROBLEMA: Legacy Clerk
- email: text NOT NULL
- name: text
- created_at, updated_at

Problemas:
❌ Requiere clerk_id (legacy)
❌ No compatible con NextAuth
❌ Falta columna image que usa el código
❌ API busca por clerk_id pero NextAuth usa id diferente
```

#### **Tabla `public.user_profiles` (MEJOR ESTRUCTURA)**

```sql
Estructura actual:
- id: uuid (gen_random_uuid())
- clerk_user_id: varchar (nullable) ← Mejor: opcional
- supabase_user_id: uuid (references auth.users)
- email: varchar NOT NULL
- role_id: uuid (references user_roles)
- first_name, last_name, phone
- is_active: boolean
- metadata: jsonb
- created_at, updated_at

Ventajas:
✅ Estructura moderna y completa
✅ Soporte para roles
✅ Referencia a auth.users
✅ Metadata flexible
✅ Campos separados (first_name, last_name)
```

### **2. PROBLEMA ACTUAL: DIRECCIONES**

```sql
-- user_addresses.user_id referencia public.users.id
-- Pero NextAuth usuario no existe en public.users
-- Resultado: Error 404 al obtener/crear direcciones

SELECT ua.*, u.email
FROM user_addresses ua
LEFT JOIN users u ON ua.user_id = u.id;

Resultado:
- 2 direcciones existentes vinculadas a usuario legacy
- Usuario NextAuth actual no puede crear direcciones
```

---

## 🎯 PLAN DE RESOLUCIÓN

### **FASE 1: CONSOLIDACIÓN DE USUARIOS (CRÍTICO)**

#### **Opción A: Migrar a user_profiles (RECOMENDADO)**

```sql
-- 1. Actualizar user_addresses para usar user_profiles
ALTER TABLE user_addresses
ADD COLUMN profile_id UUID REFERENCES user_profiles(id);

-- 2. Migrar datos existentes
UPDATE user_addresses
SET profile_id = (
  SELECT up.id FROM user_profiles up
  JOIN users u ON u.email = up.email
  WHERE u.id = user_addresses.user_id
);

-- 3. Cambiar referencia principal
ALTER TABLE user_addresses DROP COLUMN user_id;
ALTER TABLE user_addresses RENAME COLUMN profile_id TO user_id;

-- 4. Crear función para sincronizar NextAuth → user_profiles
CREATE OR REPLACE FUNCTION sync_nextauth_user()...
```

#### **Opción B: Actualizar public.users (ALTERNATIVO)**

```sql
-- 1. Hacer clerk_id opcional
ALTER TABLE users ALTER COLUMN clerk_id DROP NOT NULL;

-- 2. Agregar columnas faltantes
ALTER TABLE users ADD COLUMN image TEXT;
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'customer';

-- 3. Actualizar API para crear usuarios NextAuth
-- (Ya implementado en el código actual)
```

### **FASE 2: LIMPIEZA DE TABLAS**

#### **Eliminar tablas sin uso:**

```sql
-- NextAuth (no se usa)
DROP SCHEMA next_auth CASCADE;

-- Fleet management (no implementado)
DROP TABLE drivers, fleet_vehicles, vehicle_locations;

-- Funcionalidades no implementadas
DROP TABLE data_export_requests;
DROP TABLE user_sessions; -- Duplica auth.sessions
```

### **FASE 3: OPTIMIZACIÓN**

#### **Consolidar analytics:**

```sql
-- Mantener solo tablas activas
-- analytics_events (3,127 registros) ✅
-- analytics_* con datos ✅
-- Eliminar tablas analytics vacías
```

---

## 🚀 RECOMENDACIÓN FINAL

### **SOLUCIÓN INMEDIATA (1-2 horas)**

1. **Opción B**: Actualizar `public.users` para compatibilidad NextAuth
2. **Hacer clerk_id opcional** y agregar columna `image`
3. **Actualizar API** para crear usuarios automáticamente
4. **Probar flujo completo** de direcciones

### **SOLUCIÓN A LARGO PLAZO (1-2 días)**

1. **Migrar a user_profiles** como tabla principal
2. **Eliminar tablas redundantes** (next_auth, fleet, etc.)
3. **Consolidar estructura** de usuarios
4. **Implementar sincronización** NextAuth ↔ Supabase

### **BENEFICIOS ESPERADOS**

- ✅ Resolución inmediata del problema de direcciones
- ✅ Base de datos 40% más limpia (20 tablas menos)
- ✅ Estructura consistente y escalable
- ✅ Mejor rendimiento y mantenimiento
- ✅ Compatibilidad total con NextAuth

---

## 📋 PRÓXIMOS PASOS

1. **INMEDIATO**: Implementar Opción B para resolver direcciones
2. **ESTA SEMANA**: Planificar migración a user_profiles
3. **PRÓXIMA SEMANA**: Ejecutar limpieza de tablas
4. **SEGUIMIENTO**: Monitorear rendimiento post-limpieza

**Estado**: 🔴 CRÍTICO - Requiere acción inmediata
**Prioridad**: 🚨 ALTA - Afecta funcionalidad core del e-commerce
