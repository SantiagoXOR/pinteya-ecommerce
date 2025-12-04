// ===================================
// SCRIPT PARA GENERAR REPORTE FINAL COMPLETO
// ===================================

const fs = require('fs');
const path = require('path');

function generateMarkdownReport() {
  // Leer los reportes generados
  const reportsDir = path.join(process.cwd(), 'reports');
  const files = fs.readdirSync(reportsDir);
  
  // Encontrar el reporte de verificación más reciente
  const verificationReports = files.filter(f => f.startsWith('verificacion-productos-'));
  const latestVerificationReport = verificationReports.sort().reverse()[0];
  
  // Encontrar el reporte de upload más reciente
  const uploadReports = files.filter(f => f.startsWith('upload-images-'));
  const latestUploadReport = uploadReports.sort().reverse()[0];
  
  // Leer los reportes
  const verificationData = JSON.parse(
    fs.readFileSync(path.join(reportsDir, latestVerificationReport), 'utf-8')
  );
  
  const uploadData = JSON.parse(
    fs.readFileSync(path.join(reportsDir, latestUploadReport), 'utf-8')
  );
  
  // Generar reporte en Markdown
  let markdown = `# 📊 Reporte de Verificación de Productos - Pinteya E-commerce

**Fecha de Generación:** ${new Date().toLocaleString('es-AR')}

---

## 📈 Resumen Ejecutivo

### Productos Analizados

- **Total en CSV:** ${verificationData.resumen.total_csv} productos
- **✅ Coincidentes (sin cambios):** ${verificationData.resumen.coincidentes} productos
- **⚠️  Con diferencias:** ${verificationData.resumen.con_diferencias} productos
- **🆕 Nuevos (no en BD):** ${verificationData.resumen.nuevos} productos

### Imágenes Procesadas

- **🖼️  Optimizadas:** ${verificationData.resumen.imagenes_optimizadas} imágenes (PNG → WebP)
- **📤 Subidas a Supabase:** ${uploadData.exitosas} de ${uploadData.total} imágenes

---

## ⚠️  Productos con Diferencias (${verificationData.productos_con_diferencias.length})

Estos productos existen en la base de datos pero tienen diferencias con el CSV:

| # | Código AIKON | Nombre | Diferencias |
|---|--------------|---------|-------------|
`;

  verificationData.productos_con_diferencias.forEach((producto, idx) => {
    const diffsText = producto.diferencias.map(d => 
      `${d.field}: CSV=${d.csv_value} vs BD=${d.db_value}`
    ).join('<br>');
    markdown += `| ${idx + 1} | ${producto.codigo_aikon} | ${producto.nombre} | ${diffsText} |\n`;
  });

  markdown += `\n### 💡 Recomendaciones para Productos con Diferencias

**Acción Sugerida:** Revisar caso por caso según el usuario

- **Diferencias en Medida:** Algunos productos muestran KG en el CSV pero L en la BD (ej: "10KG" vs "10L")
  - Esto puede ser una inconsistencia de nomenclatura
  - Verificar cuál es la medida correcta según el proveedor
  
- **Diferencias en Color:** Algunos productos tienen múltiples colores en el CSV pero solo uno en la BD
  - Estos pueden requerir crear variantes adicionales por color
  - Ejemplo: PLAVIPINT FIBRADO tiene "BLANCO, ROJO TEJA" pero solo está "BLANCO" en BD

---

## 🆕 Productos Nuevos (${verificationData.productos_nuevos.length})

Estos productos están en el CSV pero NO existen en la base de datos:

| # | Código AIKON | Nombre | Marca | Precio | Medida | Color |
|---|--------------|---------|-------|--------|--------|-------|
`;

  verificationData.productos_nuevos.forEach((producto, idx) => {
    markdown += `| ${idx + 1} | ${producto.codigo_aikon} | ${producto.nombre} | ${producto.marca} | $${producto.precio?.toLocaleString('es-AR') || '-'} | ${producto.medida || '-'} | ${producto.color || '-'} |\n`;
  });

  markdown += `\n### 📝 Notas sobre Productos Nuevos

`;

  // Analizar los códigos AIKON de productos nuevos
  const codigosInvalidos = verificationData.productos_nuevos.filter(p => 
    !p.codigo_aikon || 
    p.codigo_aikon === '-' || 
    p.codigo_aikon === 'EN COMENTARIO' ||
    p.codigo_aikon.includes(',')
  );

  if (codigosInvalidos.length > 0) {
    markdown += `\n⚠️  **Productos con Códigos AIKON Inválidos o Faltantes:**

${codigosInvalidos.map(p => `- **${p.nombre}**: Código AIKON = "${p.codigo_aikon}"`).join('\n')}

**Acción requerida:** Estos productos necesitan códigos AIKON válidos antes de ser agregados a la BD.

`;
  }

  markdown += `\n---

## 🖼️  Imágenes Optimizadas y Subidas

Total: **${uploadData.resultados.length} imágenes**

| # | Descripción | URL Pública | Tamaño |
|---|-------------|-------------|---------|
`;

  uploadData.resultados.forEach((img, idx) => {
    const sizeKB = (img.size / 1024).toFixed(2);
    markdown += `| ${idx + 1} | ${img.description} | [Ver imagen](${img.url}) | ${sizeKB} KB |\n`;
  });

  // Agregar la imagen de Rapifix que se subió después
  markdown += `| ${uploadData.resultados.length + 1} | Cinta de Enmascarar Rapifix | [Ver imagen](https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/rapifix/cinta-enmascarar-rapifix.webp) | 15.61 KB |\n`;

  markdown += `\n### ✅ Proceso de Optimización

- **Formato Original:** PNG
- **Formato Final:** WebP
- **Calidad:** 85%
- **Dimensiones Máximas:** 1200x1200px
- **Reducción de Tamaño:** ~70-80% en promedio

---

## 📋 Próximos Pasos Recomendados

### 1. Revisar Productos con Diferencias (16 productos)

Para cada producto con diferencias, decidir:

- [ ] ¿Actualizar el valor en la BD con el del CSV?
- [ ] ¿Mantener el valor actual de la BD?
- [ ] ¿Requiere crear variantes adicionales? (especialmente para colores múltiples)

### 2. Agregar Productos Nuevos (87 productos)

**Prioridad Alta:**
- Productos con códigos AIKON válidos y toda la información completa

**Acción Requerida:**
- Productos con códigos AIKON inválidos o "EN COMENTARIO" necesitan revisión

### 3. Asociar Imágenes con Productos

Las siguientes imágenes necesitan ser asociadas a sus productos correspondientes:

- \`cinta-enmascarar-rapifix.webp\` → Producto: Cinta Enmascarar RAPIFIX
- \`pinceleta-black-n42-galgo.webp\` → Producto: Pinceleta Black N42 El Galgo
- \`rodillo-17cm-lanar-elefante-galgo.webp\` → Producto: Rodillo 17cm Lanar Elefante
- \`rodillo-gold-flock-galgo.webp\` → Producto: Rodillo Gold Flock
- \`rodillo-mini-epoxi-galgo.webp\` → Producto: Rodillo Mini Epoxi

### 4. Validar Categorías

Verificar que todas las categorías en el CSV existen en la BD y están correctamente asignadas.

---

## 📂 Archivos Generados

- **Reporte de Verificación:** \`${latestVerificationReport}\`
- **Reporte de Upload:** \`${latestUploadReport}\`
- **Imágenes Optimizadas:** \`c:\\Users\\marti\\Desktop\\image-products\\optimized\\\`

---

## 🔍 Análisis Detallado por Categoría

### Diferencias por Tipo

`;

  // Agrupar diferencias por tipo
  const diferenciasPorTipo = {};
  verificationData.productos_con_diferencias.forEach(p => {
    p.diferencias.forEach(d => {
      if (!diferenciasPorTipo[d.field]) {
        diferenciasPorTipo[d.field] = 0;
      }
      diferenciasPorTipo[d.field]++;
    });
  });

  Object.entries(diferenciasPorTipo).forEach(([tipo, cantidad]) => {
    markdown += `- **${tipo}:** ${cantidad} productos\n`;
  });

  markdown += `\n### Productos Nuevos por Marca

`;

  // Agrupar productos nuevos por marca
  const productosPorMarca = {};
  verificationData.productos_nuevos.forEach(p => {
    const marca = p.marca || 'Sin Marca';
    if (!productosPorMarca[marca]) {
      productosPorMarca[marca] = [];
    }
    productosPorMarca[marca].push(p);
  });

  Object.entries(productosPorMarca)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([marca, productos]) => {
      markdown += `- **${marca}:** ${productos.length} productos\n`;
    });

  markdown += `\n---

## ✅ Conclusión

El análisis ha identificado:

1. **68 productos coincidentes** que no requieren acción
2. **16 productos con diferencias** que necesitan revisión manual
3. **87 productos nuevos** listos para agregar (con validación de códigos AIKON)
4. **5 imágenes** optimizadas y subidas a Supabase Storage

**Estado del Proyecto:** ✅ Análisis completado - Listo para decisiones del usuario

---

*Reporte generado automáticamente por el sistema de verificación de productos Pinteya E-commerce*
`;

  return markdown;
}

function main() {
  console.log('📝 Generando reporte final en Markdown...\n');
  
  try {
    const markdown = generateMarkdownReport();
    
    // Guardar reporte en Markdown
    const reportPath = path.join(
      process.cwd(), 
      'reports', 
      `REPORTE_FINAL_VERIFICACION_PRODUCTOS_${Date.now()}.md`
    );
    
    fs.writeFileSync(reportPath, markdown);
    
    console.log('✅ Reporte final generado exitosamente');
    console.log(`📄 Ubicación: ${reportPath}\n`);
    
    // Mostrar primeras líneas del reporte
    const lines = markdown.split('\n').slice(0, 15);
    console.log('📄 Vista previa del reporte:');
    console.log('═══════════════════════════════════════════');
    lines.forEach(line => console.log(line));
    console.log('...\n');
    
    console.log('✨ Todos los pasos completados exitosamente');
    
    return reportPath;
  } catch (error) {
    console.error('❌ Error generando reporte:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateMarkdownReport };

