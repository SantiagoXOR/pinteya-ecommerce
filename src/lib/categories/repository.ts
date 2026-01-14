/**
 * Category Repository
 * Pinteya E-commerce - Data access layer for categories
 * 
 * This module provides a repository pattern for accessing category data from Supabase.
 * It abstracts database operations and provides a clean interface for the service layer.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import type {
  CategoryBase,
  CategoryInsert,
  CategoryUpdate,
  CategoryFilters,
} from './types'

/**
 * Category Repository
 * Handles all database operations for categories
 */
export class CategoryRepository {
  private supabase: SupabaseClient | null

  constructor(useAdmin = false) {
    this.supabase = getSupabaseClient(useAdmin)
  }

  /**
   * Gets all categories with optional filters
   */
  async getAll(filters?: CategoryFilters): Promise<CategoryBase[]> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    let query = this.supabase
      .from('categories')
      .select('*')

    // Apply filters
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', filters.parent_id)
      }
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'display_order'
    const sortOrder = filters?.sortOrder || 'asc'
    
    if (sortBy === 'display_order') {
      query = query.order('display_order', { ascending: sortOrder === 'asc', nullsFirst: false })
    } else if (sortBy === 'name') {
      query = query.order('name', { ascending: sortOrder === 'asc' })
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`)
    }

    return (data || []) as CategoryBase[]
  }

  /**
   * Gets a category by ID
   */
  async getById(id: number): Promise<CategoryBase | null> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw new Error(`Failed to fetch category: ${error.message}`)
    }

    return data as CategoryBase
  }

  /**
   * Gets a category by slug
   */
  async getBySlug(slug: string): Promise<CategoryBase | null> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw new Error(`Failed to fetch category by slug: ${error.message}`)
    }

    return data as CategoryBase
  }

  /**
   * Creates a new category
   */
  async create(categoryData: CategoryInsert): Promise<CategoryBase> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    // Ensure timestamps are set
    const now = new Date().toISOString()
    const insertData: CategoryInsert = {
      ...categoryData,
      created_at: categoryData.created_at || now,
      updated_at: categoryData.updated_at || now,
    }

    const { data, error } = await this.supabase
      .from('categories')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`)
    }

    return data as CategoryBase
  }

  /**
   * Updates a category
   */
  async update(id: number, categoryData: CategoryUpdate): Promise<CategoryBase> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    // Ensure updated_at is set
    const updateData: CategoryUpdate = {
      ...categoryData,
      updated_at: categoryData.updated_at || new Date().toISOString(),
    }

    const { data, error } = await this.supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`)
    }

    return data as CategoryBase
  }

  /**
   * Deletes a category
   */
  async delete(id: number): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`)
    }
  }

  /**
   * Checks if a slug is already in use
   */
  async isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    let query = this.supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .limit(1)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to check slug availability: ${error.message}`)
    }

    return (data?.length || 0) > 0
  }

  /**
   * Gets categories with product counts
   * This is a more expensive query that joins with products
   */
  async getAllWithProductCounts(filters?: CategoryFilters): Promise<CategoryBase[]> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    // First get all categories
    const categories = await this.getAll(filters)

    // Then get product counts for each category
    const { data: productCounts, error } = await this.supabase
      .from('products')
      .select('category_id')
      .not('category_id', 'is', null)

    if (error) {
      // If we can't get counts, return categories without counts
      console.warn('Failed to fetch product counts:', error.message)
      return categories
    }

    // Count products per category
    const counts = new Map<number, number>()
    productCounts?.forEach(product => {
      if (product.category_id) {
        counts.set(product.category_id, (counts.get(product.category_id) || 0) + 1)
      }
    })

    // Add counts to categories
    return categories.map(category => ({
      ...category,
      products_count: counts.get(category.id) || 0,
    }))
  }

  /**
   * Gets the count of categories matching filters
   */
  async count(filters?: CategoryFilters): Promise<number> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    let query = this.supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    // Apply filters (same as getAll)
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', filters.parent_id)
      }
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count categories: ${error.message}`)
    }

    return count || 0
  }
}

/**
 * Creates a new CategoryRepository instance
 */
export function createCategoryRepository(useAdmin = false): CategoryRepository {
  return new CategoryRepository(useAdmin)
}
