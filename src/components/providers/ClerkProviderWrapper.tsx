"use client";

import { ClerkProvider } from '@clerk/nextjs';
import { esES } from '@clerk/localizations';

interface ClerkProviderWrapperProps {
  children: React.ReactNode;
}

export default function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  return (
    <ClerkProvider
      localization={esES}
      signInFallbackRedirectUrl="/shop"
      signUpFallbackRedirectUrl="/shop"
      afterSignOutUrl="/"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#fc9d04', // tahiti-gold color from your theme
          colorText: '#1F2937', // dark color
          colorTextSecondary: '#6B7280', // gray-600
          colorBackground: '#FFFFFF',
          colorInputBackground: '#F9FAFB',
          colorInputText: '#1F2937',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-tahiti-gold-500 hover:bg-tahiti-gold-700 text-white font-medium transition-colors duration-200',
          card: 'shadow-lg border border-gray-200',
          headerTitle: 'text-dark font-semibold',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton: 'border border-gray-300 hover:border-gray-400 transition-colors duration-200',
          formFieldInput: 'border border-gray-300 focus:border-tahiti-gold-500 focus:ring-1 focus:ring-tahiti-gold-500',
          footerActionLink: 'text-tahiti-gold-500 hover:text-tahiti-gold-700',
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
