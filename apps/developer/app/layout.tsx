export const metadata = {
  title: 'BizBox Developer Portal – App Submission & CI Pipeline',
  description: 'Build, test, verify, and publish third-party apps for the BizBox App Store',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }} suppressHydrationWarning>{children}</body>
    </html>
  )
}
