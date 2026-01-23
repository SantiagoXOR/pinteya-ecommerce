# Rules: Seguridad Enterprise

## Principios de Seguridad

Este proyecto implementa seguridad de nivel enterprise. **TODAS** las implementaciones deben seguir estos estándares.

## Reglas de Seguridad

### 1. Autenticación y Autorización

- **SIEMPRE** usar NextAuth.js para autenticación
- **NUNCA** almacenar tokens en localStorage (usar cookies httpOnly)
- **SIEMPRE** verificar roles antes de operaciones administrativas:
  ```typescript
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  ```

### 2. Rate Limiting

- **TODAS** las APIs públicas deben tener rate limiting
- Usar Redis para rate limiting distribuido
- Límites recomendados:
  - APIs públicas: 100 requests/minuto por IP
  - APIs de autenticación: 5 requests/minuto por IP
  - APIs administrativas: 1000 requests/minuto por usuario

### 3. Validación de Input

- **SIEMPRE** validar y sanitizar inputs del usuario
- Usar Zod o similar para validación de schemas
- **NUNCA** confiar en datos del cliente sin validar

### 4. SQL Injection Prevention

- **SIEMPRE** usar parámetros preparados (Supabase client)
- **NUNCA** concatenar strings en queries SQL
- Usar `.eq()`, `.insert()`, `.update()` del cliente Supabase

### 5. XSS Prevention

- **SIEMPRE** escapar datos del usuario antes de renderizar
- React escapa automáticamente, pero verificar en:
  - `dangerouslySetInnerHTML` (evitar si es posible)
  - URLs y atributos HTML
  - JSON en scripts

### 6. CORS y Headers de Seguridad

- **SIEMPRE** configurar CORS correctamente
- Headers obligatorios:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`

### 7. Logging y Auditoría

- **SIEMPRE** loggear operaciones sensibles:
  - Autenticaciones (éxito/fallo)
  - Operaciones administrativas
  - Cambios en datos críticos
- **NUNCA** loggear contraseñas, tokens o datos sensibles

### 8. Manejo de Errores

- **NUNCA** exponer detalles técnicos en errores al cliente
- Mensajes genéricos para usuarios: "Ha ocurrido un error"
- Detalles completos solo en logs del servidor

### 9. Variables de Entorno

- **NUNCA** commitear `.env` o archivos con secrets
- **SIEMPRE** usar variables de entorno para:
  - API keys
  - Database URLs
  - Secrets de autenticación
- Verificar `.env.example` está actualizado

### 10. Dependencias

- **SIEMPRE** mantener dependencias actualizadas
- Ejecutar `npm audit` regularmente
- Revisar vulnerabilidades conocidas (CVE)

## Archivos Clave de Seguridad

- `src/lib/enterprise/security/` - Módulos de seguridad
- `src/lib/enterprise/rate-limiting/` - Rate limiting
- `middleware.ts` - Security headers y validaciones
- `src/lib/auth/` - Autenticación y autorización

## Comandos de Seguridad

```bash
npm run security:audit        # Auditoría completa
npm run security:cors-update  # Actualizar CORS
npm run security:auth-logs    # Analizar logs de auth
npm run security:monitor      # Monitorear métricas
```
