import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test Basic Page | Pinteya E-commerce',
  robots: {
    index: false,
    follow: false,
  },
}

export default function TestBasicPage() {
  return (
    <div>
      <h1>Test Basic Page</h1>
      <p>This is a basic test page.</p>
    </div>
  )
}

