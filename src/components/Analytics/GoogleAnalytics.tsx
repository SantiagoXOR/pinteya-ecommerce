/**
 * Componente de Google Analytics para Pinteya E-commerce
 * Maneja la carga e inicialización de GA4
 */

'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { initGA, trackPageView, GA_TRACKING_ID, isGAEnabled, waitForGA } from '@/lib/google-analytics';

const GoogleAnalytics: React.FC = () => {
  const pathname = usePathname();
  const [isGALoaded, setIsGALoaded] = useState(false);

  // Manejar cuando GA está listo
  const handleGALoad = async () => {
    try {
      await waitForGA();
      setIsGALoaded(true);
    } catch (error) {
      console.warn('Error loading Google Analytics:', error);
    }
  };

  // Track page views cuando GA está listo y cambia la ruta
  useEffect(() => {
    if (isGALoaded && isGAEnabled() && typeof window !== 'undefined') {
      trackPageView(window.location.href);
    }
  }, [pathname, isGALoaded]);

  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        onLoad={handleGALoad}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_title: document.title,
              page_location: window.location.href,
              send_page_view: false
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
