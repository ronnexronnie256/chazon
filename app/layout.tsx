import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chazon - Find Local Services & Skilled Stewards',
  description: 'Connect with skilled Stewards in your area for home repairs, furniture assembly, moving help, and more. Book trusted professionals for any task.',
  keywords: 'home services, handyman, furniture assembly, moving, cleaning, home repair',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          <Providers>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#765050FF',
                  color: '#fff',
                },
              }}
            />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
