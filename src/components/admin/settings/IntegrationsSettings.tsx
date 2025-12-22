'use client'

import { AdminCard } from '../ui/AdminCard'
import { Input } from '../ui/Input'
import { SystemSettings } from '@/hooks/admin/useSettings'
import { BarChart3, Share2 } from '@/lib/optimized-imports'

interface IntegrationsSettingsProps {
  settings: SystemSettings
  onChange: (updates: Partial<SystemSettings>) => void
}

export function IntegrationsSettings({ settings, onChange }: IntegrationsSettingsProps) {
  const handleChange = <K extends keyof SystemSettings['integrations']>(
    key: K,
    value: SystemSettings['integrations'][K]
  ) => {
    onChange({
      integrations: {
        ...settings.integrations,
        [key]: value,
      },
    })
  }

  return (
    <div className='space-y-6'>
      <AdminCard title='Analytics y Tracking' description='Integraciones de análisis y seguimiento'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Google Analytics ID'
            value={settings.integrations.google_analytics_id}
            onChange={(e) => handleChange('google_analytics_id', e.target.value)}
            icon={BarChart3}
            placeholder='G-XXXXXXXXXX'
            helperText='ID de seguimiento de Google Analytics 4 (GA4)'
          />

          <Input
            label='Facebook Pixel ID'
            value={settings.integrations.facebook_pixel_id}
            onChange={(e) => handleChange('facebook_pixel_id', e.target.value)}
            icon={Share2}
            placeholder='1234567890123456'
            helperText='ID del pixel de Facebook (Meta Pixel)'
          />
        </div>
      </AdminCard>
    </div>
  )
}
