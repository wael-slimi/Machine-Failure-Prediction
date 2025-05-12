"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, AlertCircle, Bell, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

// Global notification store (in a real app, this would be managed by a state management library)
export type GlobalNotification = {
  id: string
  machineId: number
  type: "warning" | "critical"
  message: string
  timestamp: Date
  read: boolean
}

// In-memory store for demo purposes
let globalNotifications: GlobalNotification[] = []

// Make it accessible globally for the demo
if (typeof window !== "undefined") {
  // @ts-ignore
  window.globalNotifications = globalNotifications
}

// Helper function to add a notification
export function addGlobalNotification(notification: Omit<GlobalNotification, "id" | "read">) {
  const id = Math.random().toString(36).substring(2, 9)
  const newNotification = { ...notification, id, read: false }
  globalNotifications = [newNotification, ...globalNotifications].slice(0, 50) // Keep last 50 notifications

  // Update the global reference
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.globalNotifications = globalNotifications
  }

  return newNotification
}

export default function NotificationTable() {
  const [notifications, setNotifications] = useState<GlobalNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()

  // Fetch notifications
  useEffect(() => {
    // Poll for new notifications every 5 seconds
    const interval = setInterval(() => {
      setNotifications([...globalNotifications])
      setUnreadCount(globalNotifications.filter((n) => !n.read).length)
    }, 5000)

    // Initial load
    setNotifications([...globalNotifications])
    setUnreadCount(globalNotifications.filter((n) => !n.read).length)

    return () => clearInterval(interval)
  }, [])

  // For demo purposes, generate some sample notifications if none exist
  useEffect(() => {
    if (globalNotifications.length === 0) {
      // Add some sample notifications for demo
      const machines = [1, 2, 3, 4, 5]
      const types = ["warning", "critical"] as const
      const messages = [
        "High temperature detected",
        "Excessive vibration",
        "Power consumption spike",
        "Maintenance recommended",
        "Failure probability exceeds threshold",
      ]

      // Generate 5 random notifications
      for (let i = 0; i < 5; i++) {
        const machineId = machines[Math.floor(Math.random() * machines.length)]
        const type = types[Math.floor(Math.random() * types.length)]
        const message = messages[Math.floor(Math.random() * messages.length)]

        // Create notification with a random timestamp in the last 24 hours
        const timestamp = new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000))

        addGlobalNotification({
          machineId,
          type,
          message: `${message} on Machine ${machineId}`,
          timestamp,
        })
      }

      setNotifications([...globalNotifications])
      setUnreadCount(globalNotifications.filter((n) => !n.read).length)
    }
  }, [])

  const markAllAsRead = () => {
    globalNotifications = globalNotifications.map((n) => ({ ...n, read: true }))
    setNotifications([...globalNotifications])
    setUnreadCount(0)

    // Update the global reference
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.globalNotifications = globalNotifications
    }

    toast({
      title: "Notifications",
      description: "All notifications marked as read",
    })
  }

  const markAsRead = (id: string) => {
    globalNotifications = globalNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    setNotifications([...globalNotifications])
    setUnreadCount(globalNotifications.filter((n) => !n.read).length)

    // Update the global reference
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.globalNotifications = globalNotifications
    }
  }

  const clearNotifications = () => {
    globalNotifications = []
    setNotifications([])
    setUnreadCount(0)

    // Update the global reference
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.globalNotifications = []
    }

    toast({
      title: "Notifications",
      description: "All notifications cleared",
    })
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button variant="ghost" size="sm" className="relative" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[90vw] md:w-[600px] bg-white shadow-lg rounded-md z-50 border">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
              <Button variant="outline" size="sm" onClick={clearNotifications}>
                Clear all
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No notifications</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
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
                        <Link
                          href={`/monitoring/${notification.machineId}`}
                          className="text-primary hover:underline"
                          onClick={() => {
                            markAsRead(notification.id)
                            setIsOpen(false)
                          }}
                        >
                          Machine {notification.machineId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {notification.timestamp.toLocaleTimeString()} {notification.timestamp.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {!notification.read && (
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                            Mark as read
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
