"use client"

import { useState, useEffect } from "react"
import { fetchMachines } from "@/lib/api"
import type { Machine } from "@/lib/types"
import MachineSelector from "@/components/simulation/machine-selector"
import SensorDataVisualization from "@/components/simulation/sensor-data-visualization"
import PredictionsTimeline from "@/components/simulation/predictions-timeline"
import SimulationNotifications from "@/components/simulation/simulation-notifications"
import MachineControls from "@/components/simulation/machine-controls"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function SimulationPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadMachines = async () => {
      try {
        setLoading(true)
        const data = await fetchMachines()
        setMachines(data.machines)

        // Set machine ID 5000 as default
        const machine5000 = data.machines.find(m => m.machine_id === 5000)
        if (machine5000) {
          setSelectedMachine(machine5000)
        } else if (data.machines.length > 0) {
          setSelectedMachine(data.machines[0])
        }
      } catch (err) {
        console.error("Failed to load machines", err)
      } finally {
        setLoading(false)
      }
    }

    loadMachines()
  }, [])

  const handleMachineChange = (machineId: number) => {
    const machine = machines.find((m) => m.machine_id === machineId)
    if (machine) {
      setSelectedMachine(machine)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-8">Loading machines...</div>
      </div>
    )
  }

  if (machines.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="mb-4">No machines available for simulation.</p>
          <button className="bg-primary text-white px-4 py-2 rounded-md" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Single-Machine Simulation</h1>

      <Card className="p-4">
        <MachineSelector
          machines={machines}
          selectedMachineId={selectedMachine?.machine_id || 0}
          onMachineChange={handleMachineChange}
        />
      </Card>

      {selectedMachine && (
        <>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Real-Time Data Visualization</h2>
            <SensorDataVisualization machineId={selectedMachine.machine_id} />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">AI Predictions</h2>
              <PredictionsTimeline machineId={selectedMachine.machine_id} />
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              <SimulationNotifications machineId={selectedMachine.machine_id} />
            </Card>
          </div>

          <Card className="p-6">
            <MachineControls machine={selectedMachine} />
          </Card>
        </>
      )}
    </div>
  )
}
