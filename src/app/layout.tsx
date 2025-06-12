"use client";

import { Providers } from './providers';
import './css/style.css';
import './css/euclid-circular-a-font.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
