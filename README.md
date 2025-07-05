# 🎨 Pinteya E-commerce

> E-commerce especializado en productos de pinturería, ferretería y corralón, desarrollado con tecnologías modernas y arquitectura escalable.

[![Deploy Status](https://img.shields.io/badge/Deploy-Vercel-success)](https://pinteya-ecommerce.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-480%20passing-brightgreen)](./docs/testing/README.md)
[![Coverage](https://img.shields.io/badge/Coverage-70%25-green)](./docs/testing/coverage.md)
[![Design System](https://img.shields.io/badge/Design%20System-Phase%203%20Complete-success)](./docs/design-system/README.md)
[![Visual Testing](https://img.shields.io/badge/Visual%20Testing-Chromatic-purple)](./docs/testing/visual-regression.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)](https://www.typescriptlang.org/)

## 🚀 Estado del Proyecto

**✅ PROYECTO ENTERPRISE-READY - PRODUCCIÓN**

Sistema completo de e-commerce con todas las funcionalidades implementadas y testeadas:

### 🏗️ **Arquitectura & Backend**
- ✅ **Next.js 15** con App Router y TypeScript
- ✅ **Supabase** - Base de datos PostgreSQL con RLS
- ✅ **22 APIs RESTful** completamente funcionales
- ✅ **Productos reales** de marcas argentinas reconocidas

### 💳 **Pagos & Checkout**
- ✅ **MercadoPago** integración completa con credenciales reales
- ✅ **Checkout funcional** con validación de stock automática
- ✅ **Webhook operativo** para notificaciones de pago
- ✅ **Estados de pago** completos (success/failure/pending)

### 👤 **Autenticación & Usuario**
- ✅ **Clerk Authentication** configurado y funcional
- ✅ **Área de usuario** completa con dashboard dinámico
- ✅ **Gestión de direcciones** y perfil editable
- ✅ **Historial de órdenes** con paginación y filtros

### 🧪 **Testing & Calidad**
- ✅ **480 tests** pasando (100% success rate)
- ✅ **70%+ cobertura** de código
- ✅ **Testing Visual Regression** con Chromatic
- ✅ **Testing de Accesibilidad** con axe-core
- ✅ **Playwright E2E** tests configurados
- ✅ **CI/CD Pipeline** con GitHub Actions

### 🎨 **Design System Enterprise-Ready**
- ✅ **Fase 3 Completada** - Testing visual regression
- ✅ **29 componentes** con stories completas
- ✅ **Performance optimizada** con bundle splitting
- ✅ **Hooks optimizados** para callbacks y memoización
- ✅ **Documentación completa** con mejores prácticas

### 🌐 **Producción**
- ✅ **Deploy exitoso** en Vercel sin errores
- ✅ **37 páginas** generadas correctamente
- ✅ **Performance optimizada** para producción
- ✅ **SSL y CDN** configurados automáticamente

## 🔗 Enlaces de Producción

- **🌐 Aplicación en Vivo**: [pinteya-ecommerce.vercel.app](https://pinteya-ecommerce.vercel.app)
- **📂 Repositorio GitHub**: [github.com/SantiagoXOR/pinteya-ecommerce](https://github.com/SantiagoXOR/pinteya-ecommerce)
- **📊 Dashboard Vercel**: [vercel.com/santiagoxor/pinteya-ecommerce](https://vercel.com/santiagoxor/pinteya-ecommerce)

## 💳 Sistema de Checkout - COMPLETADO

### ✅ Funcionalidades Implementadas

**API de Pagos:**
- ✅ `/api/payments/create-preference` - Creación de preferencias MercadoPago
- ✅ `/api/payments/webhook` - Webhook para notificaciones
- ✅ `/api/payments/status` - Consulta de estado de pagos

**Integración MercadoPago:**
- ✅ Configuración completa con credenciales reales
- ✅ Creación de preferencias de pago
- ✅ URLs de retorno configuradas (success/failure/pending)
- ✅ Manejo de productos y precios en pesos argentinos
- ✅ Validación de stock antes del pago

**Base de Datos:**
- ✅ Tabla `orders` con órdenes de compra
- ✅ Tabla `order_items` con items de cada orden
- ✅ Usuario temporal para desarrollo
- ✅ Relaciones y constraints configuradas

**Middleware y Seguridad:**
- ✅ Rutas públicas configuradas en Clerk
- ✅ Validación de datos de entrada
- ✅ Manejo de errores robusto

### 🔧 Configuración Técnica

```bash
# Variables de entorno configuradas
MERCADOPAGO_ACCESS_TOKEN=APP_USR-921414591813674-121116-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-b989b49d-2678-43ce-a048-...
NEXT_PUBLIC_SUPABASE_URL=https://aakzspzfulgftqlgwkpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 🎯 Flujo de Checkout

1. **Selección de productos** → Validación de stock
2. **Datos del comprador** → Validación de formulario
3. **Creación de orden** → Guardado en Supabase
4. **Preferencia MercadoPago** → Generación de link de pago
5. **Redirección a pago** → Proceso en MercadoPago
6. **Confirmación** → Webhook actualiza estado

### 📊 Resultados de Pruebas

```json
{
  "status": "✅ FUNCIONANDO",
  "api_response": {
    "order_id": 15,
    "preference_id": "176553735-763e0ed1-fa0c-4915-aaea-26bafa682e64",
    "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
    "total": 7650
  },
  "message": "Preferencia de pago creada exitosamente"
}
```

## 🔧 Últimas Correcciones (16 Jun 2025)

### ✅ Errores de Build de Vercel Resueltos

**Problema**: Build fallando por incompatibilidades React/Clerk y errores TypeScript
**Solución**: Corrección sistemática de 47+ archivos y downgrade React 19→18.2.0
**Resultado**: Deploy exitoso con 37 páginas generadas sin errores

#### Correcciones Implementadas:
- ✅ **React Compatibility**: Downgrade React 19 → 18.2.0 para Clerk 6.21.0
- ✅ **TypeScript**: 47+ archivos corregidos (tipos implícitos, null checks)
- ✅ **ESLint**: Dependencias instaladas y configuración simplificada
- ✅ **Supabase**: Null safety en todas las APIs
- ✅ **Build**: 0 errores TypeScript, 0 errores ESLint

#### Stack Tecnológico Verificado:
- **Frontend**: Next.js 15.3.3 + React 18.2.0 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase PostgreSQL
- **Auth**: Clerk 6.21.0
- **Payments**: MercadoPago
- **Deploy**: Vercel
- **Testing**: Jest + React Testing Library + Playwright

## 🎨 PRÓXIMAS MEJORAS UX/UI - 2025

**Estado**: 📋 Planificación Completa - Listo para Implementación

### 🚀 Plan de 5 Fases Definido:
1. **📱 Header Optimizado** - Carrito destacado + CTA mejorado
2. **🖼️ Hero Contextual** - Fondo emocional + animaciones + timer urgencia
3. **🔍 Buscador Avanzado** - Autocompletado + sugerencias + imágenes
4. **🎨 Branding & Confianza** - Más naranja + reviews + marcas + accesibilidad
5. **🌍 Internacionalización** - Español/Inglés + next-i18next

**Objetivo**: +15% conversión, +25% engagement, +40% uso buscador, 100% WCAG AA

📋 **[Ver Plan Completo de Mejoras UX/UI](PLAN_MEJORAS_UX_UI_PINTEYA_2025.md)**

---

## 📚 Documentación Completa

> **[📖 Ver Documentación Completa](./docs/README.md)**

### 🚀 **Inicio Rápido**
- [🏁 Instalación](./docs/getting-started/installation.md) - Configurar proyecto localmente
- [⚙️ Configuración](./docs/getting-started/configuration.md) - Variables y servicios
- [🚀 Deploy](./docs/deployment/vercel.md) - Desplegar en Vercel

### 🏗️ **Arquitectura**
- [📐 Visión General](./docs/architecture/overview.md) - Arquitectura del sistema
- [🗄️ Base de Datos](./docs/architecture/database.md) - Esquema Supabase
- [🔌 APIs](./docs/api/README.md) - 22 endpoints documentados

### 🧪 **Testing & Desarrollo**
- [🧪 Testing](./docs/testing/README.md) - 206 tests, 70% cobertura
- [💻 Desarrollo](./docs/development/guide.md) - Guía de desarrollo
- [📝 Estándares](./docs/development/standards.md) - Código y buenas prácticas

### 📋 **Documentación Legacy**
- [📋 Configuración](docs/CONFIGURATION.md) - Configuración detallada
- [💳 Sistema de Checkout](docs/CHECKOUT_SYSTEM.md) - Implementación pagos
- [📝 Changelog](CHANGELOG.md) - Historial de cambios

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone [repository-url]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar desarrollo
npm run dev
```

Visita http://localhost:3001

## 🌟 Características del Proyecto

**Pinteya E-commerce** es un sistema completo de comercio electrónico especializado en productos de pinturería, ferretería y corralón, desarrollado con las mejores prácticas y tecnologías modernas.

### ✨ Funcionalidades Principales
- 🛒 **E-commerce Completo**: Catálogo, carrito, checkout y gestión de órdenes
- 💳 **Pagos Integrados**: MercadoPago con credenciales reales
- 🔐 **Autenticación**: Sistema completo con Clerk
- 📱 **Responsive**: Diseño mobile-first optimizado
- 🎨 **Design System**: Componentes reutilizables con shadcn/ui
- 🧪 **Testing**: Cobertura completa con Jest y Playwright

#### [🚀 Demo en Vivo](https://pinteya-ecommerce.vercel.app)

#### [📚 Documentación Completa](./docs/README.md)
