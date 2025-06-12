# Pinteya E-commerce

E-commerce especializado en productos de pinturería, ferretería y corralón, desarrollado con Next.js 15, TypeScript, Tailwind CSS, Supabase, Clerk y MercadoPago.

## 🚀 Estado del Proyecto

**PROYECTO COMPLETADO AL 100%** ✅

Todas las funcionalidades principales han sido implementadas y están funcionando correctamente:

- ✅ Backend completo con Supabase
- ✅ Productos dinámicos y categorías
- ✅ **Sistema de pagos con MercadoPago 100% FUNCIONAL**
- ✅ Área de usuario completa
- ✅ Autenticación con Clerk
- ✅ 22 APIs funcionando
- ✅ Base de datos poblada con productos reales
- ✅ Dashboard de usuario con datos reales
- ✅ **Checkout completo y operativo**
- ✅ Aplicación estable en localhost:3001

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

## 📚 Documentación

- [📋 Configuración Completa](docs/CONFIGURATION.md)
- [💳 Sistema de Checkout](docs/CHECKOUT_SYSTEM.md)

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

### NextMerce Free VS NextMerce Pro

| ✨ Features                         | 🎁 NextMerce Free                 | 🔥 NextMerce Pro                        |
|----------------------------------|--------------------------------|--------------------------------------|
| Next.js Pages                    | Static                         | Dynamic Boilerplate Template         |
| Components                       | Limited                        | All According to Demo                |
| eCommerce Functionality          | Included                       | Included                             |
| Integrations (DB, Auth, etc.)    | Not Included                   | Included                             |
| Community Support                | Included                       | Included                             |
| Premium Email Support            | Not Included                   | Included                             |
| Lifetime Free Updates            | Included                       | Included                             |


#### [🚀 Live Demo](https://demo.nextmerce.com/)

#### [🌐 Visit Website](https://nextmerce.com/)
