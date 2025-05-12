"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Square, Wrench, RotateCw, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addGlobalNotification } from "@/components/notification-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MachineControlPanel({ machineId }: { machineId: number }) {
  const [isRunning, setIsRunning] = useState(true)
  const [isRequestingMaintenance, setIsRequestingMaintenance] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isEmergency, setIsEmergency] = useState(false)
  const { toast } = useToast()

  const handleToggleMachine = () => {
    setIsRunning(!isRunning)

    // Add notification
    addGlobalNotification({
      machineId,
      type: "warning",
      message: `Machine ${machineId} has been ${isRunning ? "stopped" : "started"} manually.`,
      timestamp: new Date(),
    })

    toast({
      title: isRunning ? "Machine Stopped" : "Machine Started",
      description: `Machine ${machineId} has been ${isRunning ? "stopped" : "started"} successfully.`,
    })
  }

  const handleRequestMaintenance = () => {
    setIsRequestingMaintenance(true)

    // Simulate API call
    setTimeout(() => {
      setIsRequestingMaintenance(false)

      // Add notification
      addGlobalNotification({
        machineId,
        type: "warning",
        message: `Maintenance request for Machine ${machineId} has been submitted.`,
        timestamp: new Date(),
      })

      toast({
        title: "Maintenance Requested",
        description: `Maintenance request for Machine ${machineId} has been submitted.`,
      })
    }, 1500)
  }

  const handleReset = () => {
    setIsResetting(true)

    // Simulate API call
    setTimeout(() => {
      setIsResetting(false)

      // Add notification
      addGlobalNotification({
        machineId,
        type: "warning",
        message: `Machine ${machineId} has been reset.`,
        timestamp: new Date(),
      })

      toast({
        title: "Machine Reset",
        description: `Machine ${machineId} has been reset successfully.`,
      })
    }, 2000)
  }

  const handleEmergency = () => {
    setIsRunning(false)
    setIsEmergency(true)

    // Add notification
    addGlobalNotification({
      machineId,
      type: "critical",
      message: `EMERGENCY STOP triggered for Machine ${machineId}.`,
      timestamp: new Date(),
    })

    toast({
      title: "EMERGENCY STOP",
      description: `Machine ${machineId} has been emergency stopped. Maintenance required.`,
      variant: "destructive",
    })

    // Reset emergency state after 5 seconds
    setTimeout(() => {
      setIsEmergency(false)
    }, 5000)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Machine Control</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Operation Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                variant={isRunning ? "destructive" : "default"}
                onClick={handleToggleMachine}
                className="flex items-center gap-2"
                disabled={isEmergency}
              >
                {isRunning ? (
                  <>
                    <Square className="h-4 w-4" />
                    Stop Machine
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Machine
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isResetting || isEmergency}
                className="flex items-center gap-2"
              >
                <RotateCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
                {isResetting ? "Resetting..." : "Reset Machine"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Maintenance Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={handleRequestMaintenance}
                disabled={isRequestingMaintenance || isEmergency}
                className="flex items-center gap-2"
              >
                <Wrench className="h-4 w-4" />
                {isRequestingMaintenance ? "Requesting..." : "Request Maintenance"}
              </Button>

              <Button
                variant="destructive"
                onClick={handleEmergency}
                disabled={isEmergency}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Emergency Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
