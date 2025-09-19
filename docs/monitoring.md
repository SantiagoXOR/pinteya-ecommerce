# Sistema de Monitoring

## Configuración

El sistema de monitoring ha sido configurado automáticamente.

### Archivos principales:
- `src/lib/monitoring/` - Librerías de monitoring
- `src/components/admin/PerformanceMonitor.tsx` - Componente de dashboard
- `src/app/admin/performance/page.tsx` - Página de administración
- `middleware.ts` - Middleware integrado

### Variables de entorno:
Ver `.env.monitoring.example` para todas las opciones disponibles.

### Uso:
1. Accede a `/admin/performance` para ver el dashboard
2. Las métricas se recolectan automáticamente
3. Las alertas se envían según la configuración

### API Endpoints:
- `GET /api/admin/performance/metrics` - Obtener métricas
- `POST /api/admin/performance/metrics` - Enviar métricas del cliente
- `DELETE /api/admin/performance/metrics` - Limpiar métricas antiguas

## Mantenimiento

- Revisar logs regularmente
- Ajustar umbrales según necesidades
- Actualizar configuración de alertas
- Monitorear uso de recursos

Generado automáticamente el 2025-09-09T11:06:26.637Z



