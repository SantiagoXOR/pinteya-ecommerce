# ✅ Checklist de Deployment - Optimizaciones de Performance

## 📋 Pre-Deployment

### 1. Verificar cambios localmente

```bash
# Instalar dependencias si es necesario
npm install

# Build de prueba
npm run build

# Verificar que no hay errores
# ✓ Build exitoso
# ✓ No hay errores de TypeScript
# ✓ No hay warnings críticos
```

### 2. Analizar bundles

```bash
# Ejecutar bundle analyzer
npm run analyze

# Verificar en el navegador:
# ✓ Framework bundle < 150KB
# ✓ Vendors bundle < 200KB
# ✓ Páginas individuales < 50KB
```

### 3. Analizar imágenes (opcional pero recomendado)

```bash
# Ejecutar análisis de imágenes
npm run optimize:images

# Revisar image-optimization-report.json
# Nota: La optimización de imágenes puede hacerse después del deploy
```

---

## 🚀 Deployment

### 1. Commit y Push

```bash
# Agregar todos los cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat(performance): implementar optimizaciones de carga y performance

- Configurar bundle analyzer y speed insights
- Implementar lazy loading en componentes pesados
- Optimizar providers con React.memo
- Agregar preload de fuentes críticas
- Mejorar configuración de Next.js (swcMinify, modularizeImports)
- Optimizar code splitting con cache groups avanzados
- Mejorar configuración de imágenes
- Agregar scripts de análisis de performance
- Documentar proceso completo de optimización"

# Push a tu rama
git push origin main
# O tu rama de trabajo: git push origin feature/performance-optimization
```

### 2. Verificar Deploy en Vercel

1. Ve a tu dashboard de Vercel
2. Espera a que el deploy termine (~2-3 minutos)
3. Verifica que el build sea exitoso
4. Click en "Visit" para ver el sitio en producción

---

## ⚙️ Post-Deployment

### 1. Habilitar Speed Insights (IMPORTANTE)

**Este paso es CRÍTICO para medir mejoras:**

1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto (www.pinteya.com)
3. Ve a **Settings** → **Speed Insights**
4. Click en **Enable Speed Insights**
5. Confirma la activación

**Nota:** Los datos comenzarán a aparecer después de 24-48 horas de tráfico real.

### 2. Verificar Optimizaciones en Producción

#### A. Verificar Bundles (DevTools)

1. Abre el sitio en modo incógnito
2. F12 → Network tab
3. Recargar página (Ctrl+Shift+R)
4. Filtrar por "JS"
5. Verificar:
   - ✓ Framework bundle cargado
   - ✓ Vendors separados en chunks
   - ✓ Componentes lazy-loaded no aparecen en carga inicial
   - ✓ Total JS < 400KB (gzipped)

#### B. Verificar Lazy Loading

1. Abre DevTools → Network
2. Scroll down en la página
3. Verificar que componentes como FloatingCartButton/WhatsAppButton se cargan dinámicamente
4. Abrir el carrito → Verificar que CartSidebarModal se carga bajo demanda

#### C. Verificar Fuentes

1. DevTools → Network → Filtrar "Font"
2. Verificar que fuentes Regular, Bold y Medium tienen "Highest" priority
3. No debería haber FOIT (flash of invisible text)

#### D. Verificar Imágenes

1. DevTools → Network → Filtrar "Img"
2. Verificar formato WebP en navegadores compatibles
3. Verificar lazy loading de imágenes below-the-fold

### 3. Ejecutar Lighthouse

**En Chrome DevTools:**

1. F12 → Tab "Lighthouse"
2. Seleccionar:
   - ✓ Performance
   - ✓ Desktop (primero)
   - ✓ Modo Incógnito
3. Click "Generate report"
4. Tomar screenshot del resultado

**Ejecutar para Mobile también:**
- Repetir proceso seleccionando "Mobile"
- Comparar scores

**Scores Objetivo:**
- Performance: > 85
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### 4. PageSpeed Insights

1. Ve a [pagespeed.web.dev](https://pagespeed.web.dev)
2. Ingresa: `https://www.pinteya.com`
3. Esperar análisis (~30 segundos)
4. Revisar tanto Mobile como Desktop

**Core Web Vitals Objetivo:**
- LCP: < 2.5s (Verde)
- FID: < 100ms (Verde)
- CLS: < 0.1 (Verde)

### 5. Comparar Métricas Before/After

#### Antes (Estimado)
```
Performance Score: ~70
LCP: ~4.0s
FID: ~200ms
CLS: ~0.15
Bundle Size: ~450KB
```

#### Después (Esperado)
```
Performance Score: ~85-90
LCP: ~2.5s
FID: ~100ms
CLS: ~0.1
Bundle Size: ~315KB
```

---

## 📊 Monitoreo Continuo

### Primeras 24 Horas

- [ ] Verificar que no hay errores en Vercel logs
- [ ] Monitorear Analytics para ver si hay problemas
- [ ] Revisar feedback de usuarios (si aplica)

### Primera Semana

- [ ] Revisar Speed Insights dashboard diariamente
- [ ] Comparar métricas con baseline
- [ ] Identificar páginas/rutas con problemas
- [ ] Ajustar si es necesario

### Continuo

- [ ] Ejecutar `npm run analyze` antes de cada deploy importante
- [ ] Revisar bundle size en cada PR
- [ ] Monitorear Core Web Vitals semanalmente
- [ ] Optimizar imágenes nuevas antes de subirlas

---

## 🎯 Próximas Optimizaciones (Opcionales)

### Corto Plazo (Esta Semana)

1. **Optimizar Imágenes Manualmente**
   - Usar guía en `IMAGE_OPTIMIZATION_GUIDE.md`
   - Priorizar hero, products, categories
   - Convertir a WebP con Squoosh
   - Re-deploy después de optimizar

2. **Implementar Lazy Load de Imágenes**
   - Buscar todas las etiquetas `<img>`
   - Agregar `loading="lazy"` a imágenes below-the-fold
   - Verificar que next/image tiene priority solo en above-the-fold

### Mediano Plazo (Próximas 2 Semanas)

3. **ISR en Páginas de Productos**
   ```javascript
   // En página de producto
   export const revalidate = 3600 // 1 hora
   ```

4. **Caché de API Routes**
   ```javascript
   // En API route
   res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
   ```

5. **Critical CSS**
   - Extraer CSS above-the-fold
   - Inline en `<head>`
   - Lazy load resto de CSS

### Largo Plazo (Próximo Mes)

6. **Service Worker (Opcional)**
   - Para caché offline
   - Precache de assets críticos

7. **CDN para Assets Estáticos**
   - Considerar Cloudflare Images
   - O usar Image CDN de Vercel

---

## 🔧 Troubleshooting

### Build falla en Vercel

**Error: Module not found**
```bash
# Local
npm install
npm run build

# Verificar package.json
# Asegurar que todas las deps estén en dependencies, no en devDependencies
```

**Error: Out of memory**
```bash
# Aumentar memoria en vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node",
      "config": { "maxLambdaSize": "50mb" }
    }
  ]
}
```

### Performance no mejora

1. **Verificar que cambios están en producción:**
   - Ver source en DevTools → Sources
   - Buscar `withBundleAnalyzer` en next.config
   - Verificar que providers.tsx tiene dynamic imports

2. **Cachear navegador puede mostrar versión antigua:**
   - Limpiar caché (Ctrl+Shift+Delete)
   - Usar modo incógnito
   - Hard refresh (Ctrl+Shift+R)

3. **Speed Insights no muestra datos:**
   - Esperar 24-48h después de habilitar
   - Verificar que está habilitado en Settings
   - Necesita tráfico real (no solo tú visitando)

### Imágenes no se optimizan

1. **Verificar formato en Network tab:**
   - Debería decir "webp" o "avif"
   - Si dice "jpeg"/"png", no se está optimizando

2. **Verificar configuración:**
   ```javascript
   // next.config.js
   images: {
     formats: ['image/webp', 'image/avif'],
     unoptimized: false, // Debe ser false
   }
   ```

---

## 📞 Soporte

### Recursos

- [Documentación Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Docs](https://developer.chrome.com/docs/lighthouse)

### Archivos de Referencia

- `PERFORMANCE_OPTIMIZATION.md` - Guía general
- `IMAGE_OPTIMIZATION_GUIDE.md` - Guía de imágenes
- `OPTIMIZATION_SUMMARY.md` - Resumen de cambios

---

## ✅ Checklist Final

Antes de considerar completada la optimización:

- [ ] Build exitoso localmente
- [ ] Deploy exitoso en Vercel
- [ ] Speed Insights habilitado
- [ ] Lighthouse score > 85
- [ ] Core Web Vitals en verde
- [ ] Bundle analyzer ejecutado
- [ ] Imágenes analizadas (optimización manual pendiente)
- [ ] No hay errores en consola
- [ ] Documentación revisada
- [ ] Screenshots de métricas tomados

---

**¡Deployment completado! 🎉**

Recuerda: Las métricas reales aparecerán en Speed Insights después de 24-48h de tráfico real. Mientras tanto, usa Lighthouse y PageSpeed Insights para verificar mejoras.















