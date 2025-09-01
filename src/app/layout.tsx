import type React from "react"
import type { Metadata } from "next"
import { Nunito, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { TRPCReactProvider } from "~/lib/trpc-provider"
import { SessionProvider } from "~/lib/session-provider"
import { Toaster } from "sonner"

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800"],
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Family Quests - Adventure Awaits!",
  description: "Transform chores into epic family adventures with quests, treasures, and magical rewards.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/svg" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: 'Quests', 
    capable: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${nunito.variable} ${inter.variable} antialiased`}>
        <TRPCReactProvider>
          <SessionProvider>
            <Suspense fallback={null}>
              {children}
              <Analytics />
              <Toaster richColors position="bottom-right" />
            </Suspense>
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  )
}
