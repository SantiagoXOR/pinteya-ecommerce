# 🔧 SELECTORES EN MODALES CORREGIDOS

## 📋 PROBLEMA IDENTIFICADO

Los selectores funcionan en `/test-address` pero NO en `/addresses` porque en la página real están dentro de un **Dialog (modal)**.

## 🎯 CAUSA RAÍZ

Los componentes `SelectContent` de shadcn/ui tienen problemas de **z-index** cuando se renderizan dentro de modales, ya que el modal tiene un z-index alto y los selectores se renderizan detrás.

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. **Z-Index Específico para Selectores**

```typescript
// En AddressFormAdvanced.tsx
<SelectContent className="z-select-in-modal" position="popper" sideOffset={4}>
```

### 2. **CSS Hierarchy Actualizada**

```css
/* En z-index-hierarchy.css */
.z-select-content {
  z-index: 4000;
}
.z-select-in-modal {
  z-index: 6000;
}

/* Reglas específicas para Radix UI */
[data-radix-popper-content-wrapper] {
  z-index: 6000 !important;
}

[data-radix-select-content] {
  z-index: 6000 !important;
}
```

### 3. **Modal Z-Index Ajustado**

```typescript
// En addresses/page.tsx
<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[100]">
```

### 4. **Configuración de Select Mejorada**

```typescript
<Select onValueChange={field.onChange} defaultValue={field.value}>
  <FormControl>
    <SelectTrigger>
      <SelectValue placeholder="Selecciona..." />
    </SelectTrigger>
  </FormControl>
  <SelectContent className="z-select-in-modal" position="popper" sideOffset={4}>
    <SelectItem value="option">Option</SelectItem>
  </SelectContent>
</Select>
```

## 📁 ARCHIVOS MODIFICADOS

### 1. **src/components/Address/AddressFormAdvanced.tsx**

- ✅ Agregado `className="z-select-in-modal"` a ambos SelectContent
- ✅ Agregado `position="popper" sideOffset={4}` para mejor posicionamiento
- ✅ Mantenido `defaultValue={field.value}` para React Hook Form

### 2. **src/app/(site)/(pages)/addresses/page.tsx**

- ✅ Agregado `z-[100]` a ambos DialogContent (crear y editar)
- ✅ Asegurado que los modales tengan z-index apropiado

### 3. **src/styles/z-index-hierarchy.css**

- ✅ Agregadas clases `.z-select-content` y `.z-select-in-modal`
- ✅ Agregadas reglas específicas para `[data-radix-select-content]`
- ✅ Agregadas reglas para `[data-radix-popper-content-wrapper]`

### 4. **src/app/layout.tsx**

- ✅ Importado `../styles/z-index-hierarchy.css`
- ✅ Asegurado que las reglas CSS se apliquen globalmente

## 🧪 CÓMO PROBAR

### ✅ Página de Prueba (Funciona)

1. Ve a `/test-address`
2. Los selectores funcionan porque NO están en modal

### ✅ Página Real (Ahora debería funcionar)

1. Ve a `/addresses`
2. Haz clic en "Agregar Nueva Dirección"
3. Prueba los selectores de **Tipo de dirección** y **Provincia**
4. Deberían abrirse correctamente sobre el modal

### ✅ Edición de Direcciones

1. En `/addresses`, haz clic en el botón de editar (lápiz)
2. Prueba los selectores en el modal de edición
3. Deberían funcionar igual que en creación

## 🔍 QUÉ VERIFICAR

### ✅ Selectores Funcionando

- [ ] Se abren al hacer clic
- [ ] Aparecen SOBRE el modal (no detrás)
- [ ] Se pueden seleccionar opciones
- [ ] El valor se muestra correctamente
- [ ] No hay scroll issues

### ✅ Z-Index Correcto

- [ ] SelectContent aparece sobre DialogContent
- [ ] No hay conflictos visuales
- [ ] Los selectores no se cortan
- [ ] Funciona en mobile y desktop

### ✅ Funcionalidad Completa

- [ ] React Hook Form captura los valores
- [ ] Validación funciona correctamente
- [ ] Submit envía los datos correctos
- [ ] Edición carga valores existentes

## 🎯 JERARQUÍA Z-INDEX FINAL

```
Nivel 8: Selectores en modales (6000)
Nivel 7: Modales y dialogs (5000-5999)
Nivel 6: Overlays y dropdowns (2000-4999)
Nivel 5: Navegación (1000-1999)
Nivel 4: Elementos flotantes (100-999)
Nivel 3: Contenido base (0-99)
```

## 🐛 TROUBLESHOOTING

### Si los selectores siguen sin funcionar:

1. **Verificar importación CSS**:

   ```typescript
   // En layout.tsx debe estar:
   import '../styles/z-index-hierarchy.css'
   ```

2. **Verificar clases aplicadas**:

   ```typescript
   // Debe tener:
   <SelectContent className="z-select-in-modal" position="popper" sideOffset={4}>
   ```

3. **Verificar en DevTools**:
   - Inspeccionar el SelectContent
   - Verificar que tenga `z-index: 6000`
   - Confirmar que no hay otros elementos con z-index mayor

4. **Verificar modal**:
   ```typescript
   // Debe tener:
   <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[100]">
   ```

## 📊 RESULTADO ESPERADO

- ✅ **Página de prueba**: Selectores funcionan (ya funcionaba)
- ✅ **Página real**: Selectores funcionan en modales (corregido)
- ✅ **Edición**: Selectores funcionan en modal de edición (corregido)
- ✅ **Mobile**: Funciona en dispositivos móviles
- ✅ **Desktop**: Funciona en escritorio

---

**Estado**: ✅ Correcciones aplicadas para selectores en modales
**Fecha**: 13 de Septiembre, 2025
**Próximo paso**: Probar en `/addresses` y confirmar funcionamiento
