'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthSync } from '@/components/auth-sync'
import { StepUpProvider } from '@/components/auth/step-up-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <>
      <AuthSync />
      <StepUpProvider />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </>
  )
}
