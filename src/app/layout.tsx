import { Manrope } from 'next/font/google'
import { cn } from '@/lib/utils'
import './globals.css'
import { Providers } from './providers'
import Script from 'next/script'
import NavBar from '@/components/NavBar'

const fontHeading = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
})

const fontBody = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

export const metadata = {
  title: 'Crypto Capitalist',
  description: 'An idle clicker game for Telegram',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body
        className={cn(
          'antialiased min-h-screen bg-background',
          fontHeading.variable,
          fontBody.variable
        )}
      >
        <Providers>
          {children}
          <NavBar />
        </Providers>
      </body>
    </html>
  )
}