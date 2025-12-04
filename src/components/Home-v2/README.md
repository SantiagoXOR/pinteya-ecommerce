# Home v2.0 - Optimización de Bounce Rate

## 🎯 Objetivo

Reducir el bounce rate del 91% al <70% mediante optimizaciones integrales de performance, UX/UI y engagement.

## 📊 Métricas Actuales vs Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Bounce Rate | 91% | <70% |
| CTR a /products | 0.1% | >5% |
| CTR a /search | 1.5% | >10% |
| Scroll Depth | ? | >50% |
| Tiempo en página | ? | >2min |

## ✨ Mejoras Implementadas

### 1. **Performance**
- ✅ Lazy loading de componentes con `dynamic()`
- ✅ Optimización de imágenes (habilitado Next.js Image optimization)
- ✅ Priority solo en primera imagen del carrusel
- ✅ Code splitting por sección

### 2. **UX/UI**
- ✅ **Hero primero** - Captar atención inmediata
- ✅ **CTAs claros** con beneficios visibles
- ✅ **Social proof** - "Última compra hace 5 min"
- ✅ Reorganización de secciones para mejor flujo
- ✅ CategoryPills mejoradas con iconos y animaciones
- ✅ CombosSection clickeable con hover effects

### 3. **Engagement**
- ✅ **BenefitsBar** - Barra sticky con beneficios clave
- ✅ **TrendingSearches** - Chips clickeables de búsquedas populares
- ✅ **FloatingWhatsApp** - Botón flotante con delay de 5s
- ✅ **ExitIntentModal** - Captura email con descuento 10%
- ✅ **Product Badges** - NUEVO, ÚLTIMAS UNIDADES, descuentos

### 4. **Tracking**
- ✅ Event tracking para todos los CTAs
- ✅ Scroll depth tracking (25%, 50%, 75%, 100%)
- ✅ Category clicks
- ✅ Combo clicks
- ✅ WhatsApp interactions
- ✅ Exit intent modal conversions

## 🏗️ Estructura de Componentes

```
Home-v2/
├── index.tsx (Orquestador con lazy loading)
├── Hero/
│   └── index.tsx (CTAs + Social proof)
├── BenefitsBar/
│   └── index.tsx (Sticky bar con beneficios)
├── TrendingSearches/
│   └── index.tsx (Búsquedas populares)
├── CombosSection/
│   └── index.tsx (Combos clickeables)
├── CategoryTogglePillsWithSearch.tsx (Pills mejoradas)
├── BestSeller/
│   └── index.tsx (Con badges de urgencia)
└── NewArrivals/
    └── index.tsx (Con badges NUEVO)
```

## 🚀 Nuevos Componentes Globales

```
Common/
├── FloatingWhatsApp.tsx (Botón flotante)
└── ExitIntentModal.tsx (Modal de salida)
```

## 📈 Orden Optimizado de Secciones

1. **BenefitsBar** (Sticky) - Beneficios siempre visibles
2. **Hero** - Captar atención con CTAs claros
3. **CategoryTogglePills** - Navegación rápida
4. **TrendingSearches** - Engagement inmediato
5. **CombosSection** - Ofertas destacadas
6. **BestSeller** - Social proof
7. **NewArrivals** - Descubrimiento
8. **TrustSection** - Confianza
9. **Testimonials** - Prueba social
10. **Newsletter** - Captura de leads

## 🎨 Mejoras Visuales

### Hero
- Headline más accionable
- 2 CTAs principales con hover effects
- Beneficios clave visibles (Envío gratis, Pago seguro, Cuotas)
- Social proof con avatares
- Gradiente animado

### Product Cards
- Badges de urgencia: "¡Últimas X unidades!"
- Badges de novedad: "NUEVO"
- Badges de descuento: "-30%"
- Overlays para top productos

### Animaciones
- fadeIn, slideUp, scaleIn
- Shimmer effects en hover
- Pulse rings para WhatsApp
- Smooth transitions en todas las interacciones

## 🔗 Tracking Events

### Google Analytics Events Implementados

```typescript
// Hero
trackHeroCTA('ver_productos')
trackHeroCTA('ver_ofertas')

// Categorías
trackCategoryClick(categoryName)

// Búsquedas
trackTrendingSearch(searchTerm)

// Combos
trackComboClick(comboId, comboTitle)

// WhatsApp
trackWhatsAppClick('floating_button')

// Exit Intent
trackExitIntentShown()
trackExitIntentClosed()
trackExitIntentConverted(email)

// Scroll Depth
trackScrollDepth(percentage, pathname)
```

## 🧪 Testing

### Para probar la versión v2.0:

1. **Local:**
   ```bash
   npm run dev
   # Visitar: http://localhost:3000/home-v2
   ```

2. **Comparar con versión actual:**
   - Original: `http://localhost:3000`
   - v2.0: `http://localhost:3000/home-v2`

3. **Verificar métricas:**
   - Lighthouse Performance Score
   - Time to Interactive (TTI)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

### Checklist de Testing

- [ ] Hero carga rápido con CTAs visibles
- [ ] BenefitsBar se esconde al scroll down
- [ ] CategoryPills tienen hover effects
- [ ] TrendingSearches redirige correctamente
- [ ] CombosSection muestra overlay en hover
- [ ] Product badges se muestran correctamente
- [ ] FloatingWhatsApp aparece a los 5s
- [ ] ExitIntentModal se activa al salir
- [ ] Todas las animaciones son suaves
- [ ] Tracking events se disparan correctamente

## 📱 Mobile-First

Todos los componentes están optimizados para mobile:
- BenefitsBar rotativo en mobile
- Hero simplificado en mobile
- CategoryPills con scroll horizontal
- Grid 2 columnas en mobile
- WhatsApp flotante responsive

## 🎯 Próximos Pasos

1. **Medir resultados** durante 7 días
2. **Analizar heatmaps** con Hotjar/Clarity
3. **A/B testing** con porcentaje de tráfico
4. **Iterar** basado en datos reales
5. Si mejora métricas: **Hacer v2.0 la versión principal**

## 🔄 Deploy a Producción

Cuando los resultados sean positivos:

```bash
# Opción 1: Swap de rutas
# Renombrar page.tsx actual y home-v2 toma su lugar

# Opción 2: A/B Testing
# Usar middleware para redirigir X% de tráfico a /home-v2

# Opción 3: Feature Flag
# Usar variable de entorno para activar v2
```

## 📝 Notas Importantes

- **No indexar** la ruta /home-v2 (configurado en metadata)
- **Badge de "Test"** visible para identificar versión
- **Todos los estilos** son modulares y no afectan el home original
- **Tracking separado** para comparar métricas

---

**Fecha de creación:** Octubre 2025
**Versión:** 2.0
**Status:** Testing

