# Guía de Verificación de Google Ads Conversion Tracking

## 📋 Estado Actual

Según las capturas de pantalla de Google Ads:
- ✅ Las acciones de conversión están creadas ("Compra" y "Compra (1)")
- ⚠️ Estado: **"Inactiva"** - Esto es normal hasta que Google verifique las etiquetas
- ⚠️ Configuración: **"Incorrecta"** - Se resolverá después de la verificación

## 🔍 Cómo Verificar que las Etiquetas Están Instaladas Correctamente

### 1. Verificación Manual en el Navegador

1. **Abre tu sitio web en producción** (https://www.pinteya.com)
2. **Abre las Herramientas de Desarrollador** (F12)
3. **Ve a la pestaña "Console"** y busca:
   ```javascript
   // Deberías ver estos mensajes si todo está bien:
   window.gtag // Debe existir
   window.dataLayer // Debe ser un array
   ```

4. **Ve a la pestaña "Network"** y filtra por "gtag":
   - Deberías ver peticiones a `googletagmanager.com/gtag/js?id=G-MN070Y406E`
   - Deberías ver peticiones a `googletagmanager.com/gtag/js?id=AW-17767977006`

5. **Verifica en la consola del navegador:**
   ```javascript
   // Ejecuta esto en la consola:
   window.dataLayer.filter(item => item[0] === 'config')
   // Deberías ver configuraciones para G-MN070Y406E y AW-17767977006
   ```

### 2. Verificación en Página de Conversión

1. **Navega a una página de éxito** (simula una compra o usa una URL de prueba):
   - `/checkout/success?payment_id=test&status=approved`
   - `/checkout/mercadopago-success?order_id=test`
   - `/checkout/cash-success?orderId=test`

2. **Abre la consola del navegador** y verifica:
   ```javascript
   // Busca eventos de conversión en dataLayer
   window.dataLayer.filter(item => 
     item[0] === 'event' && 
     item[1] === 'conversion'
   )
   // Deberías ver un evento con send_to: 'AW-17767977006/pWuOCOrskMkbEK6gt5hC'
   ```

### 3. Usar Google Tag Assistant (Recomendado)

**Nota:** Tag Assistant solo funciona en sitios en producción, no en localhost.

1. **Instala la extensión de Chrome:**
   - Ve a: https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk
   - O busca "Google Tag Assistant" en Chrome Web Store

2. **Abre tu sitio en producción**

3. **Haz clic en el icono de Tag Assistant** en la barra de herramientas

4. **Haz clic en "Enable"** para activar el debugging

5. **Recarga la página** y verifica:
   - ✅ Debe detectar `G-MN070Y406E` (Google tag)
   - ✅ Debe detectar `AW-17767977006` (Google Ads)

6. **Navega a una página de conversión** y verifica:
   - ✅ Debe detectar el evento de conversión con `send_to: AW-17767977006/pWuOCOrskMkbEK6gt5hC`

### 4. Verificación en Google Ads

1. **Ve a Google Ads** → Herramientas y configuración → Conversiones

2. **Haz clic en "Compra (1)"** o la acción de conversión que quieras verificar

3. **Haz clic en "Verificar etiqueta"** o "Tag Assistant"

4. **Ingresa la URL de tu página de conversión:**
   - Ejemplo: `https://www.pinteya.com/checkout/success?payment_id=test&status=approved`

5. **Google verificará automáticamente** si la etiqueta está instalada correctamente

## ⏱️ Tiempos de Verificación

- **Verificación automática:** 24-48 horas después de la instalación
- **Primera conversión registrada:** Puede tardar hasta 3 horas después de una conversión real
- **Estado "Activa":** Se activará automáticamente cuando Google detecte las etiquetas correctamente instaladas

## 🐛 Solución de Problemas

### Problema: Las conversiones aparecen como "Inactivas"

**Causas posibles:**
1. ✅ **Normal:** Google puede tardar 24-48 horas en verificar
2. ⚠️ **Etiquetas no instaladas:** Verifica que los scripts se carguen en producción
3. ⚠️ **Sitio en desarrollo:** Las etiquetas deben estar en producción para que Google las verifique

**Solución:**
- Espera 24-48 horas
- Verifica que el sitio esté en producción
- Usa Tag Assistant para verificar manualmente

### Problema: Tag Assistant no se conecta

**Causas posibles:**
1. ⚠️ **Sitio en localhost:** Tag Assistant solo funciona en sitios públicos
2. ⚠️ **Problemas de CORS:** El sitio debe estar accesible públicamente
3. ⚠️ **Timeout:** El sitio puede tardar en responder

**Solución:**
- Asegúrate de que el sitio esté desplegado en producción
- Verifica que el sitio sea accesible públicamente
- Intenta usar la extensión de Chrome en lugar de la versión web

### Problema: No se detectan eventos de conversión

**Verifica:**
1. ✅ Que el `transaction_id` se esté pasando correctamente
2. ✅ Que el evento se dispare en la página de éxito
3. ✅ Que `window.gtag` esté disponible cuando se dispara el evento

**Debug en consola:**
```javascript
// En la página de éxito, ejecuta:
console.log('gtag disponible:', typeof window.gtag === 'function')
console.log('dataLayer:', window.dataLayer)
```

## ✅ Checklist de Verificación

- [ ] Scripts de Google tag cargados en todas las páginas
- [ ] Configuración de `AW-17767977006` presente en todas las páginas
- [ ] Evento de conversión disparado en páginas de éxito
- [ ] `transaction_id` dinámico funcionando correctamente
- [ ] Tag Assistant detecta las etiquetas (en producción)
- [ ] Google Ads muestra "Verificando" o "Activa" después de 24-48 horas

## 📞 Próximos Pasos

1. **Despliega los cambios a producción**
2. **Espera 24-48 horas** para la verificación automática
3. **Realiza una conversión de prueba** (si es posible)
4. **Verifica en Google Ads** que el estado cambie a "Activa"
5. **Monitorea las conversiones** en los próximos días

## 🔗 Enlaces Útiles

- [Google Tag Assistant](https://tagassistant.google.com/)
- [Google Ads Help - Conversion Tracking](https://support.google.com/google-ads/answer/1722054)
- [Verificar etiquetas en Google Ads](https://support.google.com/google-ads/answer/6331314)




