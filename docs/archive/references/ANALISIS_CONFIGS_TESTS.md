# Análisis de Configuraciones de Tests - 8 Nov 2025

## Scripts de Tests en package.json

### Jest Scripts:
1. `test` → usa `jest.config.ci.js` ✅ **EN USO**
2. `test:full` → usa config por defecto (jest.config.js)
3. `test:watch` → usa config por defecto
4. `test:coverage` → usa config por defecto
5. `test:address-validation` → usa `jest.address-validation.config.js` ✅ **EN USO**

### Playwright Scripts:
1. `test:e2e:address-validation` → usa `playwright.address-validation.config.ts` ✅ **EN USO**
2. `test:admin:products` (y variantes) → usa `playwright.admin-products.config.ts` ✅ **EN USO**
3. Otros tests → usan `playwright.config.ts` (por defecto)

---

## Conclusión: Configs a Mantener vs Eliminar

### ✅ MANTENER (EN USO - 8 archivos):

**Jest (5 configs):**
- `jest.config.js` ✅ Config principal
- `jest.setup.js` ✅ Setup global
- `jest.config.ci.js` ✅ Usado en script "test"
- `jest.address-validation.config.js` ✅ Usado en scripts address-validation
- `setup-test.js` ✅ Setup general

**Playwright (3 configs):**
- `playwright.config.ts` ✅ Config principal
- `playwright.address-validation.config.ts` ✅ Usado en script e2e address-validation
- `playwright.admin-products.config.ts` ✅ Usado en múltiples scripts admin

---

### 🗑️ ELIMINAR (NO USADOS - 11 archivos):

**Jest (4 configs):**
- `jest.config.animations.js` ❌ No usado en scripts
- `jest.config.minimal.js` ❌ No usado en scripts
- `jest.animation.setup.js` ❌ No usado en scripts
- `jest.env.setup.js` ❌ No usado en scripts

**Playwright (7 configs):**
- `playwright-debug.config.ts` ❌ No usado en scripts
- `playwright-diagnostico-simple.config.ts` ❌ No usado en scripts
- `playwright.diagnostic.config.ts` ❌ No usado en scripts
- `playwright.enterprise.config.ts` ❌ No usado en scripts
- `playwright.simple.config.ts` ❌ No usado en scripts
- `playwright.structural.config.ts` ❌ No usado en scripts
- `playwright.user-flow.config.ts` ❌ No usado en scripts

---

## Acción Recomendada:

**Eliminar 11 configuraciones de tests obsoletas que no están referenciadas en ningún script de package.json**

Esto dejará solo las 8 configuraciones activamente usadas en el proyecto.

