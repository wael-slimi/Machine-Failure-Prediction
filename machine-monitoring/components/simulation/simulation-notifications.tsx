"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import type { Prediction } from "@/lib/types"

interface Notification {
  id: number
  timestamp: string
  message: string
  severity: "warning" | "error" | "info"
}

export default function SimulationNotifications({ machineId }: { machineId: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentTimestamp, setCurrentTimestamp] = useState<string | null>(null)
  const simulationInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current)
      }
    }
  }, [])

  const startSimulation = async () => {
    try {
      setIsSimulating(true)
      // Reset simulation
      await fetch("http://localhost:5000/api/simulation/reset", {
        method: "POST",
      })

      // Start simulation loop
      simulationInterval.current = setInterval(async () => {
        try {
          const response = await fetch("http://localhost:5000/api/simulation/simulate", {
            method: "POST",
          })
          const data = await response.json()

          if (data.status === "complete") {
            stopSimulation()
            return
          }

          setCurrentTimestamp(data.timestamp)

          // Check prediction and add notification if needed
          const prediction = data.prediction.prediction
          if (prediction > 0.8) {
            addNotification({
              id: Date.now(),
              timestamp: data.timestamp,
              message: `High probability of maintenance needed (${(prediction * 100).toFixed(1)}%)`,
              severity: "error"
            })
          } else if (prediction > 0.5) {
            addNotification({
              id: Date.now(),
              timestamp: data.timestamp,
              message: `Moderate probability of maintenance needed (${(prediction * 100).toFixed(1)}%)`,
              severity: "warning"
            })
          }
        } catch (error) {
          console.error("Simulation error:", error)
          stopSimulation()
        }
      }, 1000) // Run every second
    } catch (error) {
      console.error("Failed to start simulation:", error)
      setIsSimulating(false)
    }
  }

  const stopSimulation = () => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current)
      simulationInterval.current = null
    }
    setIsSimulating(false)
  }

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10)) // Keep last 10 notifications
  }

  const getSeverityColor = (severity: Notification["severity"]) => {
    switch (severity) {
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      case "info":
        return "bg-blue-500"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          {currentTimestamp && (
            <p className="text-sm text-gray-500">
              Current Time: {new Date(currentTimestamp).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={isSimulating ? stopSimulation : startSimulation}
          className={`px-4 py-2 rounded-md ${
            isSimulating
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } text-white`}
        >
          {isSimulating ? "Stop Simulation" : "Start Simulation"}
        </button>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500">No notifications yet</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-3 rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{notification.message}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge className={getSeverityColor(notification.severity)}>
                  {notification.severity}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
