'use client'

import { AdminCard } from '../ui/AdminCard'
import { Input } from '../ui/Input'
import { SystemSettings } from '@/hooks/admin/useSettings'
import { BarChart3, Share2, Mail, Image, Database } from '@/lib/optimized-imports'

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
            helperText='ID de seguimiento de Google Analytics'
          />

          <Input
            label='Google Tag Manager ID'
            value={settings.integrations.google_tag_manager_id}
            onChange={(e) => handleChange('google_tag_manager_id', e.target.value)}
            icon={BarChart3}
            placeholder='GTM-XXXXXXX'
            helperText='ID de contenedor de GTM'
          />

          <Input
            label='Facebook Pixel ID'
            value={settings.integrations.facebook_pixel_id}
            onChange={(e) => handleChange('facebook_pixel_id', e.target.value)}
            icon={Share2}
            placeholder='1234567890123456'
            helperText='ID del pixel de Facebook'
          />
        </div>
      </AdminCard>

      <AdminCard title='Email Marketing' description='Servicios de email marketing'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Mailchimp API Key'
            type='password'
            value={settings.integrations.mailchimp_api_key}
            onChange={(e) => handleChange('mailchimp_api_key', e.target.value)}
            icon={Mail}
            placeholder='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1'
            helperText='Clave API de Mailchimp'
          />

          <Input
            label='SendGrid API Key'
            type='password'
            value={settings.integrations.sendgrid_api_key}
            onChange={(e) => handleChange('sendgrid_api_key', e.target.value)}
            icon={Mail}
            placeholder='SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
            helperText='Clave API de SendGrid'
          />
        </div>
      </AdminCard>

      <AdminCard title='Almacenamiento' description='Servicios de almacenamiento de archivos'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Cloudinary Cloud Name'
            value={settings.integrations.cloudinary_cloud_name}
            onChange={(e) => handleChange('cloudinary_cloud_name', e.target.value)}
            icon={Image}
            placeholder='tu-cloud-name'
            helperText='Nombre de tu cuenta de Cloudinary'
          />

          <Input
            label='AWS S3 Bucket'
            value={settings.integrations.aws_s3_bucket}
            onChange={(e) => handleChange('aws_s3_bucket', e.target.value)}
            icon={Database}
            placeholder='mi-bucket-s3'
            helperText='Nombre del bucket de AWS S3'
          />
        </div>
      </AdminCard>

      <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
        <p className='text-sm text-yellow-800'>
          <strong>Nota de Seguridad:</strong> Las API keys se almacenan de forma segura en la base de datos. 
          Nunca compartas estas credenciales públicamente.
        </p>
      </div>
    </div>
  )
}
