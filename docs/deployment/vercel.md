# 🚀 Deploy en Vercel

> Guía completa para desplegar Pinteya E-commerce en Vercel con configuración optimizada

## ✅ Estado del Deploy

**🎉 PROYECTO YA DESPLEGADO Y FUNCIONANDO**

- **URL Producción**: [pinteya-ecommerce.vercel.app](https://pinteya-ecommerce.vercel.app)
- **Estado**: ✅ Activo y estable
- **Build**: ✅ 37 páginas generadas sin errores
- **Performance**: ✅ Optimizado para producción

## 📋 Checklist Pre-Deploy

### ✅ **Requisitos Completados**
- [x] **Repositorio GitHub**: https://github.com/SantiagoXOR/pinteya-ecommerce
- [x] **Build exitoso**: `npm run build` sin errores
- [x] **Tests pasando**: 206/206 tests (100%)
- [x] **Variables de entorno**: Configuradas en Vercel
- [x] **Dependencias**: Compatibles con Vercel
- [x] **TypeScript**: Sin errores de compilación

## 🔧 Configuración de Vercel

### **1. Configuración del Proyecto**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### **2. Variables de Entorno en Vercel**

#### **Supabase (CRÍTICO)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### **MercadoPago (CRÍTICO)**
```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-access-token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-your-public-key
MERCADOPAGO_CLIENT_ID=your-client-id
```

#### **Clerk (OPCIONAL)**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
CLERK_SECRET_KEY=sk_test_your-secret-key
```

#### **URLs de Producción**
```bash
NEXT_PUBLIC_APP_URL=https://pinteya-ecommerce.vercel.app
```

## 🚀 Proceso de Deploy

### **Método 1: Deploy Automático (Recomendado)**
```bash
# 1. Push a main branch
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Vercel detecta automáticamente y despliega
# 3. Deploy completo en ~3-5 minutos
```

### **Método 2: Deploy Manual**
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login en Vercel
vercel login

# 3. Deploy
vercel --prod
```

### **Método 3: Desde Dashboard Vercel**
1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Conecta repositorio GitHub
4. Configura variables de entorno
5. Click "Deploy"

## 📊 Configuración de Build

### **Next.js Configuration**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'aakzspzfulgftqlgwkpb.supabase.co',
      'localhost',
    ],
  },
  serverExternalPackages: ['@clerk/nextjs'],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // ... otras variables
  },
};

module.exports = nextConfig;
```

### **Build Commands**
```json
// package.json
{
  "scripts": {
    "build": "node scripts/check-env.js && next build",
    "build:vercel": "next build",
    "start": "next start"
  }
}
```

## 🔍 Verificación Post-Deploy

### **1. URLs Principales**
```bash
# Página principal
curl -I https://pinteya-ecommerce.vercel.app/

# API de productos
curl https://pinteya-ecommerce.vercel.app/api/products

# Tienda
curl -I https://pinteya-ecommerce.vercel.app/shop
```

### **2. Funcionalidades Críticas**
- ✅ **Carga de productos**: /shop
- ✅ **Búsqueda**: Buscador funcional
- ✅ **Carrito**: Agregar/quitar productos
- ✅ **Checkout**: Proceso completo
- ✅ **APIs**: 22 endpoints funcionando

### **3. Performance**
```bash
# Lighthouse CI (opcional)
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage
```

## 📈 Optimizaciones de Producción

### **1. Performance**
- ✅ **Static Generation**: Páginas estáticas
- ✅ **Image Optimization**: Next.js Image component
- ✅ **Code Splitting**: Automático con Next.js
- ✅ **CDN**: Vercel Edge Network

### **2. SEO**
- ✅ **Metadata**: Configurado en layout.tsx
- ✅ **Sitemap**: Generado automáticamente
- ✅ **Robots.txt**: Configurado
- ✅ **Open Graph**: Meta tags implementados

### **3. Security**
- ✅ **HTTPS**: Automático en Vercel
- ✅ **Headers**: Security headers configurados
- ✅ **CORS**: Configuración restrictiva
- ✅ **Rate Limiting**: Implementado en APIs

## 🔧 Configuración de Dominios

### **Dominio Personalizado (Opcional)**
```bash
# 1. En Vercel Dashboard > Settings > Domains
# 2. Agregar dominio: pinteya.com
# 3. Configurar DNS records:
#    A record: @ → 76.76.19.61
#    CNAME: www → cname.vercel-dns.com
```

### **SSL Certificate**
- ✅ **Automático**: Vercel maneja SSL automáticamente
- ✅ **Let's Encrypt**: Certificados gratuitos
- ✅ **Auto-renewal**: Renovación automática

## 📊 Monitoring y Analytics

### **Vercel Analytics**
```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### **Error Tracking**
- ✅ **Vercel Functions**: Logs automáticos
- ✅ **Error Boundaries**: Captura de errores React
- ✅ **API Monitoring**: Logs de endpoints

## 🚨 Troubleshooting

### **Build Errors**
```bash
# Error: React compatibility
# Solución: Usar React 18.2.0
npm install react@18.2.0 react-dom@18.2.0

# Error: TypeScript
# Solución: Verificar tipos
npm run build
```

### **Runtime Errors**
```bash
# Error: Variables de entorno
# Verificar en Vercel Dashboard > Settings > Environment Variables

# Error: Database connection
# Verificar Supabase credentials
```

### **Performance Issues**
```bash
# Verificar bundle size
npm run build
# Revisar .next/analyze

# Optimizar imágenes
# Usar Next.js Image component
```

## 🔄 CI/CD Pipeline

### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📋 Checklist Post-Deploy

- [ ] ✅ Aplicación carga correctamente
- [ ] ✅ APIs responden (22 endpoints)
- [ ] ✅ Base de datos conectada
- [ ] ✅ Autenticación funciona
- [ ] ✅ Pagos configurados
- [ ] ✅ Performance optimizada
- [ ] ✅ SEO configurado
- [ ] ✅ Analytics habilitado
- [ ] ✅ Error tracking activo
- [ ] ✅ Dominio configurado (opcional)

## 🎯 Próximos Pasos

Después del deploy exitoso:

1. **[📊 Monitoring](./monitoring.md)** - Configurar monitoreo
2. **[⚙️ Variables de Producción](./environment.md)** - Optimizar configuración
3. **[🔧 Troubleshooting](./troubleshooting.md)** - Solución de problemas

---

**🎉 ¡Felicitaciones! Tu aplicación está en producción:**
**[pinteya-ecommerce.vercel.app](https://pinteya-ecommerce.vercel.app)**
