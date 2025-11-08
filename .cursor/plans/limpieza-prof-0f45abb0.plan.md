<!-- 0f45abb0-c626-4b53-a6bb-71d8b31f0bf1 0f096e36-7ca8-4781-8f0e-0f32c5a165d9 -->
# Plan de Limpieza Detallada del Root

## 1. ELIMINACION INMEDIATA (Confirmado)

### Archivos Debug HTML (4 archivos)

- `debug-console-logs.html` → ELIMINAR
- `debug-trending-searches.html` → ELIMINAR
- `debug-trending-ui.html` → ELIMINAR
- `debug-trending.html` → ELIMINAR

### Archivos Build Output (4 archivos)

- `build-output-final.txt` → ELIMINAR
- `build-output-new.txt` → ELIMINAR
- `build-output.txt` → ELIMINAR
- `build-success.txt` → ELIMINAR

---

## 2. DOCUMENTOS .MD - REVISION CASO POR CASO (66 archivos)

### CATEGORIA A: FIXES HISTORICOS → `docs/archive/fixes/` (14 docs)

**Recomendación: MOVER a docs/archive/fixes/**

- `ADMIN_LAYOUT_FIX_PRODUCTOS.md`
- `ADMIN_PRODUCT_FIXES_SUMMARY.md`
- `BARNIZ_CAMPBELL_FIX_SUMMARY.md`
- `CORRECCIONES_FUNCIONALES_COMPLETADAS.md`
- `DATABASE_FIXES_SUMMARY.md`
- `DOUBLE_SCROLL_FIX_SUMMARY.md`
- `GOOGLE_MAPS_CHECKOUT_FIX.md`
- `OCULTAR_RGBA_DISPLAY_SUMMARY.md`
- `PRODUCT_DETAIL_DATA_FIX_SUMMARY.md`
- `RESOLUCION_ERROR_500_FINAL.md`
- `STOCK_VALIDATION_CART_FIX.md`
- `INCOLORO_BRILLANTE_UPDATE.md`
- `PROBLEMA_WHATSAPP_DIAGNOSTICO.md`
- `REEMPLAZAR_IMAGENES_FONDO_BLANCO.md`

### CATEGORIA B: IMPLEMENTACIONES COMPLETADAS → `docs/archive/implementations/` (14 docs)

**Recomendación: MOVER a docs/archive/implementations/**

- `ADMIN_UI_IMPROVEMENTS_IMPLEMENTED.md`
- `CYBER_MONDAY_IMPLEMENTATION_COMPLETE.md`
- `CONSOLIDACION_FASE2_COMPLETADA.md`
- `FASE_1_COMPLETADA.md`
- `FASE_1_ERRORES_CRITICOS_COMPLETADA.md`
- `FORMULARIO_MINIMAL_FINAL.md`
- `HEADER_IMPLEMENTATION_SUMMARY.md`
- `MERCADOPAGO_FLOW_IMPLEMENTATION_SUMMARY.md`
- `MOBILE_FIRST_ADMIN_PANELS_IMPLEMENTED.md`
- `SELECTOR_ACABADO_IMPLEMENTADO.md`
- `SELECTOR_MAPA_INTERACTIVO.md`
- `SISTEMA_VARIANTES_COMPLETADO_RESUMEN_FINAL.md`
- `SISTEMA_VARIANTES_IMPLEMENTADO.md`
- `WHATSAPP_ORDERS_IMPLEMENTATION_SUMMARY.md`

### CATEGORIA C: TESTING Y DIAGNOSTICOS → `docs/archive/testing-debug/` (10 docs)

**Recomendación: MOVER a docs/archive/testing-debug/**

- `CYBER_MONDAY_TESTS_CORRECTED_SUMMARY.md`
- `PLAYWRIGHT_DIAGNOSTICO_PANEL_PRODUCTOS.md`
- `SUITE_TESTING_E2E_ADMIN_PRODUCTS_RESUMEN.md`
- `SUITE_TESTING_FINAL_RESULTS.md`
- `SUITE_TESTING_FIXES_APLICADOS.md`
- `SUITE_TESTING_RESULTADOS.md`
- `TEST_ADMIN_PRODUCTS_E2E_STATUS.md`
- `TEST_MANUAL_MERCADOPAGO_FLOW.md`
- `TEST-MERCADOPAGO-WHATSAPP.md`
- `TESTING_RESULTS_ADMIN_PRODUCTS.md`

### CATEGORIA D: GUIAS Y PROCEDIMIENTOS → `docs/archive/guides/` (8 docs)

**Recomendación: MOVER a docs/archive/guides/**

- `DATABASE_DEPLOYMENT_GUIDE.md`
- `DEPLOYMENT-GUIDE.md`
- `COMO_USAR_HOME_V2.md`
- `GOOGLE_MAPS_API_KEY_SETUP.md`
- `GOOGLE_MAPS_SETUP.md`
- `TEST_ADMIN_PRODUCTS_GUIDE.md`
- `VALIDACION_DIRECCIONES_IMPLEMENTACION.md`
- `SISTEMA_WHATSAPP_FINAL_VERIFICADO.md`

### CATEGORIA E: MEJORAS Y FEATURES → `docs/archive/features/` (5 docs)

**Recomendación: MOVER a docs/archive/features/**

- `MEJORA_FILTROS_SHADCN.md`
- `MEJORA_FILTROS_V2_FINAL.md`
- `MEJORAS_ADMIN_DASHBOARD_22_OCT_2025.md`
- `UX_UI_IMPROVEMENTS_PHASE_2.md`
- `VALIDACION_DIRECCIONES_FINAL.md`

### CATEGORIA F: SEGURIDAD → `docs/archive/security/` (5 docs)

**Recomendación: MOVER a docs/archive/security/ (nueva carpeta)**

- `SECURITY_AUDIT_COMMIT_8951d83.md`
- `SECURITY_CRITICAL_FIXES_SUMMARY.md`
- `SECURITY_FIXES_2025_10_19.md`
- `SECURITY_INCIDENT_RESPONSE.md`
- `SECURITY-IMPROVEMENTS.md`

### CATEGORIA G: REFERENCIAS Y LISTAS → `docs/archive/references/` (5 docs)

**Recomendación: MOVER a docs/archive/references/**

- `LISTA_PRODUCTOS_SIN_IMAGENES_PARA_BUSCAR.md`
- `LISTA_PRODUCTOS_TODAS_COLUMNAS_COMPLETADO.md`
- `TABLAS_FINALES_PRODUCTOS_VARIANTES.md`
- `ESTADO_ORDENES_FUTURAS.md`
- `VALIDACION_STOCK_CARRITO.md`

### CATEGORIA H: PLANES Y OPTIMIZACIONES → `docs/archive/planning/` (3 docs)

**Recomendación: MOVER a docs/archive/planning/ (nueva carpeta)**

- `PLAN_DESARROLLO_SEGUNDA_ITERACION.md`
- `PLAN_OPTIMIZACION_COMPLETA.md`
- `README_OPTIMIZACIONES.md`

### CATEGORIA I: VERIFICACIONES → `docs/archive/verification/` (2 docs)

**Recomendación: MOVER a docs/archive/verification/ (nueva carpeta)**

- `VERIFICACION_API_BADGES_CORRECTOS.md`
- `VERIFICACION_FINAL_COMPLETA.md`

### CATEGORIA J: MANTENER EN ROOT (2 docs)

**Recomendación: MANTENER en root** ✅

- `README.md` → Mantener
- `CHANGELOG.md` → Mantener
- `OPTIMIZACION_AGRESIVA_2025-11-08.md` → Mantener (recién creado)

---

## 3. ARCHIVOS TEMPORALES ADICIONALES (Opcional)

### Scripts de Testing Temporales (30+ archivos)

**Recomendación: MOVER a `scripts/temp-testing/` o ELIMINAR**

- `test-*.js` (30+ archivos de scripts de prueba temporales)
- `test-trending-component.html`
- `verify-*.js` (scripts de verificación)
- `sync-*.js` (scripts de sincronización)
- `compare-urls.js`, `fix-*.js`, `manual-verification.js`, etc.

### Archivos JSON de Reportes

**Recomendación: MOVER a `reports/` o ELIMINAR**

- `sync-analysis-report.json`
- `sync-final-report.json`
- `sync-report.json`
- `url-comparison-report.json`
- `test-product.json`
- `csv-urls.json`
- `performance-baseline-metrics.json`

### Archivo Extraño

- `on` → ELIMINAR (archivo sin extensión, probablemente error)

### Archivo HTML Temporal

- `force-admin-access.html` → ELIMINAR o mover a scripts/temp-testing/
- `test-trending-component.html` → ELIMINAR o mover a scripts/temp-testing/

### Archivo de Texto

- `MIGRACIONES_COMPLETADAS_RESUMEN.txt` → Mover a docs/archive/summaries/ o database/

---

## RESUMEN DE ACCIONES

**Eliminaciones Inmediatas:** 8 archivos (debug HTML + build outputs)
**Documentos .md a archivar:** 64 documentos
**Documentos .md a mantener:** 3 documentos (README, CHANGELOG, OPTIMIZACION_AGRESIVA)
**Archivos temporales (scripts/reportes):** ~45 archivos para decisión adicional

**Nuevas carpetas a crear:**

- `docs/archive/security/`
- `docs/archive/planning/`
- `docs/archive/verification/`
- `scripts/temp-testing/` (opcional)

**Reducción esperada en root:** De ~120 archivos no-código a ~5-10 archivos esenciales

### To-dos

- [ ] Auditar tablas de base de datos e identificar duplicadas/obsoletas (products_optimized, analytics_events_optimized, profiles vs user_profiles)
- [ ] Crear script SQL para eliminar tablas obsoletas con backups preventivos
- [ ] Eliminar archivos core de Clerk (clerk.ts, types/clerk.ts, useCartWithClerk.ts) y crear alternativas
- [ ] Eliminar 14 scripts relacionados con Clerk en /scripts
- [ ] Eliminar directorio completo src/app/_disabled (13 rutas debug/test)
- [ ] Limpiar referencias a Clerk en 63 archivos activos (imports, comentarios, código comentado)
- [ ] Eliminar tests obsoletos de Clerk
- [ ] Auditar ~200 scripts en /scripts y categorizar (eliminar, mantener, consolidar)
- [ ] Eliminar scripts obsoletos identificados (migraciones completadas, debug one-time)
- [ ] Actualizar scripts/README.md con documentación de scripts que quedan
- [ ] Ejecutar suite completa de tests para identificar tests que fallan o son obsoletos
- [ ] Eliminar tests obsoletos (Clerk, features removidas, duplicados)
- [ ] Actualizar tests activos a NextAuth y patrones modernos
- [ ] Crear estructura /docs/archive con subcarpetas (clerk-migration, legacy-states, completed-migrations, superseded)
- [ ] Mover ~15 documentos de Clerk a /docs/archive/clerk-migration
- [ ] Mover documentos de migraciones completadas a /docs/archive/completed-migrations
- [ ] Mover documentos de estados antiguos (pre-Nov 2025) a /docs/archive/legacy-states
- [ ] Actualizar README.md, docs/README.md eliminando referencias a Clerk y actualizando índices
- [ ] Buscar y eliminar bloques grandes de código comentado obsoleto
- [ ] Ejecutar depcheck para identificar dependencias no usadas
- [ ] Eliminar dependencias no usadas del package.json
- [ ] Mover archivos SQL del root a /database o eliminar si son obsoletos
- [ ] Revisar necesidad de scripts PowerShell en root
- [ ] Actualizar configs (gitignore, tsconfig, next.config, jest.config) eliminando referencias obsoletas
- [ ] Compilar proyecto completo y verificar que no hay errores
- [ ] Ejecutar suite completa de tests y verificar coverage
- [ ] Ejecutar linter y corregir issues
- [ ] Test manual de funcionalidades críticas (auth, admin, carrito, checkout)
- [ ] Documentar todos los archivos eliminados y cambios realizados