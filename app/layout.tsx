import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-sans'
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'BRUSH - University Student Hub',
  description: 'The ultimate university student hub. Course routines, class finder, CGPA calculator - all in one place.',
  keywords: ['bracu', 'university', 'student', 'course', 'routine', 'cgpa', 'calculator', 'class finder'],
  authors: [{ name: 'BRUSH Team' }],
  openGraph: {
    title: 'BRUSH - University Student Hub',
    description: 'The ultimate university student hub with course routines, class finder, and CGPA calculator.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAFF00',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
