// Force redeploy to fix Server Action error - 2025-08-02T00:30:00.000Z
import { Providers } from './providers';
import './css/style.css';
import './css/euclid-circular-a-font.css';
import { metadata as defaultMetadata } from './metadata';
import StructuredData from '@/components/SEO/StructuredData';
import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics';
import JsonSafetyInitializer from '@/components/JsonSafetyInitializer';
import AuthRedirectDebugger from '@/components/debug/AuthRedirectDebugger';
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
        <GoogleAnalytics />
      </head>
      <body>
        <Providers>
          {/* <JsonSafetyInitializer /> */}
          {/* <AuthRedirectDebugger /> TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
