'use client'

import React, { useState, useEffect } from 'react'
import '@/styles/collapsible.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface ApiDebugEntry {
  id: string
  timestamp: Date
  endpoint: string
  method: string
  status: 'success' | 'error' | 'warning'
  responseTime: number
  data: any
  error?: string
  validationResults?: {
    totalReceived: number
    validItems: number
    filteredOut: number
    issues: string[]
  }
}

interface ApiDebugPanelProps {
  className?: string
}

export function ApiDebugPanel({ className }: ApiDebugPanelProps) {
  const [entries, setEntries] = useState<ApiDebugEntry[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)

  // Interceptar console.log para capturar logs de API
  useEffect(() => {
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    console.log = (...args) => {
      originalLog(...args)

      // Capturar logs específicos de API
      const message = args.join(' ')
      if (
        message.includes('🔍 Processing orders response:') ||
        message.includes('🔍 Order filtering results:') ||
        message.includes('🚨 CRITICAL:')
      ) {
        const entry: ApiDebugEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          endpoint: '/api/admin/orders',
          method: 'GET',
          status: message.includes('🚨')
            ? 'error'
            : message.includes('filtered')
              ? 'warning'
              : 'success',
          responseTime: 0,
          data: args[1] || args[0],
          error: message.includes('🚨') ? message : undefined,
        }

        setEntries(prev => [entry, ...prev.slice(0, 19)]) // Mantener solo 20 entradas
      }
    }

    console.warn = (...args) => {
      originalWarn(...args)

      const message = args.join(' ')
      if (
        message.includes('🔍 Order validation failed') ||
        message.includes('🔍 Order has invalid')
      ) {
        const entry: ApiDebugEntry = {
          id: Date.now().toString() + '_warn',
          timestamp: new Date(),
          endpoint: '/api/admin/orders',
          method: 'VALIDATION',
          status: 'warning',
          responseTime: 0,
          data: args[1] || args[0],
          error: message,
        }

        setEntries(prev => [entry, ...prev.slice(0, 19)])
      }
    }

    console.error = (...args) => {
      originalError(...args)

      const message = args.join(' ')
      if (message.includes('🚨 CRITICAL:')) {
        const entry: ApiDebugEntry = {
          id: Date.now().toString() + '_error',
          timestamp: new Date(),
          endpoint: '/api/admin/orders',
          method: 'VALIDATION',
          status: 'error',
          responseTime: 0,
          data: args[1] || args[0],
          error: message,
        }

        setEntries(prev => [entry, ...prev.slice(0, 19)])
      }
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  const clearEntries = () => {
    setEntries([])
    setSelectedEntry(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='w-4 h-4 text-green-500' />
      case 'warning':
        return <AlertTriangle className='w-4 h-4 text-yellow-500' />
      case 'error':
        return <XCircle className='w-4 h-4 text-red-500' />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className={`${className} border-2 border-dashed border-blue-300 bg-blue-50`}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-semibold text-blue-800 flex items-center gap-2'>
            🔧 API Debug Panel
            <Badge variant='outline' className='text-xs'>
              {entries.length} entries
            </Badge>
          </CardTitle>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={clearEntries} className='text-xs'>
              Clear
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsExpanded(!isExpanded)}
              className='text-xs'
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className='pt-0'>
          <div className='space-y-2 max-h-96 overflow-y-auto'>
            {entries.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                No API calls captured yet. Try refreshing the orders page.
              </div>
            ) : (
              entries.map(entry => (
                <Collapsible key={entry.id}>
                  <CollapsibleTrigger className='w-full'>
                    <div className='flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors'>
                      <div className='flex items-center gap-3'>
                        {getStatusIcon(entry.status)}
                        <div className='text-left'>
                          <div className='font-medium text-sm'>
                            {entry.method} {entry.endpoint}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {entry.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge className={getStatusColor(entry.status)}>{entry.status}</Badge>
                        <ChevronDown className='w-4 h-4' />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className='mt-2 p-3 bg-gray-50 rounded-lg border'>
                      {entry.error && (
                        <div className='mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700'>
                          <strong>Error:</strong> {entry.error}
                        </div>
                      )}
                      <div className='text-sm'>
                        <strong>Data:</strong>
                        <pre className='mt-1 p-2 bg-white border rounded text-xs overflow-x-auto'>
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
