"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, AlertCircle, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { GlobalNotification } from "@/components/notification-table"

// Import the global notifications (this is a reference to the in-memory store)
let globalNotifications: GlobalNotification[] = []

// This is a hack for demo purposes - in a real app, you'd use a proper state management solution
// to access the global notifications from notification-table.tsx
if (typeof window !== "undefined") {
  // @ts-ignore - accessing the global variable
  globalNotifications = window.globalNotifications || []

  // Set up a global variable to track if we've initialized the notifications
  // @ts-ignore
  if (!window.notificationsInitialized) {
    // @ts-ignore
    window.notificationsInitialized = true
    // @ts-ignore
    window.globalNotifications = globalNotifications
  }
}

export default function DashboardNotificationTable() {
  const [notifications, setNotifications] = useState<GlobalNotification[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = () => {
      // In a real app, this would be an API call or state management access
      // @ts-ignore - accessing the global variable
      const currentNotifications = window.globalNotifications || []
      setNotifications([...currentNotifications])
    }

    // Initial fetch
    fetchNotifications()

    // Set up polling every 5 seconds
    const interval = setInterval(fetchNotifications, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    // @ts-ignore - accessing the global variable
    const currentNotifications = window.globalNotifications || []
    setNotifications([...currentNotifications])
    setTimeout(() => setLoading(false), 500)
  }

  const markAllAsRead = () => {
    // @ts-ignore - accessing the global variable
    if (window.globalNotifications) {
      // @ts-ignore
      window.globalNotifications = window.globalNotifications.map((n: GlobalNotification) => ({ ...n, read: true }))
      // @ts-ignore
      setNotifications([...window.globalNotifications])
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle>Recent Notifications</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-md">
            <p className="text-muted-foreground">No notifications at this time</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[40%]">Message</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.slice(0, 5).map((notification) => (
                  <TableRow key={notification.id} className={notification.read ? "" : "bg-blue-50"}>
                    <TableCell>
                      <Badge
                        variant={notification.type === "critical" ? "destructive" : "warning"}
                        className="flex items-center gap-1"
                      >
                        {notification.type === "critical" ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {notification.type === "critical" ? "Critical" : "Warning"}
                      </Badge>
                    </TableCell>
                    <TableCell>{notification.message}</TableCell>
                    <TableCell>
                      <Link href={`/monitoring/${notification.machineId}`} className="text-primary hover:underline">
                        Machine {notification.machineId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {notification.timestamp.toLocaleTimeString()} {notification.timestamp.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {notification.read ? (
                        <Badge variant="secondary">Read</Badge>
                      ) : (
                        <Badge variant="default">Unread</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {notifications.length > 5 && (
              <div className="p-2 text-center border-t">
                <Link href="#" className="text-primary text-sm hover:underline">
                  View all {notifications.length} notifications
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
