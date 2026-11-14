export const metadata = {
  title: 'BizBox App Store – Point of Sale, KDS, Inventory & Business Apps',
  description: 'Official app marketplace for BizBox business OS and edge hardware',
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
