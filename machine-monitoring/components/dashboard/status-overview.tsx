"use client"

import { useState, useEffect } from "react"
import { fetchMachines } from "@/lib/api"
import type { Machine } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Power, AlertTriangle } from "lucide-react"

export default function StatusOverview() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMachines = async () => {
      try {
        setLoading(true)
        const data = await fetchMachines()
        setMachines(data)
      } catch (err) {
        console.error("Failed to load machines for status overview", err)
      } finally {
        setLoading(false)
      }
    }

    loadMachines()
  }, [])

  const totalMachines = machines.length
  const activeMachines = machines.filter((m) => m.is_active).length
  // For this demo, we'll assume machines needing maintenance are those with IDs divisible by 3
  const maintenanceMachines = machines.filter((m) => m.machine_id % 3 === 0).length

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-gray-100"></CardHeader>
            <CardContent className="h-10 mt-2 bg-gray-100"></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
          <Power className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMachines}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
          <Activity className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeMachines}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Needing Maintenance</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{maintenanceMachines}</div>
        </CardContent>
      </Card>
    </div>
  )
}
