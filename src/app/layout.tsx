import { Manrope } from 'next/font/google'
import { cn } from '@/lib/utils'
import './globals.css'
import { Providers } from './providers'

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
      <body 
        className={cn(
          'antialiased min-h-screen bg-background',
          fontHeading.variable,
          fontBody.variable
        )}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}