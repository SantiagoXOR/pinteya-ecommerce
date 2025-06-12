# ✅ **CHECKLIST DE CONFIGURACIÓN SUPABASE**

## 🎯 **OBJETIVO**
Configurar Supabase completamente para que Pinteya tenga una base de datos funcional.

---

## 📋 **PASOS A SEGUIR**

### **1. ✅ Crear Proyecto en Supabase**
- [ ] Ir a [https://supabase.com](https://supabase.com)
- [ ] Crear cuenta o iniciar sesión
- [ ] Hacer clic en "New Project"
- [ ] Completar datos:
  - **Name**: `pinteya-ecommerce`
  - **Database Password**: (generar y guardar)
  - **Region**: `South America (São Paulo)`
- [ ] Esperar a que se cree el proyecto (1-2 minutos)

### **2. ✅ Obtener Credenciales**
- [ ] Ir a **Settings > API** en el dashboard
- [ ] Copiar **Project URL**: `https://xxxxx.supabase.co`
- [ ] Copiar **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] Copiar **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **3. ✅ Actualizar Variables de Entorno**
- [ ] Abrir `.env.local`
- [ ] Reemplazar valores de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-real.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_real_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_real_aqui
```

### **4. ✅ Ejecutar Esquema de Base de Datos**
- [ ] Ir a **SQL Editor** en Supabase
- [ ] Crear nueva query
- [ ] Copiar contenido completo de `supabase-schema.sql`
- [ ] Hacer clic en "Run" para ejecutar
- [ ] Verificar que no haya errores

### **5. ✅ Poblar con Datos Iniciales**
- [ ] En **SQL Editor**, crear nueva query
- [ ] Copiar contenido de `migrate-products.sql`
- [ ] Hacer clic en "Run" para ejecutar
- [ ] Verificar que se insertaron los productos

### **6. ✅ Actualizar next.config.js**
- [ ] Abrir `next.config.js`
- [ ] Reemplazar `your-project.supabase.co` con tu URL real
- [ ] Guardar cambios

### **7. ✅ Probar Conexión**
- [ ] Reiniciar servidor de desarrollo: `npm run dev`
- [ ] Ir a `http://localhost:3000/api/test`
- [ ] Verificar que todos los tests pasen ✅

---

## 🔍 **VERIFICACIONES**

### **Verificar en Supabase Dashboard:**
- [ ] **Table Editor**: Ver que existen las tablas (users, categories, products, orders, order_items)
- [ ] **Table Editor > categories**: Ver que hay 5+ categorías
- [ ] **Table Editor > products**: Ver que hay 12+ productos
- [ ] **Authentication > Settings**: RLS habilitado en tablas sensibles

### **Verificar en la aplicación:**
- [ ] `http://localhost:3000/api/test` → Todos los tests ✅
- [ ] `http://localhost:3000/api/products` → Lista de productos
- [ ] `http://localhost:3000/api/categories` → Lista de categorías
- [ ] `http://localhost:3000/api/products/1` → Producto específico

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Error: "Invalid API key"**
- Verificar que las variables de entorno estén correctas
- Asegurarse de que no haya espacios extra
- Reiniciar el servidor de desarrollo

### **Error: "relation does not exist"**
- El esquema SQL no se ejecutó correctamente
- Volver a ejecutar `supabase-schema.sql`
- Verificar que no haya errores en la consola SQL

### **Error: "Row Level Security"**
- Las políticas RLS están bloqueando el acceso
- Verificar que las políticas se crearon correctamente
- Temporalmente deshabilitar RLS para testing

### **Error: "Connection timeout"**
- Verificar la región del proyecto (usar South America)
- Verificar conexión a internet
- Intentar desde otra red

---

## 📊 **ESTADO ACTUAL**

Marca cada elemento cuando esté completado:

**Configuración básica:**
- [ ] Proyecto creado
- [ ] Credenciales obtenidas
- [ ] Variables de entorno actualizadas

**Base de datos:**
- [ ] Esquema ejecutado
- [ ] Datos migrados
- [ ] Tablas verificadas

**Testing:**
- [ ] Conexión probada
- [ ] API funcionando
- [ ] Datos accesibles

---

## 🎯 **SIGUIENTE PASO**

Una vez completado este checklist:
✅ **Conectar primer componente** - Modificar `Shop/index.tsx` para usar datos reales de la API

---

**¿Estás listo para empezar? ¡Vamos paso a paso!** 🚀
