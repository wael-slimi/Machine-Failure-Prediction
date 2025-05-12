import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import NotificationTable from "@/components/notification-table"
import NavigationMenu from "@/components/navigation-menu"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Machine Monitoring System",
  description: "Real-time monitoring and predictive maintenance for industrial machines",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b">
              <div className="container mx-auto p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Machine Monitoring System</h1>
                <NotificationTable />
              </div>
            </header>
            <NavigationMenu />
            <main>{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
