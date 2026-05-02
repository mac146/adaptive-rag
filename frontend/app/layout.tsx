import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Adaptive RAG',
  description: 'Adaptive retrieval workspace for document-aware Q&A.',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
