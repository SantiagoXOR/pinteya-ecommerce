// Test simple para verificar el adaptador de productos
const { adaptApiProductToLegacy } = require('./src/lib/adapters/productAdapter.ts')

// Producto de ejemplo de la API
const apiProduct = {
  id: 89,
  name: 'Lija al Agua Grano 80',
  slug: 'lija-al-agua-grano-80-el-galgo',
  price: 780,
  discounted_price: null,
  brand: 'El Galgo',
  stock: 50,
  images: {
    main: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-80.png',
    gallery: [
      'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-80.png',
    ],
    previews: [
      'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-80.png',
    ],
    thumbnails: [
      'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-80.png',
    ],
  },
  category: null,
}

console.log('🔍 Producto original de la API:')
console.log(JSON.stringify(apiProduct, null, 2))

try {
  const adaptedProduct = adaptApiProductToLegacy(apiProduct)

  console.log('\n✅ Producto adaptado:')
  console.log(JSON.stringify(adaptedProduct, null, 2))

  console.log('\n🔍 Verificaciones:')
  console.log('- Tiene title:', !!adaptedProduct.title)
  console.log('- Tiene price:', !!adaptedProduct.price)
  console.log('- Tiene discountedPrice:', !!adaptedProduct.discountedPrice)
  console.log('- Tiene imgs:', !!adaptedProduct.imgs)
  console.log('- Tiene imgs.previews:', !!adaptedProduct.imgs?.previews)
  console.log('- Tiene brand:', !!adaptedProduct.brand)
} catch (error) {
  console.error('❌ Error en el adaptador:', error)
}
