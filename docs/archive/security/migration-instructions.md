# Instrucciones para Aplicar Migración RLS

## 🚨 Error Detectado: Snippet No Encontrado

El error que estás viendo indica que Supabase Dashboard no puede encontrar el snippet con ID `3b42b55c-6dfb-4aa7-a8a2-66ada5cb8317`. Esto es normal cuando se intenta acceder a un snippet que no existe o ha expirado.

## ✅ Solución: Aplicar Migración Manualmente

### Opción 1: SQL Editor en Supabase Dashboard

1. **Accede a tu proyecto Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Selecciona tu proyecto Pinteya

2. **Abre el SQL Editor**
   - En el panel izquierdo, haz clic en "SQL Editor"
   - Crea una nueva query

3. **Copia y pega la migración completa**
   - Abre el archivo `20250201_optimize_rls_policies_performance.sql`
   - Copia todo el contenido (223 líneas)
   - Pégalo en el SQL Editor

4. **Ejecuta la migración**
   - Haz clic en "Run" o presiona `Ctrl+Enter`
   - Verifica que no hay errores
   - Confirma el mensaje: "Todas las políticas RLS optimizadas exitosamente"

### Opción 2: Usando psql (Si tienes acceso directo)

```bash
# Conectar a la base de datos
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Ejecutar la migración
\i 20250201_optimize_rls_policies_performance.sql
```

### Opción 3: Crear Nueva Migración en Supabase

1. **Ve a Database > Migrations**
2. **Crea nueva migración**
   - Nombre: `optimize_rls_policies_performance`
   - Copia el contenido del archivo SQL
3. **Aplica la migración**

## 🎯 Contenido de la Migración

La migración optimiza **9 políticas RLS** en 3 tablas:

### user_roles (1 política)

- `Allow admin modify user_roles`

### user_profiles (4 políticas)

- `Allow users read own profile`
- `Allow users update own profile`
- `Allow admin insert profiles`
- `Allow admin delete profiles`

### user_preferences (4 políticas)

- `Users can view own preferences`
- `Users can insert own preferences`
- `Users can update own preferences`
- `Users can delete own preferences`

## 🔍 Verificación Post-Aplicación

Después de aplicar la migración, verifica:

1. **No hay errores en la ejecución**
2. **Mensaje de confirmación aparece**: "Todas las políticas RLS optimizadas exitosamente"
3. **Las políticas están activas** en Database > Authentication > Policies
4. **Los warnings de performance desaparecen** en Database Linter

## 📊 Beneficios Esperados

- ✅ **Performance mejorado**: `auth.<function>()` se evalúa 1 vez por query
- ✅ **Warnings resueltos**: Eliminación de `auth_rls_initplan` warnings
- ✅ **Funcionalidad mantenida**: Misma seguridad, mejor performance
- ✅ **Escalabilidad**: Mejor rendimiento con muchas filas

## 🚨 Troubleshooting

### Si encuentras errores:

1. **Error de permisos**: Asegúrate de tener permisos de admin
2. **Políticas existentes**: La migración usa `DROP POLICY IF EXISTS`
3. **Tablas no encontradas**: Verifica que las tablas existen
4. **Sintaxis**: Copia exactamente el contenido del archivo

### Verificar estado actual:

```sql
-- Ver políticas actuales
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('user_roles', 'user_profiles', 'user_preferences')
ORDER BY tablename, policyname;
```

## 📝 Notas Importantes

- **Backup recomendado**: Aunque la migración es segura, considera hacer backup
- **Downtime mínimo**: La migración es rápida (< 1 segundo)
- **Reversible**: Puedes revertir recreando las políticas originales
- **Testing**: Prueba funcionalidad después de aplicar

---

**Estado**: Listo para aplicar  
**Archivo**: `20250201_optimize_rls_policies_performance.sql`  
**Impacto**: Mejora de performance sin cambios funcionales
