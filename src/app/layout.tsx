"use client";

import { Manrope } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers';
import Script from 'next/script';
import NavBar from '@/components/NavBar';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const fontHeading = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const fontBody = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

// Dynamically import Eruda only in development mode
const ErudaInit = dynamic(
  () => import('@/components/ErudaInit'),
  { ssr: false }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');

    // Add viewport meta tag dynamically
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);
  }, []);

  return (
    <html lang="en">
      <head>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive"
        />
        <meta name="title" content="Crypto Capitalist" />
        <meta name="description" content="An idle clicker game for Telegram" />
      </head>
      <body
        className={cn(
          'antialiased min-h-screen bg-background font-body',
          fontHeading.variable,
          fontBody.variable
        )}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow pb-16"> {/* Add padding at the bottom to prevent content from being hidden behind the NavBar */}
              {children}
            </main>
            <NavBar />
          </div>
        </Providers>
        {isDevelopment && <ErudaInit />}
      </body>
    </html>
  );
}