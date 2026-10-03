import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PinkSync - Accessibility Orchestration Platform',
  description: 'Comprehensive accessibility platform for deaf users. One layer connecting services, transforming content, and enhancing digital experiences.',
  keywords: ['accessibility', 'deaf', 'ASL', 'visual authentication', 'content transformation', 'inclusive design'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
