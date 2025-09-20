const fs = require('fs');
const path = require('path');

// Lista de archivos que usan 'use client' y necesitan corrección
const clientPages = [
  'src/app/(site)/(pages)/addresses/page.tsx',
  'src/app/(site)/(pages)/cart/page.tsx', 
  'src/app/(site)/(pages)/checkout-simple/page.tsx',
  'src/app/(site)/(pages)/checkout/failure/page.tsx',
  'src/app/(site)/(pages)/checkout/page.tsx',
  'src/app/(site)/(pages)/checkout/pending/page.tsx',
  'src/app/(site)/(pages)/checkout/success/page.tsx',
  'src/app/(site)/(pages)/contact/page.tsx',
  'src/app/(site)/(pages)/dashboard/activity/page.tsx',
  'src/app/(site)/(pages)/dashboard/page.tsx',
  'src/app/(site)/(pages)/dashboard/preferences/page.tsx',
  'src/app/(site)/(pages)/dashboard/profile/page.tsx',
  'src/app/(site)/(pages)/dashboard/security/page.tsx',
  'src/app/(site)/(pages)/dashboard/sessions/page.tsx',
  'src/app/(site)/(pages)/orders/page.tsx',
  'src/app/(site)/(pages)/profile/page.tsx',
  'src/app/(site)/(pages)/test-address/page.tsx',
  'src/app/demo/page.tsx',
  'src/app/demo/product-card/page.tsx',
  'src/app/demo/brand-features/page.tsx',
  'src/app/demo/shipping-badge/page.tsx',
  'src/app/demo/commercial-product-card/page.tsx',
  'src/app/driver/dashboard/page.tsx',
  'src/app/driver/profile/page.tsx',
  'src/app/driver/routes/page.tsx',
  'src/app/driver/route/[id]/page.tsx',
  'src/app/admin/optimization/bundle-dashboard/page.tsx',
  'src/app/search/page.tsx'
];

function addDynamicExport(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if already has dynamic export
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`✅ Already fixed: ${filePath}`);
      return;
    }

    // Find the position after 'use client' directive
    const useClientMatch = content.match(/['"]use client['"];?\s*\n/);
    if (!useClientMatch) {
      console.log(`❌ No 'use client' found in: ${filePath}`);
      return;
    }

    const insertPosition = useClientMatch.index + useClientMatch[0].length;
    
    // Insert the dynamic export
    const beforeInsert = content.substring(0, insertPosition);
    const afterInsert = content.substring(insertPosition);
    
    const newContent = beforeInsert + 
      "\n// Forzar renderizado dinámico para evitar problemas con prerendering\n" +
      "export const dynamic = 'force-dynamic';\n" +
      afterInsert;

    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing client-side pages...\n');

clientPages.forEach(addDynamicExport);

console.log('\n✅ All client pages processed!');