"use client"

import { useState, useEffect } from "react"
import { fetchMachineById } from "@/lib/api"
import type { Machine } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Info, Activity } from "lucide-react"

export default function MachineDetails({ machineId }: { machineId: number }) {
  const [machine, setMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)
  const [uptime, setUptime] = useState<string>("0h 0m")

  useEffect(() => {
    const loadMachine = async () => {
      try {
        setLoading(true)
        const data = await fetchMachineById(machineId)
        setMachine(data)

        // Generate a random uptime for demo purposes
        const hours = Math.floor(Math.random() * 240) // 0-240 hours
        const minutes = Math.floor(Math.random() * 60) // 0-59 minutes
        setUptime(`${hours}h ${minutes}m`)
      } catch (err) {
        console.error("Failed to load machine details", err)
      } finally {
        setLoading(false)
      }
    }

    loadMachine()
  }, [machineId])

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 animate-pulse h-24"></div>
  }

  if (!machine) {
    return <div className="bg-red-50 p-4 rounded-md text-red-800">Machine not found or failed to load details.</div>
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{machine.machine_label}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Info className="h-4 w-4" />
              <span>ID: {machine.machine_id}</span>
              <span className="mx-2">•</span>
              <Calendar className="h-4 w-4" />
              <span>Installed: {machine.installation_date}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Uptime: {uptime}</span>
            </div>

            <Badge variant={machine.is_active ? "success" : "secondary"} className="flex items-center gap-1 px-3 py-1">
              <Activity className="h-4 w-4" />
              {machine.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
