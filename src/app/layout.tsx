import { Providers } from './providers';
import './css/style.css';
import './css/euclid-circular-a-font.css';
import { metadata as defaultMetadata } from './metadata';
import StructuredData from '@/components/SEO/StructuredData';
import { organizationStructuredData, websiteStructuredData, storeStructuredData } from '@/lib/structured-data';
import type { Metadata } from 'next';

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <StructuredData
          data={[
            organizationStructuredData,
            websiteStructuredData,
            storeStructuredData
          ]}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
