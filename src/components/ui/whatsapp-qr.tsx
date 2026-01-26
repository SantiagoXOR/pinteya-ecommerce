'use client'

import React, { useRef, useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'
import { Download, Loader2 } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantWhatsAppNumber } from '@/lib/tenant/tenant-whatsapp'

interface WhatsAppQRProps {
  size?: number // Tamaño del QR (default: 256)
  message?: string // Mensaje opcional para WhatsApp
  showDownload?: boolean // Mostrar botón de descarga (default: true)
  className?: string // Clases CSS adicionales
}

const WhatsAppQR: React.FC<WhatsAppQRProps> = ({
  size = 256,
  message,
  showDownload = true,
  className,
}) => {
  const qrRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [logoDataUrl, setLogoDataUrl] = useState<string>('')
  
  // Obtener datos del tenant
  const tenant = useTenantSafe()
  const whatsappNumber = getTenantWhatsAppNumber(tenant)
  const tenantLogo = tenant?.logoUrl || `/tenants/${tenant?.slug || 'pinteya'}/logo.svg`
  const tenantName = tenant?.name || 'PinteYa'
  const tenantPrimaryColor = tenant?.primaryColor || '#eb6313'

  // Construir URL de WhatsApp
  const whatsappUrl = message
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${whatsappNumber}`

  // Cargar el logo como data URL para incluirlo en el SVG
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch(tenantLogo)
        const svgText = await response.text()
        const blob = new Blob([svgText], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        
        // Convertir a data URL
        const reader = new FileReader()
        reader.onloadend = () => {
          setLogoDataUrl(reader.result as string)
          URL.revokeObjectURL(url)
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error('Error al cargar logo:', error)
      }
    }
    loadLogo()
  }, [tenantLogo])

  // Función para descargar el QR como SVG
  const handleDownload = async () => {
    if (!qrRef.current) return

    setIsDownloading(true)
    try {
      // Obtener el SVG del QR
      const qrSvg = qrRef.current.querySelector('svg')
      if (!qrSvg) {
        throw new Error('No se encontró el SVG del QR')
      }

      // Crear un nuevo SVG que contenga todo
      const padding = 16
      const totalSize = size + padding * 2
      const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      newSvg.setAttribute('width', totalSize.toString())
      newSvg.setAttribute('height', totalSize.toString())
      newSvg.setAttribute('viewBox', `0 0 ${totalSize} ${totalSize}`)
      newSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      newSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
      
      // Fondo blanco con bordes redondeados
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bgRect.setAttribute('width', totalSize.toString())
      bgRect.setAttribute('height', totalSize.toString())
      bgRect.setAttribute('fill', '#ffffff')
      bgRect.setAttribute('rx', '8')
      newSvg.appendChild(bgRect)
      
      // Clonar el QR y ajustarlo con padding usando un grupo
      const clonedQr = qrSvg.cloneNode(true) as SVGSVGElement
      clonedQr.setAttribute('width', size.toString())
      clonedQr.setAttribute('height', size.toString())
      clonedQr.removeAttribute('style') // Remover estilos inline que puedan interferir
      
      const qrGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      qrGroup.setAttribute('transform', `translate(${padding}, ${padding})`)
      qrGroup.appendChild(clonedQr)
      newSvg.appendChild(qrGroup)
      
      // Agregar el logo en el centro
      if (logoDataUrl) {
        const logoSize = Math.floor(size * 0.2)
        const logoPadding = 8
        const logoContainerSize = logoSize + logoPadding * 2
        const centerX = totalSize / 2
        const centerY = totalSize / 2
        
        // Fondo blanco del logo
        const logoBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        logoBg.setAttribute('x', (centerX - logoContainerSize / 2).toString())
        logoBg.setAttribute('y', (centerY - logoContainerSize / 2).toString())
        logoBg.setAttribute('width', logoContainerSize.toString())
        logoBg.setAttribute('height', logoContainerSize.toString())
        logoBg.setAttribute('fill', '#ffffff')
        logoBg.setAttribute('rx', '8')
        newSvg.appendChild(logoBg)
        
        // Imagen del logo
        const logoImage = document.createElementNS('http://www.w3.org/2000/svg', 'image')
        logoImage.setAttribute('href', logoDataUrl)
        logoImage.setAttribute('x', (centerX - logoSize / 2).toString())
        logoImage.setAttribute('y', (centerY - logoSize / 2).toString())
        logoImage.setAttribute('width', logoSize.toString())
        logoImage.setAttribute('height', logoSize.toString())
        logoImage.setAttribute('preserveAspectRatio', 'xMidYMid meet')
        newSvg.appendChild(logoImage)
      }
      
      // Convertir SVG a string
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(newSvg)
      
      // Crear blob y descargar
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.download = 'pinteya-whatsapp-qr.svg'
      link.href = url
      link.click()
      
      URL.revokeObjectURL(url)
      setIsDownloading(false)
    } catch (error) {
      console.error('Error al descargar QR:', error)
      setIsDownloading(false)
    }
  }

  // Tamaño del logo (proporcional al QR)
  const logoSize = Math.floor(size * 0.2) // 20% del tamaño del QR

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Contenedor del QR con logo */}
      <div
        ref={qrRef}
        className='relative inline-flex items-center justify-center bg-white p-4 rounded-lg shadow-lg'
        style={{ width: size + 32, height: size + 32 }} // +32 para padding
      >
        {/* QR Code */}
        <QRCodeSVG
          value={whatsappUrl}
          size={size}
          level='H' // Alto nivel de corrección de errores para permitir logo
          fgColor={tenantPrimaryColor}
          bgColor='#ffffff'
          includeMargin={false}
        />

        {/* Logo del tenant superpuesto en el centro */}
        <div
          className='absolute bg-white rounded-lg p-2 shadow-md'
          style={{
            width: logoSize + 16,
            height: logoSize + 16,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Image
            src={tenantLogo}
            alt={`${tenantName} Logo`}
            width={logoSize}
            height={logoSize}
            className='object-contain'
            priority
          />
        </div>
      </div>

      {/* Botón de descarga */}
      {showDownload && (
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-tenant-primary hover:bg-tenant-primary-dark text-white',
            'font-semibold transition-colors duration-200',
            'shadow-md hover:shadow-lg',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-tenant-primary focus:ring-offset-2'
          )}
          aria-label='Descargar código QR'
        >
          {isDownloading ? (
            <>
              <Loader2 className='w-4 h-4 animate-spin' />
              <span>Descargando...</span>
            </>
          ) : (
            <>
              <Download className='w-4 h-4' />
              <span>Descargar QR</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

export { WhatsAppQR }
export default WhatsAppQR

