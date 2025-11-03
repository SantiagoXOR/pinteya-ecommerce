# 🚀 Cómo Usar Home v2.0

## Acceso Rápido

### Para ver la versión optimizada:
```
http://localhost:3000/home-v2
```

### Para comparar con la versión actual:
```
http://localhost:3000          ← Versión actual (bounce rate 91%)
http://localhost:3000/home-v2  ← Versión optimizada (objetivo <70%)
```

## 📊 Qué Esperar

### Mejoras Visuales Inmediatas

1. **Barra de Beneficios en la parte superior**
   - Se ve inmediatamente al cargar
   - Rota automáticamente cada 4 segundos
   - Se esconde al hacer scroll para no molestar

2. **Hero Mejorado**
   - Ahora está PRIMERO (antes estaba 4to)
   - 2 botones grandes y claros:
     * "Ver Todos los Productos"
     * "Ofertas Especiales"
   - Beneficios visibles: Envío gratis, Pago seguro, Cuotas
   - Social proof: "Última compra hace 5 min en Córdoba"

3. **Búsquedas Populares** (NUEVO)
   - Chips clickeables: "Látex", "Antióxido", "Impermeabilizante", etc.
   - Aparece justo después de las categorías
   - Facilita encontrar productos rápidamente

4. **Combos Mejorados**
   - Al pasar el mouse, muestra overlay con descripción
   - Botón "Ver detalles" visible
   - Badge "🔥 Oferta" en esquina

5. **Categorías Mejoradas**
   - Iconos más grandes
   - Contador de productos (ej: "250+")
   - Animaciones suaves al hover
   - Checkmark cuando está seleccionada

6. **Productos con Urgencia**
   - Badge rojo: "¡Últimas 5 unidades!" (stock bajo)
   - Badge verde: "NUEVO" (productos nuevos)
   - Badge naranja: "-30%" (descuentos)
   - Badge dorado: "Top 1 Más Vendido"

7. **WhatsApp Flotante** (aparece a los 5 segundos)
   - Botón verde pulsante en esquina inferior derecha
   - Al pasar mouse, muestra tooltip con info
   - Click abre WhatsApp con mensaje pre-escrito

8. **Modal de Salida** (al intentar cerrar la pestaña)
   - Ofrece 10% OFF
   - Captura email
   - Links rápidos a categorías

## 🧪 Testing Sugerido

### 1. Prueba de Performance
```bash
# En Chrome DevTools:
1. Abrir http://localhost:3000/home-v2
2. F12 → Lighthouse
3. Generar reporte
4. Comparar con http://localhost:3000
```

**Métricas clave a observar:**
- LCP (Largest Contentful Paint): Debe ser <2.5s
- FID (First Input Delay): Debe ser <100ms
- CLS (Cumulative Layout Shift): Debe ser <0.1

### 2. Prueba de Engagement

**Acciones a probar:**
- [ ] Click en "Ver Todos los Productos" (Hero)
- [ ] Click en "Ofertas Especiales" (Hero)
- [ ] Click en una categoría (Pills)
- [ ] Click en un chip de búsqueda tendencia
- [ ] Click en un combo (debe mostrar overlay)
- [ ] Esperar 5 segundos → WhatsApp debe aparecer
- [ ] Mover mouse hacia arriba → Modal debe aparecer
- [ ] Hacer scroll → BenefitsBar debe desaparecer
- [ ] Click en producto → Ver badges de urgencia

### 3. Prueba de Tracking

**Abrir Console (F12) y verificar:**
```javascript
// Todos estos eventos deben aparecer en la consola:
- hero_cta_click: { cta_name: "ver_productos" }
- category_click: { category_name: "Paredes" }
- trending_search_click: { search_term: "Látex" }
- combo_click: { combo_title: "Combo Verano - Piscinas" }
- whatsapp_click: { source: "floating_button" }
- exit_intent_shown: {}
- scroll_depth: { depth_percent: 25 }
```

## 📱 Testing Mobile

### En Chrome DevTools:
1. F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Seleccionar "iPhone 12 Pro"
3. Recargar página

**Qué verificar:**
- BenefitsBar rota automáticamente (no muestra todos)
- Hero es más simple (sin carrusel lateral)
- Categorías tienen scroll horizontal
- Grid es 2 columnas (no 4)
- WhatsApp flotante se ve bien
- Todas las animaciones son suaves

## 🎯 Métricas a Monitorear

### En Google Analytics (después de deployment)

**Eventos personalizados:**
```
Engagement > Eventos > hero_cta_click
                    > category_click
                    > trending_search_click
                    > combo_click
                    > whatsapp_click
                    > exit_intent_shown
                    > scroll_depth
```

**Comparación de métricas:**
| Métrica | Home Actual | Home v2.0 | Objetivo |
|---------|-------------|-----------|----------|
| Bounce Rate | 91% | ??? | <70% |
| Avg. Time | ??? | ??? | >2min |
| Pages/Session | 1.0 | ??? | >2.5 |
| CTR a /products | 0.1% | ??? | >5% |
| CTR a /checkout | 0.06% | ??? | >1% |

## 🔧 Customización

### Cambiar número de WhatsApp
```typescript
// src/components/Common/FloatingWhatsApp.tsx
const whatsappNumber = '5493515555555' // ← Cambiar aquí
```

### Cambiar oferta del modal de salida
```typescript
// src/components/Common/ExitIntentModal.tsx
<div className="inline-block bg-green-100...">
  10% OFF  // ← Cambiar aquí
</div>
```

### Agregar más búsquedas tendencia
```typescript
// src/components/Home-v2/TrendingSearches/index.tsx
const trendingSearches = [
  { term: 'Látex', icon: '🎨', count: '250+ productos' },
  // ← Agregar más aquí
]
```

### Modificar orden de secciones
```typescript
// src/components/Home-v2/index.tsx
<main>
  <BenefitsBar />
  <Hero />
  // ← Cambiar orden aquí
</main>
```

## 🐛 Troubleshooting

### "No se ve el WhatsApp flotante"
**Solución:** Esperar 5 segundos después de cargar la página.

### "El modal de salida no aparece"
**Solución:** 
- Solo funciona en desktop
- Ya se mostró una vez en esta sesión (revisar sessionStorage)
- Mover el mouse hacia arriba (fuera de la ventana)

### "Las animaciones van lentas"
**Solución:** 
- Verificar performance de CPU
- Cerrar otras pestañas
- Deshabilitar extensiones de Chrome

### "Errores de TypeScript"
**Solución:**
```bash
npm run build
# Si hay errores, revisar console
```

### "No se ven los beneficios en mobile"
**Solución:** Es normal, en mobile solo muestra 1 rotando.

## 📈 Próximos Pasos

### Semana 1-2: Testing Interno
- [ ] Probar en todos los navegadores (Chrome, Firefox, Safari, Edge)
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Verificar que todos los links funcionan
- [ ] Confirmar que tracking está funcionando

### Semana 3-4: A/B Testing
```typescript
// Middleware para redirigir 50% de tráfico
if (Math.random() < 0.5) {
  return NextResponse.rewrite('/home-v2')
}
```

### Mes 2: Análisis de Resultados
- Comparar bounce rates
- Analizar heatmaps
- Revisar grabaciones de sesiones
- Tomar decisión: ¿Migrar o iterar?

### Si bounce rate baja a <70%:
```bash
# Hacer v2.0 la versión principal
mv src/app/(site)/page.tsx src/app/(site)/page.old.tsx
mv src/app/(site)/home-v2/page.tsx src/app/(site)/page.tsx
```

## 💡 Tips

1. **No deployment inmediato:** Esta es una versión de prueba
2. **Medir primero:** Usar Analytics durante 1-2 semanas
3. **Iterar si es necesario:** Los datos te dirán qué mejorar
4. **Mantén la versión antigua:** Por si necesitas rollback

## 📞 Soporte

Si tenés dudas o problemas:
1. Revisar `src/components/Home-v2/README.md`
2. Revisar `HOME_V2_IMPLEMENTATION_SUMMARY.md`
3. Contactar al equipo de desarrollo

---

**¡Éxito con el testing! 🚀**

