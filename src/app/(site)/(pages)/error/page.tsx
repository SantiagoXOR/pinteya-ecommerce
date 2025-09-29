import React from 'react'
import Error from '@/components/Error/index'

import { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Página de Error | Pinteya E-commerce',
  description: 'Página de error para Pinteya E-commerce',
  // other metadata
}

const ErrorPage = () => {
  return (
    <main>
      <Error />
    </main>
  )
}

export default ErrorPage
