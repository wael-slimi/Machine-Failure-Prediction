"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCw, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addGlobalNotification } from "@/components/notification-table"
import type { Machine } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

export default function MachineControls({ machine }: { machine: Machine }) {
  const [isEmergencyStopping, setIsEmergencyStopping] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isSchedulingMaintenance, setIsSchedulingMaintenance] = useState(false)
  const { toast } = useToast()

  const handleEmergencyStop = () => {
    setIsEmergencyStopping(true)

    // Simulate API call
    setTimeout(() => {
      setIsEmergencyStopping(false)

      // Add notification
      addGlobalNotification({
        machineId: machine.machine_id,
        type: "critical",
        message: `EMERGENCY STOP triggered for ${machine.machine_label}`,
        timestamp: new Date(),
      })

      toast({
        title: "EMERGENCY STOP",
        description: `${machine.machine_label} has been emergency stopped. Maintenance required.`,
        variant: "destructive",
      })
    }, 1500)
  }

  const handleRestart = () => {
    setIsRestarting(true)

    // Simulate API call
    setTimeout(() => {
      setIsRestarting(false)

      // Add notification
      addGlobalNotification({
        machineId: machine.machine_id,
        type: "warning",
        message: `${machine.machine_label} has been restarted`,
        timestamp: new Date(),
      })

      toast({
        title: "Machine Restarted",
        description: `${machine.machine_label} has been restarted successfully.`,
      })
    }, 2000)
  }

  const handleScheduleMaintenance = () => {
    setIsSchedulingMaintenance(true)

    // Simulate API call
    setTimeout(() => {
      setIsSchedulingMaintenance(false)

      // Add notification
      addGlobalNotification({
        machineId: machine.machine_id,
        type: "warning",
        message: `Maintenance scheduled for ${machine.machine_label}`,
        timestamp: new Date(),
      })

      toast({
        title: "Maintenance Scheduled",
        description: `Maintenance has been scheduled for ${machine.machine_label}.`,
      })
    }, 1500)
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Machine Controls & Metadata</h2>
          <p className="text-sm text-muted-foreground mt-1">Control and monitor {machine.machine_label}</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="text-sm">
            <span className="text-muted-foreground">Machine ID:</span> {machine.machine_id}
          </div>
          <div className="text-sm mx-2">|</div>
          <div className="text-sm">
            <span className="text-muted-foreground">Installed:</span> {machine.installation_date}
          </div>
          <div className="text-sm mx-2">|</div>
          <div>
            <Badge variant={machine.is_active ? "success" : "secondary"}>
              {machine.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          variant="destructive"
          onClick={handleEmergencyStop}
          disabled={isEmergencyStopping}
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          {isEmergencyStopping ? "Stopping..." : "Emergency Stop"}
        </Button>

        <Button variant="default" onClick={handleRestart} disabled={isRestarting} className="flex items-center gap-2">
          <RotateCw className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`} />
          {isRestarting ? "Restarting..." : "Restart Machine"}
        </Button>

        <Button
          variant="outline"
          onClick={handleScheduleMaintenance}
          disabled={isSchedulingMaintenance}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          {isSchedulingMaintenance ? "Scheduling..." : "Schedule Maintenance"}
        </Button>
      </div>
    </div>
  )
}
