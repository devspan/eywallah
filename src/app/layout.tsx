"use client";

import { Manrope } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers';
import Script from 'next/script';
import NavBar from '@/components/NavBar';
import { useEffect } from 'react';
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

// Dynamically import Eruda to avoid SSR issues
const ErudaInit = dynamic(
  () => import('@/components/ErudaInit'),
  { ssr: false }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <NavBar />
          {children}
        </Providers>
        <ErudaInit />
      </body>
    </html>
  );
}