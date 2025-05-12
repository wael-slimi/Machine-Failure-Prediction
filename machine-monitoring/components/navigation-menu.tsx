"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Gauge, BarChart2 } from "lucide-react"

export default function NavigationMenu() {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto">
        <div className="flex items-center h-14">
          <div className="flex items-center space-x-8">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                pathname.includes("/dashboard")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Gauge className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link
              href="/simulation"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                pathname.includes("/simulation")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <BarChart2 className="h-5 w-5" />
              <span className="font-medium">Simulation</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
