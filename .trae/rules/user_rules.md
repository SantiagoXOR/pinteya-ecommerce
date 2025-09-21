# User Rules & Preferences - Pinteya E-commerce

## 🎨 Design Preferences

### Visual Identity
- **Colores principales**: 
  - Blaze Orange (#ea5a17) - Color primario para header y elementos destacados
  - Fun Green - Color secundario para elementos de éxito y confirmación
  - Bright Sun - Color de acento para botones y llamadas a la acción
- **Logos**: 
  - LOGO POSITIVO.svg (uso principal)
  - LOGO NEGATIVO.svg (uso alternativo en fondos oscuros)

### UI/UX Preferences
- **Enfoque mobile-first**: Todas las interfaces deben ser diseñadas primero para móviles
- **Botones preferidos**: 
  - Estilo: `bg-yellow-400 text-2xl rounded-xl`
  - Botones amarillos para acciones principales
- **Header**: 
  - Fondo naranja (#ea5a17)
  - Logo más grande y prominente
  - Solo botón de iniciar sesión con icono de Google
- **Modales**: Preferencia por modales personalizados elegantes sobre alertas estándar

### Component Styling
- **ProductCard**: 
  - Imágenes centradas con `object-contain` para mantener proporciones
  - Badges posicionados absolutamente
  - Precios prominentes con tachado de precios originales
  - Texto de cuotas en color verde
  - Íconos SVG para badges
- **Carousels**: Usar `object-contain` para mantener proporciones originales de imágenes

## 🔧 Technical Preferences

### Architecture & Development
- **Sistemas de filtros interactivos**: Preferencia por filtros dinámicos y responsivos
- **Arquitectura de búsqueda centralizada**: 
  - Usar hook `useSearch` como base
  - Implementar debouncing de 300ms
  - Búsquedas recientes con localStorage
- **Hooks personalizados**: Crear hooks específicos para funcionalidades complejas

### Authentication & Security
- **Sistema de roles**: admin/customer/moderator
- **Cuenta admin específica**: santiago@xor.com.ar con contraseña 'SavoirFaire19'
- **Integración con Supabase Auth**: Mantener RLS policies activas
- **NextAuth.js**: Sistema de autenticación principal (migrado desde Clerk)

### Database & APIs
- **Supabase PostgreSQL**: Base de datos principal
- **APIs REST**: Seguir estándares REST para todas las APIs
- **Performance**: APIs deben responder en <300ms
- **Rate Limiting**: Implementar con Redis para protección

## 🛠️ Development Standards

### Code Quality
- **TypeScript**: 100% tipado, sin `any` types
- **Testing**: Mantener >90% de cobertura de tests
- **Performance**: 
  - Bundle size optimizado
  - First Load JS <500KB
  - Build time <20s

### Component Development
- **React Patterns**: 
  - Usar React.memo para optimización
  - Implementar useCallback para funciones
  - Custom hooks para lógica reutilizable
- **Accessibility**: Seguir estándares WCAG 2.1 AA
- **Responsive Design**: Mobile-first approach obligatorio

### File Organization
- **Estructura modular**: Componentes organizados por funcionalidad
- **Naming conventions**: 
  - Componentes en PascalCase
  - Hooks en camelCase con prefijo 'use'
  - Archivos de configuración en kebab-case

## 📊 Business Logic Preferences

### E-commerce Features
- **Productos**: Especialización en pinturería, ferretería y corralón
- **Marcas argentinas**: Priorizar productos de marcas locales
- **Categorías dinámicas**: Sistema de categorización flexible
- **Stock management**: Función SQL para actualización automática de stock

### User Experience
- **Checkout simplificado**: Proceso de compra en mínimos pasos
- **MercadoPago integration**: Sistema de pagos principal
- **Búsqueda inteligente**: 
  - Autocompletado
  - Sugerencias de productos
  - Filtros por categoría, precio, marca

### Analytics & Monitoring
- **Tracking automático**: clicks, hovers, scroll
- **Métricas e-commerce**: conversiones, AOV, abandono de carrito
- **Dashboard admin**: Métricas en tiempo real
- **Dual tracking**: Supabase + Google Analytics 4

## 🚀 Performance & Optimization

### Loading & Caching
- **Lazy loading**: Para imágenes y componentes no críticos
- **Cache strategies**: Redis para datos frecuentes
- **CDN optimization**: Para assets estáticos
- **Bundle optimization**: Code splitting por rutas

### Monitoring & Alerts
- **Real-time monitoring**: Dashboard de métricas en vivo
- **Error tracking**: Sistema de logging estructurado
- **Performance metrics**: P50, P95, P99 tracking
- **Automated alerts**: Notificaciones por Slack/email

## 📱 Mobile & Responsive

### Mobile-First Design
- **Breakpoints**: Diseñar primero para 320px-768px
- **Touch interactions**: Botones mínimo 44px
- **Navigation**: Bottom navigation para móviles
- **Performance**: Optimizar para conexiones lentas

### Progressive Web App
- **Service Workers**: Para funcionalidad offline
- **App-like experience**: Instalación en dispositivos
- **Push notifications**: Para actualizaciones importantes
- **Offline support**: Funcionalidad básica sin conexión

## 🔒 Security & Compliance

### Data Protection
- **GDPR compliance**: Manejo adecuado de datos personales
- **Encryption**: Datos sensibles siempre encriptados
- **Audit trail**: Registro completo de acciones administrativas
- **Backup strategy**: Respaldos automáticos diarios

### Authentication Security
- **Session management**: Tokens JWT seguros
- **Rate limiting**: Protección contra ataques
- **CORS policies**: Configuración restrictiva
- **Security headers**: Implementación completa

---

*Última actualización: Septiembre 2025*
*Estas reglas deben ser seguidas en todo desarrollo del proyecto Pinteya E-commerce*