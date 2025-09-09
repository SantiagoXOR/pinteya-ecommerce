# 📸 Sistema de Screenshots Automatizado

**Proyecto:** Pinteya E-commerce  
**Fecha:** Enero 2025  
**Estado:** ✅ Implementado y funcional

---

## 🎯 **DESCRIPCIÓN**

Sistema completo para generar, gestionar y visualizar screenshots automáticos del flujo de compra sin autenticación en el dashboard de test-reports.

### ✅ **Características Implementadas:**
- **Generación automática** de 15+ screenshots por flujo
- **API endpoints** para gestión de screenshots
- **Dashboard integrado** con visualización timeline y grid
- **Scripts de línea de comandos** para ejecución manual
- **Limpieza automática** de screenshots antiguos

---

## 🚀 **INSTALACIÓN Y CONFIGURACIÓN**

### **Prerequisitos:**
```bash
# Playwright debe estar instalado
npx playwright install

# Servidor debe estar corriendo
npm run dev
```

### **Verificar Configuración:**
```bash
# Verificar que el servidor responde
curl http://localhost:3000/api/health

# Verificar directorio de screenshots
ls -la public/test-screenshots/
```

---

## 📋 **USO DEL SISTEMA**

### **1. Generar Screenshots desde Dashboard**

1. **Abrir dashboard:** http://localhost:3000/admin/test-reports
2. **Ir a pestaña:** "Flujo Checkout"
3. **Hacer clic:** "Generar Screenshots"
4. **Esperar:** 30-60 segundos para completar
5. **Verificar:** Screenshots aparecen en timeline

### **2. Generar Screenshots desde Línea de Comandos**

```bash
# Generar screenshots del flujo de checkout
npm run screenshots:checkout

# O ejecutar directamente
node scripts/generate-checkout-screenshots.js

# Limpiar screenshots antiguos
npm run screenshots:clean
```

### **3. Usar API Endpoints**

```bash
# Generar screenshots vía API
curl -X POST http://localhost:3000/api/admin/generate-screenshots \
  -H "Content-Type: application/json" \
  -d '{"flow": "checkout"}'

# Listar screenshots existentes
curl http://localhost:3000/api/test-screenshots

# Limpiar screenshots antiguos (más de 24 horas)
curl -X DELETE "http://localhost:3000/api/test-screenshots?olderThan=24"
```

---

## 📊 **SCREENSHOTS GENERADOS**

### **Flujo Completo (15 Screenshots):**

#### **Setup (2 screenshots):**
- `setup-shop-page` - Página de tienda cargada
- `setup-product-added` - Producto agregado al carrito

#### **Paso 1: Navegación (3 screenshots):**
- `step1-cart-sidebar` - Sidebar del carrito abierto
- `step1-checkout-transition` - Transición a checkout
- `step1-checkout-page` - Página de checkout cargada

#### **Paso 2: Formulario (3 screenshots):**
- `step2-form-initial` - Formulario inicial
- `step2-form-sections` - Secciones resaltadas
- `step3-validation-errors` - Errores de validación

#### **Paso 3: Validación (2 screenshots):**
- `step3-email-error` - Error de email inválido
- `step4-personal-filled` - Información personal completada

#### **Paso 4: Completado (5 screenshots):**
- `step4-address-filled` - Dirección completada
- `step4-pre-submit` - Formulario listo para envío
- `step4-loading-state` - Estado de carga
- `step4-final-redirect` - Redirección exitosa

---

## 🛠 **CONFIGURACIÓN TÉCNICA**

### **Estructura de Archivos:**
```
public/
└── test-screenshots/           # Screenshots generados
    ├── metadata.json          # Metadatos de generación
    └── *.png                  # Archivos de imagen

scripts/
└── generate-checkout-screenshots.js  # Script principal

src/app/api/
├── test-screenshots/          # API para gestión
├── admin/generate-screenshots/ # API para generación
└── health/                    # Health check
```

### **Configuración del Script:**
```javascript
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotsDir: 'public/test-screenshots',
  viewport: { width: 1920, height: 1080 },
  timeout: 30000
};
```

### **Pasos Configurables:**
```javascript
const CHECKOUT_STEPS = [
  {
    id: 'step-id',
    name: 'Nombre descriptivo',
    url: '/ruta',
    selector: '[data-testid="elemento"]', // Opcional
    action: async (page) => { /* Acción personalizada */ },
    description: 'Descripción del paso'
  }
];
```

---

## 🔧 **PERSONALIZACIÓN**

### **Agregar Nuevos Pasos:**

1. **Editar script:** `scripts/generate-checkout-screenshots.js`
2. **Agregar paso:** al array `CHECKOUT_STEPS`
3. **Definir acción:** función async personalizada
4. **Ejecutar:** `npm run screenshots:checkout`

### **Ejemplo de Nuevo Paso:**
```javascript
{
  id: 'step-custom',
  name: 'Mi paso personalizado',
  url: '/mi-pagina',
  action: async (page) => {
    await page.click('[data-testid="mi-boton"]');
    await page.waitForTimeout(1000);
    
    // Resaltar elemento
    await page.evaluate(() => {
      const element = document.querySelector('[data-testid="mi-elemento"]');
      if (element) {
        element.style.border = '2px solid #3b82f6';
      }
    });
  },
  description: 'Descripción de mi paso personalizado'
}
```

### **Configurar Calidad de Screenshots:**
```javascript
await page.screenshot({
  path: filepath,
  fullPage: true,        // Página completa
  type: 'png',          // Formato
  quality: 90,          // Solo para JPEG
  clip: {               // Área específica
    x: 0, y: 0,
    width: 1200, height: 800
  }
});
```

---

## 📈 **MONITOREO Y DEBUGGING**

### **Logs del Sistema:**
```bash
# Ver logs en tiempo real
tail -f logs/screenshots.log

# Logs en consola del navegador
console.log('📸 Screenshot capturado: step-name')
console.log('⚡ Métricas step-name:', metrics)
```

### **Verificar Estado:**
```bash
# Verificar API de screenshots
curl http://localhost:3000/api/test-screenshots

# Verificar generación específica
curl "http://localhost:3000/api/admin/generate-screenshots?flow=checkout"

# Ver metadata de screenshots
cat public/test-screenshots/metadata.json
```

### **Troubleshooting Común:**

#### **Error: "Servidor no disponible"**
```bash
# Verificar que el servidor esté corriendo
npm run dev
curl http://localhost:3000/api/health
```

#### **Error: "Elemento no encontrado"**
```javascript
// Agregar esperas más largas
await page.waitForSelector('[data-testid="elemento"]', { timeout: 15000 });

// Verificar que el elemento existe
const element = await page.locator('[data-testid="elemento"]');
await expect(element).toBeVisible();
```

#### **Screenshots en blanco o incompletos**
```javascript
// Esperar a que la página se estabilice
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

// Verificar viewport
await page.setViewportSize({ width: 1920, height: 1080 });
```

---

## 🎯 **MEJORES PRÁCTICAS**

### **1. Naming Convention:**
- Usar prefijos: `setup-`, `step1-`, `step2-`, etc.
- Nombres descriptivos: `cart-sidebar`, `form-validation`
- Incluir timestamp automático

### **2. Optimización de Performance:**
```javascript
// Deshabilitar imágenes para tests más rápidos
await page.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort());

// Usar headless mode
const browser = await chromium.launch({ headless: true });

// Configurar timeouts apropiados
await page.setDefaultTimeout(10000);
```

### **3. Gestión de Archivos:**
```bash
# Limpiar screenshots antiguos automáticamente
find public/test-screenshots -name "*.png" -mtime +7 -delete

# Comprimir screenshots para almacenamiento
for file in public/test-screenshots/*.png; do
  pngquant --quality=65-80 --output "${file%.png}-compressed.png" "$file"
done
```

---

## 🔗 **INTEGRACIÓN CON TESTS**

### **Usar en Tests E2E:**
```typescript
import { captureStepScreenshot } from '../helpers/screenshot-helpers';

test('Flujo de checkout con screenshots', async ({ page }) => {
  await page.goto('/shop');
  await captureStepScreenshot(page, 'shop-loaded', 'Página de tienda cargada');
  
  await page.click('[data-testid="add-to-cart-btn"]');
  await captureStepScreenshot(page, 'product-added', 'Producto agregado');
  
  // ... resto del test
});
```

### **Integrar con CI/CD:**
```yaml
# .github/workflows/screenshots.yml
- name: Generate Screenshots
  run: |
    npm run dev &
    sleep 10
    npm run screenshots:checkout
    
- name: Upload Screenshots
  uses: actions/upload-artifact@v3
  with:
    name: test-screenshots
    path: public/test-screenshots/
```

---

## 📞 **SOPORTE**

### **Recursos:**
- **Dashboard:** http://localhost:3000/admin/test-reports
- **API Docs:** `/api/test-screenshots` y `/api/admin/generate-screenshots`
- **Scripts:** `scripts/generate-checkout-screenshots.js`

### **Contacto:**
- **GitHub Issues:** Para reportar bugs
- **Documentación:** `docs/testing/`
- **Logs:** `console.log` en desarrollo

---

**✅ Sistema de Screenshots Implementado**  
**📸 15+ screenshots automáticos**  
**🎯 Dashboard integrado**  
**🚀 API completa**

*Última actualización: Enero 2025*
