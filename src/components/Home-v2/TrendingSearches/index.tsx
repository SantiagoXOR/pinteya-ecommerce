'use client'

import React from 'react'
import Link from 'next/link'
import { TrendingUp, Search } from 'lucide-react'
import { trackEvent } from '@/lib/google-analytics'

const trendingSearches = [
  { term: 'Látex', icon: '🎨' },
  { term: 'Antióxido', icon: '🛡️' },
  { term: 'Impermeabilizante', icon: '💧' },
  { term: 'Piscinas', icon: '🏊' },
  { term: 'Esmalte Sintético', icon: '✨' },
  { term: 'Membrana Líquida', icon: '🏗️' },
  { term: 'Pintura para Techos', icon: '🏠' },
  { term: 'Rodillos', icon: '🖌️' },
]

const TrendingSearches = () => {
  const handleSearchClick = (term: string) => {
    trackEvent('trending_search_click', 'engagement', term)
  }

  return (
    <section className='bg-gradient-to-br from-gray-50 to-white py-8 border-b border-gray-100'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-5'>
          <div className='flex items-center gap-2 text-orange-600'>
            <TrendingUp className='w-5 h-5' />
            <h2 className='font-bold text-lg text-gray-900'>
              Búsquedas Populares
            </h2>
          </div>
          <div className='h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent'></div>
        </div>

        {/* Chips de búsquedas */}
        <div className='grid grid-cols-2 md:flex md:flex-wrap gap-3'>
          {trendingSearches.map((search, index) => (
            <Link
              key={index}
              href={`/search?q=${encodeURIComponent(search.term)}`}
              onClick={() => handleSearchClick(search.term)}
              className='group relative bg-white hover:bg-orange-50 border-2 border-gray-200 hover:border-orange-300 rounded-full px-4 py-2.5 transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2'
            >
              {/* Icon */}
              <span className='text-xl group-hover:scale-110 transition-transform'>
                {search.icon}
              </span>

              {/* Term */}
              <span className='font-medium text-gray-700 group-hover:text-orange-600 transition-colors'>
                {search.term}
              </span>

              {/* Search icon on hover */}
              <Search className='w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1' />

              {/* Shimmer effect */}
              <div className='absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-1000'></div>
            </Link>
          ))}
        </div>

        {/* CTA secundario */}
        <div className='mt-6 text-center'>
          <Link
            href='/search'
            className='inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 font-medium transition-colors group'
          >
            <Search className='w-4 h-4' />
            Ver todos los productos
            <span className='group-hover:translate-x-1 transition-transform'>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default TrendingSearches

