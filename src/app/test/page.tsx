import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test Page | Pinteya E-commerce',
  robots: {
    index: false,
    follow: false,
  },
}

export default function TestPage() {
  return (
    <div>
      <h1>Test Page</h1>
      <p>This is a minimal test page to isolate webpack issues.</p>
    </div>
  )
}
