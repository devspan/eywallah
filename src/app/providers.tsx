// src/app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { TelegramAuthProvider } from '@/components/TelegramAuthProvider'

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramAuthProvider>
        {children}
      </TelegramAuthProvider>
    </QueryClientProvider>
  )
}