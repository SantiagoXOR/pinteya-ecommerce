'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'

interface SearchBoxProps {
  onSearch: (searchTerm: string) => void
  currentSearch?: string
}

const SearchBox = ({ onSearch, currentSearch = '' }: SearchBoxProps) => {
  const [searchTerm, setSearchTerm] = useState(currentSearch)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchTerm.trim())
  }

  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <Card>
      <CardContent className='p-5'>
        <div className='mb-3'>
          <h3 className='text-gray-900 font-medium flex items-center gap-2'>
            <Search className='w-4 h-4 text-primary' />
            Buscar Productos
          </h3>
        </div>

        <form onSubmit={handleSubmit} className='space-y-3'>
          <div className='relative'>
            <Input
              type='text'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder='Buscar pinturas, herramientas...'
              leftIcon={<Search className='w-4 h-4' />}
              className='pr-10'
            />

            {searchTerm && (
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={handleClear}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6'
                aria-label='Limpiar búsqueda'
              >
                <X className='w-3 h-3' />
              </Button>
            )}
          </div>

          <Button type='submit' className='w-full' size='sm'>
            <Search className='w-4 h-4 mr-2' />
            Buscar
          </Button>
        </form>

        {currentSearch && (
          <div className='mt-3 flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Buscando:</span>
            <Badge variant='outline' className='gap-1'>
              {currentSearch}
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={handleClear}
                className='h-4 w-4 p-0 hover:bg-transparent'
              >
                <X className='w-3 h-3' />
              </Button>
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SearchBox