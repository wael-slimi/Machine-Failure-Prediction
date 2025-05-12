"use client"

import { useState, useEffect } from "react"
import { fetchPredictions } from "@/lib/api"
import { AlertTriangle, AlertCircle, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addGlobalNotification } from "@/components/notification-table"
import { Button } from "@/components/ui/button"

export default function NotificationsPanel({ machineId }: { machineId: number }) {
  const [notifications, setNotifications] = useState<
    {
      type: "warning" | "critical"
      message: string
      timestamp: Date
    }[]
  >([])
  const [muted, setMuted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkPredictions = async () => {
      try {
        const predictions = await fetchPredictions(machineId)

        // Check for critical predictions (> 0.8)
        const criticalPredictions = predictions.filter((p) => p.prediction > 0.8)
        if (criticalPredictions.length > 0) {
          const newNotification = {
            type: "critical" as const,
            message: `Critical alert: Machine ${machineId} has ${criticalPredictions.length} high-risk predictions`,
            timestamp: new Date(),
          }

          setNotifications((prev) => [newNotification, ...prev].slice(0, 10))

          // Add to global notifications
          addGlobalNotification({
            machineId,
            type: "critical",
            message: newNotification.message,
            timestamp: new Date(),
          })

          if (!muted) {
            toast({
              title: "Critical Alert",
              description: newNotification.message,
              variant: "destructive",
            })
          }
        }

        // Check for warning predictions (> 0.5)
        const warningPredictions = predictions.filter((p) => p.prediction > 0.5 && p.prediction <= 0.8)
        if (warningPredictions.length > 0) {
          const newNotification = {
            type: "warning" as const,
            message: `Warning: Machine ${machineId} has ${warningPredictions.length} medium-risk predictions`,
            timestamp: new Date(),
          }

          setNotifications((prev) => [newNotification, ...prev].slice(0, 10))

          // Add to global notifications
          addGlobalNotification({
            machineId,
            type: "warning",
            message: newNotification.message,
            timestamp: new Date(),
          })

          if (!muted) {
            toast({
              title: "Warning",
              description: newNotification.message,
              variant: "warning",
            })
          }
        }
      } catch (err) {
        console.error("Failed to check predictions for notifications", err)
      }
    }

    checkPredictions()

    // Check for new notifications every 30 seconds
    const interval = setInterval(checkPredictions, 30000)

    return () => clearInterval(interval)
  }, [machineId, toast, muted])

  const toggleMute = () => {
    setMuted(!muted)
    toast({
      title: muted ? "Notifications Enabled" : "Notifications Muted",
      description: muted ? "You will now receive toast notifications" : "Toast notifications have been muted",
    })
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleMute} className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            {muted ? "Unmute" : "Mute"}
          </Button>
          <Button variant="outline" size="sm" onClick={clearNotifications}>
            Clear
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
          No alerts at this time
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`p-3 rounded-md flex items-start gap-3 ${
                notification.type === "critical" ? "bg-red-50 text-red-800" : "bg-orange-50 text-orange-800"
              }`}
            >
              {notification.type === "critical" ? (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              )}
              <div>
                <div className="font-medium">{notification.message}</div>
                <div className="text-xs mt-1">{notification.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
