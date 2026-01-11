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
    const { data: categories, error } = await supabase
      .from('categories')
      .select(
        `
        id,
        name,
        slug,
        description,
        image_url,
        parent_id,
        display_order,
        created_at
      `
      )
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return (categories as Category[]) || []
  } catch (error) {
    console.error('Error in getCategories:', error)
    return []
  }
})

/**
 * Preload pattern: Inicia el fetch temprano sin esperar el resultado
 */
export function preloadCategories() {
  void getCategories()
}
