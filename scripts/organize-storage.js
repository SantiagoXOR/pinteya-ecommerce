const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function organizeStorage() {
  try {
    console.log('🗂️  Iniciando organización del bucket product-images...');
    
    // Listar todos los archivos en el bucket
    const { data: files, error: listError } = await supabase.storage
      .from('product-images')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('❌ Error al listar archivos:', listError);
      return;
    }

    console.log('📁 Archivos encontrados:', files.length);
    
    // Definir las organizaciones necesarias (segunda ronda)
    const fileOrganization = {
      // Lijas al agua restantes van a galgo
      'lija-al-agua-120.png': 'galgo/lija-al-agua-120.png',
      'lija-al-agua-180.png': 'galgo/lija-al-agua-180.png',

      // Pinceleta va a genericos
      'pinceleta-obra.png': 'genericos/pinceleta-obra.png',

      // Poximix va a nueva carpeta poximix (nombres correctos con -poxipol)
      'poximix-exterior-05kg-poxipol.png': 'poximix/poximix-exterior-05kg-poxipol.png',
      'poximix-exterior-125kg-poxipol.png': 'poximix/poximix-exterior-125kg-poxipol.png',
      'poximix-exterior-3kg-poxipol.png': 'poximix/poximix-exterior-3kg-poxipol.png',
      'poximix-exterior-5kg-poxipol.png': 'poximix/poximix-exterior-5kg-poxipol.png',
      'poximix-interior-05kg-poxipol.png': 'poximix/poximix-interior-05kg-poxipol.png',
      'poximix-interior-125kg-poxipol.png': 'poximix/poximix-interior-125kg-poxipol.png',
      'poximix-interior-3kg-poxipol.png': 'poximix/poximix-interior-3kg-poxipol.png',
      'poximix-interior-5kg-poxipol.png': 'poximix/poximix-interior-5kg-poxipol.png'
    };

    // Procesar cada archivo que necesita ser movido
    for (const [currentName, newPath] of Object.entries(fileOrganization)) {
      const fileExists = files.find(f => f.name === currentName);
      
      if (fileExists) {
        console.log(`📦 Moviendo ${currentName} → ${newPath}`);
        
        // Mover el archivo
        const { error: moveError } = await supabase.storage
          .from('product-images')
          .move(currentName, newPath);
          
        if (moveError) {
          console.error(`❌ Error moviendo ${currentName}:`, moveError);
        } else {
          console.log(`✅ ${currentName} movido exitosamente`);
        }
        
        // Pequeña pausa entre operaciones
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`⚠️  Archivo ${currentName} no encontrado`);
      }
    }

    console.log('🎉 Organización completada!');
    
    // Listar la estructura final
    console.log('\n📋 Estructura final del bucket:');
    await listBucketStructure();
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

async function listBucketStructure() {
  try {
    // Listar carpetas principales
    const folders = ['galgo', 'genericos', 'petrilac', 'plavicon', 'sinteplast', 'poximix'];
    
    for (const folder of folders) {
      const { data: folderFiles, error } = await supabase.storage
        .from('product-images')
        .list(folder);
        
      if (!error && folderFiles && folderFiles.length > 0) {
        console.log(`\n📁 ${folder}/`);
        folderFiles.forEach(file => {
          console.log(`  📄 ${file.name}`);
        });
      }
    }
    
    // Listar archivos en la raíz
    const { data: rootFiles } = await supabase.storage
      .from('product-images')
      .list('');
      
    const rootFilesList = rootFiles?.filter(f => f.name && !f.name.includes('/')) || [];
    if (rootFilesList.length > 0) {
      console.log('\n📁 / (raíz)');
      rootFilesList.forEach(file => {
        console.log(`  📄 ${file.name}`);
      });
    }
    
  } catch (error) {
    console.error('Error listando estructura:', error);
  }
}

// Ejecutar el script
organizeStorage();
