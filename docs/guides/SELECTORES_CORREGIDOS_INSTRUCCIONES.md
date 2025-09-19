# 🔧 SELECTORES CORREGIDOS - INSTRUCCIONES DE PRUEBA

## 📋 PROBLEMA REPORTADO
Los selectores de tipo de dirección y provincia no funcionaban en el formulario de direcciones.

## ✅ CORRECCIONES REALIZADAS

### 1. **Configuración de Select con React Hook Form**
```typescript
// ANTES (No funcionaba)
<Select onValueChange={field.onChange} value={field.value}>

// DESPUÉS (Corregido)
<Select onValueChange={field.onChange} defaultValue={field.value}>
```

### 2. **Estructura del FormControl**
Mantuve la estructura correcta de shadcn/ui:
```typescript
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Placeholder" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="value">Option</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 3. **Valores por Defecto Mejorados**
```typescript
// En el useForm
defaultValues: {
  type: 'shipping',  // Valor por defecto para tipo
  state: '',         // Vacío para provincia
  // ... otros campos
}

// En el useEffect para datos iniciales
const resetData = {
  type: initialData.type || 'shipping',
  state: initialData.state || '',
  // ... otros campos con fallbacks
};
```

### 4. **Debug Agregado**
```typescript
console.log('Resetting form with data:', resetData); // Para debug
```

## 🧪 COMPONENTES DE PRUEBA CREADOS

### 1. **SimpleAddressForm.tsx**
- Formulario simplificado para probar selectores
- Solo campos esenciales: nombre, tipo, provincia, ciudad
- Configuración mínima para verificar funcionamiento

### 2. **Página de Prueba: `/test-address`**
- Compara formulario simple vs avanzado
- Muestra datos enviados en tiempo real
- Permite verificar que los selectores funcionen

## 🚀 INSTRUCCIONES PARA PROBAR

### Opción 1: Servidor de Desarrollo
```bash
npm run dev
```
Luego navegar a: `http://localhost:3001/test-address`

### Opción 2: Páginas Existentes
1. **Página de Direcciones**: `http://localhost:3001/addresses`
   - Hacer clic en "Agregar Nueva Dirección"
   - Probar los selectores de tipo y provincia

2. **Dropdown del Avatar**: 
   - Hacer clic en el avatar del usuario
   - Seleccionar "Mis Direcciones"
   - Probar el formulario

### Opción 3: Si hay problemas con el servidor
1. Revisar la consola del navegador para errores
2. Verificar que los componentes se rendericen correctamente
3. Probar los selectores manualmente

## 🔍 QUÉ VERIFICAR

### ✅ Selector de Tipo de Dirección
- [ ] Se abre el dropdown al hacer clic
- [ ] Muestra las opciones: "Solo envíos", "Solo facturación", "Envíos y facturación"
- [ ] Se puede seleccionar una opción
- [ ] El valor seleccionado se muestra en el campo
- [ ] El formulario captura el valor correctamente

### ✅ Selector de Provincia
- [ ] Se abre el dropdown al hacer clic
- [ ] Muestra las 24 provincias argentinas
- [ ] Se puede seleccionar una provincia
- [ ] El valor seleccionado se muestra en el campo
- [ ] El formulario captura el valor correctamente

### ✅ Integración con React Hook Form
- [ ] Los valores se validan correctamente
- [ ] Los errores se muestran si no se selecciona nada
- [ ] Los datos se envían correctamente al submit
- [ ] Los valores por defecto se cargan al editar

## 🐛 TROUBLESHOOTING

### Si los selectores siguen sin funcionar:

1. **Verificar imports**:
   ```typescript
   import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
   } from '@/components/ui/select';
   ```

2. **Verificar que Toaster esté configurado**:
   - El Toaster ya está agregado en `providers.tsx`
   - Las notificaciones deberían funcionar

3. **Revisar consola del navegador**:
   - Buscar errores de JavaScript
   - Verificar que no haya conflictos de CSS

4. **Verificar versiones**:
   - shadcn/ui debe estar actualizado
   - React Hook Form debe ser compatible

## 📝 ARCHIVOS MODIFICADOS

1. **src/components/Address/AddressFormAdvanced.tsx**
   - Corregidos selectores de tipo y provincia
   - Agregado debug logging
   - Mejorados valores por defecto

2. **src/app/providers.tsx**
   - Agregado Toaster para notificaciones

3. **src/components/ui/toast.tsx**
   - Agregado componente Toaster
   - Importado useToast

4. **src/components/Header/UserAvatarDropdown.tsx**
   - Agregada opción "Mis Direcciones"

5. **Nuevos archivos**:
   - `src/components/Address/SimpleAddressForm.tsx`
   - `src/app/(site)/(pages)/test-address/page.tsx`

## 🎯 PRÓXIMOS PASOS

1. **Probar los selectores** en la página de prueba
2. **Verificar funcionamiento** en páginas reales
3. **Reportar resultados** de las pruebas
4. **Escribir tests unitarios** si todo funciona correctamente

---

**Estado**: ✅ Correcciones aplicadas, listo para pruebas
**Fecha**: 13 de Septiembre, 2025
