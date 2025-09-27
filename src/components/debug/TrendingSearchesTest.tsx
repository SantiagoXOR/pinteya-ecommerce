'use client'

import React from 'react'
import { useTrendingSearches } from '@/hooks/useTrendingSearches'

export function TrendingSearchesTest() {
  const { trendingSearches, isLoading, error } = useTrendingSearches({
    limit: 4,
    enabled: true,
  })

  console.log('🧪 TrendingSearchesTest - Estado del hook:', {
    trendingSearches,
    isLoading,
    error,
    count: trendingSearches.length,
  })

  return (
    <div className='p-4 border border-red-500 bg-red-50 m-4'>
      <h3 className='font-bold text-red-800'>🧪 Test Trending Searches</h3>
      <div className='mt-2'>
        <p>
          <strong>Loading:</strong> {isLoading ? 'Sí' : 'No'}
        </p>
        <p>
          <strong>Error:</strong> {error ? error.message : 'Ninguno'}
        </p>
        <p>
          <strong>Count:</strong> {trendingSearches.length}
        </p>
        <div className='mt-2'>
          <strong>Trending Searches:</strong>
          <ul className='list-disc ml-4'>
            {trendingSearches.map((search, index) => (
              <li key={index}>
                {search.query} ({search.count})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
