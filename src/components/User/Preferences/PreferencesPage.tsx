'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationSettings } from './NotificationSettings'
import { DisplaySettings } from './DisplaySettings'
import { PrivacySettings } from './PrivacySettings'

export function PreferencesPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Preferencias</h1>
        <p className='text-gray-600'>
          Personaliza tu experiencia y configura tus preferencias de la plataforma.
        </p>
      </div>

      {/* Preferences Tabs */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <Tabs defaultValue='notifications' className='w-full'>
          <TabsList className='grid w-full grid-cols-3 rounded-none border-b'>
            <TabsTrigger value='notifications' className='rounded-none'>
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value='display' className='rounded-none'>
              Display
            </TabsTrigger>
            <TabsTrigger value='privacy' className='rounded-none'>
              Privacidad
            </TabsTrigger>
          </TabsList>

          <TabsContent value='notifications' className='p-6'>
            <NotificationSettings />
          </TabsContent>

          <TabsContent value='display' className='p-6'>
            <DisplaySettings />
          </TabsContent>

          <TabsContent value='privacy' className='p-6'>
            <PrivacySettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
