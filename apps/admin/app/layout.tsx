export const metadata = {
  title: 'BizBox Admin Portal – App Review & Store Management',
  description: 'Manage app reviews, security scans, developer payouts, and platform analytics',
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

