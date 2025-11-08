# Auditoría de Seguridad Pre-Commit

Fecha: 2025-10-09

Este informe documenta la revisión de seguridad realizada previo a `commit` y `push`.

## Resumen

- Secretos/credenciales expuestos: corregidos los hallazgos críticos (Supabase anon key hardcodeada en scripts).
- Rutas y endpoints: se verificó protección y rate limiting en endpoints administrativos; se identificaron endpoints de `debug` que deben restringirse en producción.
- Configuraciones sensibles: revisadas variables de entorno y middleware de NextAuth; se recomienda eliminar dependencias de usuarios hardcodeados.
- Dependencias: `npm audit` sin vulnerabilidades reportadas (0 críticas/altas/moderadas).

## Hallazgos y Acciones

### 1) Secretos/Credenciales Expuestos

- Claves de Supabase anon hardcodeadas en:
  - `fix-csv-database-sync.js`
  - `temp_images/upload-webp-direct.js`
  - `scripts/fix-missing-images.js`

Acción aplicada:
- Se eliminaron las claves hardcodeadas y se forzó el uso de `process.env.NEXT_PUBLIC_SUPABASE_URL` y `process.env.SUPABASE_ANON_KEY` con validación y salida segura si faltan.

Recomendación adicional:
- Rotar la `SUPABASE_ANON_KEY` si se considera expuesta públicamente y confirmar políticas RLS activas en todas las tablas.

### 2) Rutas y Endpoints

- `src/app/api/admin/*`, `src/app/api/auth/security`: están protegidos con autenticación/permiso y aplican rate limiting.
- `middleware.ts`: protege `/admin`, `/api/admin`, `/dashboard`, `/api/user`; añade headers de seguridad básicos.
- Riesgo: `src/app/api/debug/*` expone endpoints de depuración sin autenticación estricta. Deben deshabilitarse/ocultarse en producción.

Acciones propuestas:
- Añadir verificación de `NODE_ENV !== 'production'` o proteger con auth y permisos.
- Sustituir verificación de admin basada en email hardcodeado por roles/claims desde la sesión.

### 3) Configuraciones Sensibles

- `auth.ts`: valida `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para NextAuth + Supabase Adapter.
- `lib/env-config.ts`: centraliza configuración (Supabase/Clerk/MercadoPago/Email). Faltantes se reportan.

Recomendaciones:
- Evitar defaults sensibles; preferir fallar si faltan claves críticas en producción.
- Revisar `NEXT_PUBLIC_*` para confirmar que solo se expone lo estrictamente necesario en el cliente.

### 4) Dependencias

- Resultado `npm audit`: 0 vulnerabilidades.

### 5) Próximos Pasos

- Rotar claves de Supabase si se han difundido en el repositorio.
- Auditar RLS en Supabase (todas las operaciones deben respetar políticas de fila).
- Endpoints `debug`: ocultar en producción o exigir autenticación estricta.
- Migrar control de admin desde email hardcodeado a roles con claims.

---

Este documento sirve de checklist y evidencia de la auditoría previa al `commit` y `push`.