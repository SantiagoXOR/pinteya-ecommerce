# 🧪 **INSTRUCCIONES PARA PROBAR PINTEYA E-COMMERCE**

## 🎯 **RESUMEN**

Pinteya está **100% completado** con credenciales reales de MercadoPago. Estas son las instrucciones para probar todas las funcionalidades.

---

## 🚀 **PASO 1: INICIAR LA APLICACIÓN**

```bash
# En la terminal, desde la raíz del proyecto
npm run dev
```

**Resultado esperado:**
- Aplicación corriendo en `http://localhost:3001`
- Sin errores en consola
- Página de inicio cargando correctamente

---

## 🔐 **PASO 2: PROBAR AUTENTICACIÓN**

### **Registro de Usuario**
1. Ir a `http://localhost:3001/signup`
2. Completar formulario de registro
3. Verificar redirección a `/shop`
4. Confirmar que aparece UserButton en header

### **Inicio de Sesión**
1. Ir a `http://localhost:3001/signin`
2. Usar credenciales creadas
3. Verificar login exitoso
4. Confirmar navegación autenticada

**Resultado esperado:**
- ✅ Registro funcionando
- ✅ Login funcionando
- ✅ UserButton visible
- ✅ Protección de rutas activa

---

## 🛍️ **PASO 3: PROBAR SHOP Y PRODUCTOS**

### **Navegación de Productos**
1. Ir a `http://localhost:3001/shop`
2. Verificar que cargan 22 productos de pinturería
3. Probar filtros por categoría
4. Usar barra de búsqueda
5. Hacer clic en un producto para ver detalles

### **Carrito de Compras**
1. Agregar productos al carrito
2. Abrir sidebar del carrito
3. Modificar cantidades
4. Verificar cálculos de precios

**Resultado esperado:**
- ✅ Productos cargando desde Supabase
- ✅ Filtros funcionando
- ✅ Búsqueda operativa
- ✅ Carrito funcional

---

## 💳 **PASO 4: PROBAR CHECKOUT Y PAGOS**

### **Proceso de Checkout**
1. Con productos en el carrito, ir a `/checkout`
2. Completar formulario de facturación:
   ```
   Nombre: Test
   Apellido: Usuario
   Email: test@pinteya.com
   Teléfono: 1234567890
   Dirección: Av. Corrientes 1234
   Ciudad: Buenos Aires
   Código Postal: 1043
   ```
3. Hacer clic en "Procesar Pedido"
4. **IMPORTANTE**: Verificar redirección a MercadoPago REAL

### **Verificación de MercadoPago**
- Deberías ser redirigido a la página oficial de MercadoPago
- URL debe contener `mercadopago.com.ar`
- Página debe mostrar opciones de pago reales
- **NO completar el pago** (es un test)

**Resultado esperado:**
- ✅ Formulario de checkout funcional
- ✅ Redirección a MercadoPago real
- ✅ Página de pago oficial cargando

---

## 👤 **PASO 5: PROBAR ÁREA DE USUARIO**

### **Dashboard de Usuario**
1. Ir a `http://localhost:3001/my-account`
2. Verificar estadísticas del usuario
3. Revisar información del perfil

### **Gestión de Direcciones**
1. En el área de usuario, ir a "Direcciones"
2. Agregar nueva dirección
3. Editar dirección existente
4. Eliminar dirección

### **Historial de Órdenes**
1. Ir a sección "Órdenes"
2. Verificar que aparecen órdenes de prueba
3. Probar paginación si hay muchas órdenes

**Resultado esperado:**
- ✅ Dashboard con datos reales
- ✅ Gestión de direcciones funcional
- ✅ Historial de órdenes operativo

---

## 🔧 **PASO 6: PROBAR APIS (OPCIONAL)**

### **Test en Consola del Navegador**
1. Abrir DevTools (F12)
2. Ir a la pestaña "Console"
3. Ejecutar:
   ```javascript
   // Importar función de test
   import('/src/utils/testMercadoPago.js').then(module => {
     module.runMercadoPagoTest();
   });
   ```

### **Test Manual de APIs**
```bash
# Probar API de productos
curl http://localhost:3001/api/products

# Probar API de categorías
curl http://localhost:3001/api/categories

# Probar API de test
curl http://localhost:3001/api/test
```

**Resultado esperado:**
- ✅ APIs respondiendo correctamente
- ✅ Datos de Supabase cargando
- ✅ Test de MercadoPago exitoso

---

## 📊 **CHECKLIST DE VERIFICACIÓN**

### **Funcionalidades Core**
- [ ] Aplicación inicia sin errores
- [ ] Registro de usuario funciona
- [ ] Login/logout operativo
- [ ] Productos cargan desde base de datos
- [ ] Carrito funcional
- [ ] Checkout redirige a MercadoPago real
- [ ] Área de usuario operativa

### **Integraciones**
- [ ] Clerk autenticación funcionando
- [ ] Supabase conectado
- [ ] MercadoPago configurado
- [ ] APIs respondiendo

### **UI/UX**
- [ ] Diseño responsive
- [ ] Navegación fluida
- [ ] Formularios validando
- [ ] Loading states visibles

---

## 🚨 **PROBLEMAS COMUNES Y SOLUCIONES**

### **Error "Failed to fetch"**
- **Causa**: Servidor no iniciado
- **Solución**: Ejecutar `npm run dev`

### **Error de autenticación**
- **Causa**: Variables de Clerk mal configuradas
- **Solución**: Verificar `.env.local`

### **Productos no cargan**
- **Causa**: Conexión a Supabase
- **Solución**: Verificar credenciales de Supabase

### **MercadoPago no funciona**
- **Causa**: Credenciales incorrectas
- **Solución**: Verificar variables de MercadoPago en `.env.local`

---

## 🎉 **RESULTADO ESPERADO FINAL**

Al completar todas las pruebas, deberías tener:

✅ **E-commerce completamente funcional**
✅ **Autenticación real con Clerk**
✅ **Productos dinámicos desde Supabase**
✅ **Sistema de pagos con MercadoPago real**
✅ **Área de usuario completa**
✅ **APIs operativas**

**¡Pinteya está listo para producción!**

---

## 📞 **SOPORTE**

Si encuentras algún problema:
1. Verificar variables de entorno en `.env.local`
2. Revisar consola del navegador para errores
3. Verificar que todas las dependencias estén instaladas
4. Contactar para soporte técnico

**Estado del proyecto**: ✅ 100% COMPLETADO
