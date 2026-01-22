# 🏁 Guía de Instalación

> Guía paso a paso para configurar el proyecto Pinteya E-commerce en tu entorno local

## 📋 Prerrequisitos

### **Software Requerido**

- **Node.js**: v18.17.0 o superior
- **npm**: v9.0.0 o superior (incluido con Node.js)
- **Git**: Para clonar el repositorio
- **Editor**: VS Code recomendado

### **Verificar Instalación**

```bash
node --version    # v18.17.0+
npm --version     # v9.0.0+
git --version     # v2.30.0+
```

## 🚀 Instalación Rápida

### **1. Clonar Repositorio**

```bash
# Clonar desde GitHub
git clone https://github.com/SantiagoXOR/pintureria-digital.git

# Navegar al directorio
cd pintureria-digital
```

### **2. Instalar Dependencias**

```bash
# Instalar todas las dependencias
npm install

# Verificar instalación
npm list --depth=0
```

### **3. Configurar Variables de Entorno**

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar variables (ver sección siguiente)
nano .env.local
```

### **4. Iniciar Desarrollo**

```bash
# Iniciar servidor de desarrollo con Turbopack (recomendado - 5-10x más rápido)
npm run dev:turbo

# O iniciar servidor de desarrollo tradicional
npm run dev

# La aplicación estará disponible en:
# http://localhost:3000
```

> **💡 Nota:** Se recomienda usar `npm run dev:turbo` para compilación más rápida (Next.js 16 con Turbopack)

## ⚙️ Variables de Entorno

### **Archivo `.env.local`**

```bash
# Supabase Configuration (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=https://aakzspzfulgftqlgwkpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# NextAuth Authentication (REQUERIDO)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-generado-con-openssl-rand-base64-32
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# MercadoPago Payment Gateway (OPCIONAL para desarrollo)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key
MERCADOPAGO_CLIENT_ID=tu-client-id

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Obtener Credenciales**

#### **Supabase** (Requerido)

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Ve a Settings > API
5. Copia las keys necesarias

#### **NextAuth con Google OAuth** (Requerido)

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. Agrega `http://localhost:3000/api/auth/callback/google` como URI de redirección
6. Copia el Client ID y Client Secret
7. Genera `NEXTAUTH_SECRET` con: `openssl rand -base64 32`

#### **MercadoPago** (Opcional)

1. Ve a [mercadopago.com.ar/developers](https://mercadopago.com.ar/developers)
2. Crea una cuenta de desarrollador
3. Crea una aplicación
4. Obtén las credenciales de test

## 📦 Dependencias Principales

### **Producción**

```json
{
  "next": "^16.0.8",
  "react": "^18.3.1",
  "typescript": "^5.7.3",
  "next-auth": "^5.0.0-beta.29",
  "@supabase/supabase-js": "^2.50.0",
  "mercadopago": "^2.7.0",
  "tailwindcss": "^3.4.17",
  "@radix-ui/react-dialog": "^1.1.14",
  "react-hook-form": "^7.57.0",
  "zod": "^3.25.56"
}
```

### **Desarrollo**

```json
{
  "@testing-library/react": "^16.3.0",
  "@playwright/test": "^1.53.0",
  "jest": "^29.7.0",
  "eslint": "^9.18.0",
  "prettier": "^3.5.3",
  "typescript": "^5.7.3"
}
```

## 🔧 Scripts Disponibles

### **Desarrollo**

```bash
npm run dev          # Iniciar servidor de desarrollo (tradicional)
npm run dev:turbo    # Iniciar servidor con Turbopack (recomendado - más rápido)
npm run build        # Construir para producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar ESLint
```

### **Testing**

```bash
npm test             # Ejecutar tests unitarios
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con cobertura
npm run test:e2e     # Tests End-to-End
```

### **Formato**

```bash
npm run format       # Formatear código con Prettier
npm run format:check # Verificar formato
```

## 🗄️ Base de Datos

### **Configuración Automática**

El proyecto incluye datos de ejemplo que se cargan automáticamente:

- **22 productos** de marcas argentinas
- **6 categorías** de pinturería
- **Usuarios de prueba**
- **Órdenes de ejemplo**

### **Migraciones**

```bash
# Las migraciones están en /supabase/migrations/
# Se aplican automáticamente en Supabase
```

## 🧪 Verificar Instalación

### **1. Servidor de Desarrollo**

```bash
npm run dev:turbo
# Debería mostrar: Ready - started server on 0.0.0.0:3000
# Con Turbopack habilitado para compilación más rápida
```

### **2. Build de Producción**

```bash
npm run build
# Debería completarse sin errores
```

### **3. Tests**

```bash
npm test
# Debería pasar todos los tests (206/206)
```

### **4. Linting**

```bash
npm run lint
# No debería mostrar errores
```

## 🚨 Solución de Problemas

### **Error: Puerto 3000 en uso**

```bash
# Cambiar puerto en package.json
"dev": "next dev --turbo -p 3001"

# O matar proceso existente
# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

### **Error: Dependencias**

```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### **Error: Variables de entorno**

```bash
# Verificar archivo .env.local existe
ls -la .env.local

# Verificar formato (sin espacios extra)
cat .env.local
```

### **Error: Base de datos**

```bash
# Verificar conexión a Supabase
npm run test:api
```

## 📱 Configuración de Editor

### **VS Code Extensions Recomendadas**

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright",
    "orta.vscode-jest"
  ]
}
```

### **Configuración VS Code**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## ✅ Checklist de Instalación

- [ ] Node.js v18.17.0+ instalado
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Servidor de desarrollo funcionando (`npm run dev`)
- [ ] Tests pasando (`npm test`)
- [ ] Build exitoso (`npm run build`)
- [ ] Aplicación accesible en http://localhost:3000

## 🔗 Próximos Pasos

Una vez completada la instalación:

1. **[⚙️ Configuración Inicial](./configuration.md)** - Configurar servicios
2. **[🔧 Variables de Entorno](./environment.md)** - Configuración detallada
3. **[🚀 Deploy](./deployment.md)** - Desplegar en Vercel

---

_¿Problemas con la instalación? Consulta la [🔧 Guía de Troubleshooting](../deployment/troubleshooting.md)_
