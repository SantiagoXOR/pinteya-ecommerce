'use server'

import 'server-only'
import { cache } from 'react'
import { createPublicClient } from '@/lib/integrations/supabase/server'
import type { Category } from '@/types/category'

/**
 * Obtiene todas las categorías activas desde el servidor
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = createPublicClient()

  try {
    // Intentar primero con display_order, si falla usar sort_order o name
    let { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories with display_order:', error)
      // Intentar sin display_order si falla
      const fallbackResult = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })

      if (fallbackResult.error) {
        console.error('Error fetching categories (fallback):', fallbackResult.error)
        // Último intento: solo ordenar por name
        const lastResult = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true })

        if (lastResult.error) {
          console.error('Error fetching categories (last attempt):', lastResult.error)
          return []
        }

        categories = lastResult.data
      } else {
        categories = fallbackResult.data
      }
    }

    console.log(`✅ getCategories: Found ${categories?.length || 0} categories`)
    return (categories as Category[]) || []
  } catch (error) {
    console.error('Error in getCategories:', error)
    return []
  }
})

/**
 * Preload pattern: Inicia el fetch temprano sin esperar el resultado
 * Debe ser async porque Next.js interpreta exports de 'use server' como Server Actions
 */
export async function preloadCategories() {
  void getCategories()
}
