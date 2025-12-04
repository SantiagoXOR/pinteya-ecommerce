# Guía de Despliegue - Correcciones de Seguridad y Performance de Base de Datos

## 📋 Resumen Ejecutivo

Esta guía contiene las instrucciones para aplicar correcciones críticas de seguridad y performance identificadas por los advisors de Supabase. Las correcciones abordan:

- **Políticas RLS faltantes** en 7 tablas críticas
- **24 funciones con search_path mutable** (vulnerabilidad de seguridad)
- **13 índices faltantes** en foreign keys (problemas de performance)
- **Optimización de políticas RLS** con problemas de performance
- **Corrección de vistas SECURITY DEFINER** inseguras
- **Primary keys faltantes** en 35 tablas

## ⚠️ Requisitos Previos

- **Acceso de administrador** a la base de datos Supabase
- **Backup completo** de la base de datos antes de aplicar cambios
- **Ventana de mantenimiento** recomendada para aplicar todas las correcciones
- **Usuario con permisos de superusuario** (no `supabase_read_only_user`)

## 🚀 Orden de Aplicación de Migraciones

### PASO 1: Políticas RLS (CRÍTICO - SEGURIDAD)

```bash
# Aplicar desde: database_fixes_rls_policies.sql
# Tiempo estimado: 2-3 minutos
# Impacto: ALTO - Corrige vulnerabilidades de seguridad críticas
```

### PASO 2: Corrección de Funciones (CRÍTICO - SEGURIDAD)

```bash
# Aplicar desde: database_fixes_functions.sql
# Tiempo estimado: 3-5 minutos
# Impacto: ALTO - Corrige vulnerabilidades de search_path
```

### PASO 3: Índices de Performance (MEDIO - PERFORMANCE)

```bash
# Aplicar desde: database_fixes_indexes.sql
# Tiempo estimado: 5-10 minutos
# Impacto: MEDIO - Mejora significativa de performance
```

### PASO 4: Optimización RLS (MEDIO - PERFORMANCE)

```bash
# Aplicar desde: database_fixes_rls_optimization.sql
# Tiempo estimado: 3-5 minutos
# Impacto: MEDIO - Optimiza consultas con RLS
```

### PASO 5: Vistas SECURITY DEFINER (CRÍTICO - SEGURIDAD)

```bash
# Aplicar desde: database_fixes_security_definer_views.sql
# Tiempo estimado: 2-3 minutos
# Impacto: ALTO - Corrige vulnerabilidades en vistas
```

### PASO 6: Primary Keys (BAJO - INTEGRIDAD)

```bash
# Aplicar desde: database_fixes_primary_keys.sql
# Tiempo estimado: 10-15 minutos
# Impacto: BAJO - Mejora integridad de datos
```

## 📝 Instrucciones Detalladas

### Conexión a la Base de Datos

1. **Conectar como administrador:**

```sql
-- Verificar usuario actual
SELECT current_user, session_user;
-- Debe mostrar un usuario con permisos de administrador, NO 'supabase_read_only_user'
```

2. **Crear backup antes de proceder:**

```bash
pg_dump -h [host] -U [admin_user] -d [database] > backup_before_fixes_$(date +%Y%m%d_%H%M%S).sql
```

### Aplicación de Cada Migración

#### PASO 1: Políticas RLS

```sql
-- Ejecutar todo el contenido de database_fixes_rls_policies.sql
-- Verificar aplicación exitosa:
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('logistics_drivers', 'optimized_routes', 'order_items', 'orders', 'user_addresses', 'couriers', 'analytics_event_types')
ORDER BY tablename;
```

#### PASO 2: Funciones con Search Path

```sql
-- Ejecutar todo el contenido de database_fixes_functions.sql
-- Verificar aplicación exitosa:
SELECT
    proname,
    prosecdef,
    proconfig
FROM pg_proc
WHERE proname IN ('get_user_role', 'update_site_configuration_updated_at', 'get_product_stats', 'update_product_stock')
AND proconfig IS NOT NULL;
```

#### PASO 3: Índices de Performance

```sql
-- Ejecutar todo el contenido de database_fixes_indexes.sql
-- Verificar aplicación exitosa:
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%_fk_idx'
ORDER BY tablename, indexname;
```

#### PASO 4: Optimización RLS

```sql
-- Ejecutar todo el contenido de database_fixes_rls_optimization.sql
-- Verificar aplicación exitosa:
SELECT * FROM rls_performance_monitor LIMIT 10;
```

#### PASO 5: Vistas SECURITY DEFINER

```sql
-- Ejecutar todo el contenido de database_fixes_security_definer_views.sql
-- Verificar aplicación exitosa:
SELECT
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('analytics_events_view', 'cart_items_with_products');
```

#### PASO 6: Primary Keys

```sql
-- Ejecutar todo el contenido de database_fixes_primary_keys.sql
-- Verificar aplicación exitosa:
SELECT * FROM verify_primary_key_coverage();
```

## 🔍 Verificación Post-Despliegue

### Verificación Automática

```sql
-- Ejecutar después de todas las migraciones
SELECT verify_all_database_fixes();
```

### Verificación Manual con Supabase Advisors

1. **Verificar correcciones de seguridad:**

```bash
# Usar herramienta de Supabase para obtener advisors de seguridad
# Debe mostrar 0 issues críticos relacionados con RLS y search_path
```

2. **Verificar correcciones de performance:**

```bash
# Usar herramienta de Supabase para obtener advisors de performance
# Debe mostrar mejoras significativas en índices y políticas RLS
```

## 📊 Métricas de Éxito

### Antes de las Correcciones

- **Issues de Seguridad:** ~30 issues críticos
- **Issues de Performance:** ~15 issues de performance
- **Tablas sin Primary Key:** 35 tablas
- **Funciones Vulnerables:** 24 funciones

### Después de las Correcciones (Objetivo)

- **Issues de Seguridad:** 0 issues críticos
- **Issues de Performance:** <5 issues menores
- **Tablas sin Primary Key:** 0 tablas
- **Funciones Vulnerables:** 0 funciones

## 🚨 Plan de Rollback

En caso de problemas durante la aplicación:

1. **Detener inmediatamente** la aplicación de migraciones
2. **Restaurar desde backup:**

```bash
psql -h [host] -U [admin_user] -d [database] < backup_before_fixes_[timestamp].sql
```

3. **Verificar integridad** de la base de datos restaurada
4. **Reportar el issue** específico que causó el problema

## 📞 Contacto y Soporte

- **Desarrollador Principal:** Equipo de Desarrollo Pinteya
- **Documentación Técnica:** `/docs/database/` en el repositorio
- **Issues Críticos:** Contactar inmediatamente al equipo de desarrollo

## 📋 Checklist de Aplicación

- [ ] Backup completo realizado
- [ ] Usuario administrador verificado
- [ ] Ventana de mantenimiento programada
- [ ] PASO 1: Políticas RLS aplicadas ✅
- [ ] PASO 2: Funciones corregidas ✅
- [ ] PASO 3: Índices creados ✅
- [ ] PASO 4: RLS optimizado ✅
- [ ] PASO 5: Vistas SECURITY DEFINER corregidas ✅
- [ ] PASO 6: Primary keys agregadas ✅
- [ ] Verificación post-despliegue completada ✅
- [ ] Métricas de éxito confirmadas ✅
- [ ] Documentación actualizada ✅

---

**Fecha de Creación:** 27 de Enero 2025  
**Versión:** 1.0  
**Estado:** Listo para Aplicación  
**Prioridad:** CRÍTICA - Aplicar en próxima ventana de mantenimiento
