import React from 'react'
import MailSuccess from '@/components/MailSuccess'

import { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Mail Success Page | NextCommerce Nextjs E-commerce template',
  description: 'This is Mail Success Page for NextCommerce Template',
  robots: {
    index: false,
    follow: false,
  },
}

const MailSuccessPage = () => {
  return (
    <main>
      <MailSuccess />
    </main>
  )
}

export default MailSuccessPage
