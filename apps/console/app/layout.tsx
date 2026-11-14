export const metadata = {
  title: 'BizBox Console – Merchant Apps & Edge Hub',
  description: 'Manage installed business apps and edge hardware on BizBox platform',
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
