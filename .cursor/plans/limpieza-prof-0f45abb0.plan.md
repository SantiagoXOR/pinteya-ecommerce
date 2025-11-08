<!-- 0f45abb0-c626-4b53-a6bb-71d8b31f0bf1 0f096e36-7ca8-4781-8f0e-0f32c5a165d9 -->
# Plan de Optimización Agresiva del Codebase

## 🎯 Objetivo

Reducir de ~2600 archivos rastreados a ~500-700 archivos esenciales, eliminando reportes generados, documentación redundante, y archivos de debug temporal.

## 📊 Impacto Esperado

- **Antes**: ~2,600 archivos rastreados (sin node_modules/.next)
- **Después**: ~500-700 archivos esenciales
- **Reducción**: ~2,000 archivos (~77% menos)

---

## 🗑️ Fase 1: Eliminación de Reportes y Artifacts (2,800+ archivos)

### 1.1 Carpeta Coverage (2,541 archivos) - CRÍTICO

**Acción**: Eliminar carpeta completa

```bash
coverage/  # Reportes de Jest - se regeneran con npm run test:coverage
```

**Justificación**: Se regenera automáticamente, ocupa espacio innecesario

### 1.2 Security Reports (268 archivos)

**Acción**: Eliminar o consolidar

```bash
security-reports/  # Reportes antiguos de auditoría
```

### 1.3 Carpetas de Reportes (~20 archivos)

**Acción**: Eliminar carpetas completas

```bash
bundle-reports/
bundle-analysis/
ci-performance-reports/
performance-reports/
reports/
playwright-report/
test-results/
test-results-debug/
audit-screenshots/
```

### 1.4 Actualizar .gitignore

**Acción**: Agregar estas carpetas para que no se trackeen en el futuro

```
coverage/
security-reports/
*-reports/
test-results*/
playwright-report/
audit-screenshots/
```

---

## 📝 Fase 2: Documentación en Root (~150 .md → ~10 .md)

### 2.1 Identificar Documentación Activa (Mantener)

- `README.md` - Principal
- `CHANGELOG.md` - Historial
- Los 6 docs de limpieza recién creados (2025-11-08)

### 2.2 Categorizar Resto de Docs (~140 .md)

**A. Docs de Performance** (~15 docs):

```
PERFORMANCE_*.md
OPTIMIZATION_*.md
OPTIMIZACIONES_*.md
OPTIMIZAR_*.md
```

→ Mover a `/docs/archive/performance/`

**B. Docs de Fixes Específicos** (~30 docs):

```
FIX_*.md
CORRECCION_*.md
SOLUCION_*.md
```

→ Mover a `/docs/archive/fixes/`

**C. Docs de Implementaciones** (~20 docs):

```
IMPLEMENTACION_*.md
PANEL_*.md
PROYECTO_*.md
```

→ Mover a `/docs/archive/implementations/`

**D. Docs de Testing/Debug** (~15 docs):

```
DEBUG_*.md
DIAGNOSTICO_*.md
REPORTE_*.md
TEST_*.md
```

→ Mover a `/docs/archive/testing-debug/`

**E. Docs de Resúmenes** (~25 docs):

```
RESUMEN_*.md
REPORTE_*.md
ANALISIS_*.md
AUDITORIA_*.md
```

→ Mover a `/docs/archive/summaries/`

**F. Docs de Features Específicas** (~15 docs):

```
HERO_*.md
HOME_*.md
CARRUSEL_*.md
FILTROS_*.md
```

→ Mover a `/docs/archive/features/`

**G. Docs de Instrucciones/Guías** (~10 docs):

```
INSTRUCCIONES_*.md
GUIA_*.md
DEPLOYMENT_*.md
```

→ Mover a `/docs/archive/guides/`

**H. Docs de Flash Days** (~5 docs):

```
*FLASH_DAYS*.md
PLAN_FLASH_DAYS*.md
```

→ Mover a `/docs/archive/campaigns/`

**I. Índices y Quick Reference** (~5 docs):

```
INDICE_*.md
QUICK_*.md
```

→ Mover a `/docs/archive/references/`

---

## 🖼️ Fase 3: Screenshots y Archivos de Debug (~60 archivos)

### 3.1 Screenshots PNG en Root (~50 archivos)

**Acción**: Mover a carpeta temporal o eliminar

```bash
*.png en root → /temp/old-screenshots/ o eliminar
```

**Ejemplos**:

- debug-*.png
- modal-*.png
- homepage-*.png
- panel-*.png
- diagnostico-*.png

### 3.2 Archivos HTML de Debug (~10 archivos)

```bash
debug-*.html
force-admin-access.html
```

→ Eliminar (debug temporal)

### 3.3 Archivos JS de Debug (~15 archivos)

```bash
debug-*.js en root
compare-urls.js
fix-client-pages.js
manual-verification.js
```

→ Eliminar o mover a /scripts/archive/

---

## 🗄️ Fase 4: Archivos SQL en Root (~15 archivos)

**Acción**: Consolidar todos en `/database/archive/`

```bash
*.sql en root → /database/archive/
```

**Archivos a mover**:

- 20250201_*.sql
- database_fixes_*.sql
- create_product_variants_table.sql
- migrate_*.sql
- fix_*.sql
- APLICAR_SOLUCION_*.sql

---

## ⚙️ Fase 5: Configuraciones Duplicadas (~8 archivos)

### 5.1 Configs Jest Duplicadas

```bash
jest.config.js               ✅ Mantener (principal)
jest.config.ci.js            ✅ Mantener (CI/CD)
jest.setup.js                ✅ Mantener
jest.env.setup.js            ✅ Mantener

jest.config.minimal.js       ❌ Eliminar
jest.config.animations.js    ❌ Eliminar
jest.animation.setup.js      ❌ Eliminar
jest.address-validation.config.js ❌ Consolidar
```

### 5.2 Configs Playwright Duplicadas

```bash
playwright.config.ts                  ✅ Mantener (principal)
playwright.admin-products.config.ts   ✅ Mantener (testing específico)
playwright.address-validation.config.ts ✅ Mantener (testing específico)

playwright-debug.config.ts            ❌ Eliminar
playwright-diagnostico-simple.config.ts ❌ Eliminar
playwright.diagnostic.config.ts       ❌ Eliminar
playwright.simple.config.ts           ❌ Eliminar
playwright.structural.config.ts       ❌ Eliminar
playwright.enterprise.config.ts       ❌ Eliminar (si no se usa)
playwright.user-flow.config.ts        ❌ Eliminar (si no se usa)
```

### 5.3 Otros Configs

```bash
next.config.js               ✅ Mantener
next.config.logistics.js     ❌ Eliminar (duplicado)
eslint.config.js             ✅ Mantener
eslint.config.mjs            ❌ Eliminar (duplicado)
```

---

## 📦 Fase 6: Archivos Backup y Temporales (~20 archivos)

**Acción**: Eliminar todos

```bash
*.backup
backup-*.json
backup-*.txt
*.log
*.old
auth.json (si es temporal)
clerk-keys-template.txt
package.json.backup
```

---

## 📁 Fase 7: Carpetas Temporales

**Acción**: Eliminar carpetas completas

```bash
/Downloads/
/temp_images/
/design-system/ (si está vacía o es temporal)
/.jest-cache/ (si existe)
/.husky/ (revisar si se usa)
```

---

## 📄 Fase 8: Archivos CSV y JSON de Data (~10 archivos)

**Acción**: Mover a `/database/data/` o eliminar

```bash
productos_pinteya.csv
reporte-productos-completo.csv
csv-urls.json
auth.json (si no es config)
```

---

## 🔧 Fase 9: Scripts de Utilities Root (~15 archivos)

**Acción**: Mover a `/scripts/archive/` o eliminar

```bash
En root:
- compare-urls.js
- debug-badge-config.js
- debug-badges-*.js
- debug-barniz-campbell-browser.js
- debug-cinta-papel-click.js
- debug-complete-flow.js
- debug-csv.js
- debug-dom-simple.js
- debug-modal-*.js
- debug-product-detection.js
- debug-products-data.js
- debug-simple-modal.js
- debug-trending-*.html
- fix-client-pages.js
- fix-csv-database-sync.js
- manual-verification.js
```

---

## 📊 Fase 10: Reorganización de Docs Activa

### 10.1 Consolidar en /docs Principal

```bash
/docs/
├── README.md
├── /getting-started/
├── /architecture/
├── /api/
├── /components/
├── /testing/
└── /archive/          # TODO lo histórico
    ├── /clerk-migration/
    ├── /performance/   # ✨ NUEVO
    ├── /fixes/         # ✨ NUEVO
    ├── /implementations/ # ✨ NUEVO
    ├── /testing-debug/ # ✨ NUEVO
    ├── /summaries/     # ✨ NUEVO
    ├── /features/      # ✨ NUEVO
    ├── /guides/        # ✨ NUEVO
    ├── /campaigns/     # ✨ NUEVO (Flash Days)
    └── /references/    # ✨ NUEVO
```

### 10.2 Root Limpio (Solo 5-10 .md)

```bash
Root debería tener SOLO:
- README.md
- CHANGELOG.md
- CONTRIBUTING.md (si existe)
- LICENSE.md (si existe)
- .gitignore, .env.example, package.json, etc.
```

---

## 🎯 Resultados Esperados

### Antes

```
Total archivos: ~2,600 (sin node_modules/.next)
- Docs .md: 716
- Coverage: 2,541
- Security reports: 268
- Screenshots: ~50
- Configs duplicados: ~15
- SQL en root: ~15
- Carpetas reportes: ~50
```

### Después

```
Total archivos: ~500-700
- Docs .md en root: 5-10
- Docs en /docs: ~100 (organizados)
- Coverage: 0 (agregado a .gitignore)
- Security reports: 0 (eliminados)
- Screenshots: 0 (eliminados)
- Configs: ~8 (solo esenciales)
- SQL: Organizados en /database
```

### Reducción Total

**~2,000 archivos eliminados (~77% menos)**

---

## ⚠️ Archivos a Preservar

### Esenciales del Root

- package.json, package-lock.json
- next.config.js
- tsconfig.json
- eslint.config.js
- tailwind.config.js
- postcss.config.js
- .gitignore, .env.example
- README.md, CHANGELOG.md
- middleware.ts, auth.ts
- components.json (shadcn)

### Carpetas Esenciales

- /src (código fuente)
- /public (assets públicos - 23 archivos OK)
- /supabase (migraciones)
- /docs (reorganizados)
- /scripts (organizados - 68 archivos OK)
- /**tests** y /e2e (testing)

---

## 🚀 Orden de Ejecución

1. **Coverage y .jest-cache** (2,543 archivos) - Máxima prioridad
2. **Security-reports** (268 archivos)
3. **Carpetas de reportes** (50+ archivos)
4. **Screenshots en root** (50+ archivos)
5. **Documentación masiva** (140+ .md del root a /docs/archive)
6. **SQL files en root** (15 archivos)
7. **Configs duplicados** (10 archivos)
8. **Archivos backup/temp** (20 archivos)
9. **Scripts debug en root** (15 archivos)
10. **Actualizar .gitignore** (prevenir futuros artifacts)

---

## 💡 Beneficios

✅ **Navegación más rápida** - Menos archivos en root

✅ **Git más rápido** - Menos archivos tracked

✅ **IDE más rápido** - Menos archivos indexados

✅ **Menos confusión** - Solo archivos relevantes

✅ **Profesional** - Root limpio como proyecto enterprise

✅ **Mejor organización** - Todo en su lugar

---

## ⚠️ Precauciones

1. **Hacer commit antes** - Punto de restauración
2. **No eliminar /src, /public, /supabase** - Son esenciales
3. **Actualizar .gitignore** - Prevenir regeneración
4. **Docs importantes** - Mover a /docs/archive, no eliminar
5. **Verificar build** - Después de cada fase crítica

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