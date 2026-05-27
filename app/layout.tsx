import type { Metadata } from 'next'
import { Rubik, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/language-provider'

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "700", "900"],
  variable: '--font-rubik'
})
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: '--font-ibm-plex-mono'
})

export const metadata: Metadata = {
  title: 'Tandem - AI Product OS for Guided Vibe Coding',
  description: 'The control tower for AI-assisted product development. Turn ideas into real software with mission briefs, decision memory, and drift detection.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
