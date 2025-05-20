"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { addGlobalNotification } from "@/components/notification-table"
import PredictionsTimeline from "./predictions-timeline"

interface SimulationSectionProps {
  simulationActive: boolean;
  setSimulationActive: (active: boolean) => void;
  setSimPrediction: (prediction: number | null) => void;
  setSimSensorData: (data: any) => void;
}

export default function SimulationSection({ simulationActive, setSimulationActive, setSimPrediction, setSimSensorData }: SimulationSectionProps) {
  const [intervalMs, setIntervalMs] = useState(1000)
  const [currentTimestamp, setCurrentTimestamp] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startSimulation = async () => {
    setSimulationActive(true)
    await fetch("http://localhost:5000/api/simulation/reset", { method: "POST" })
    intervalRef.current = setInterval(runSimulationStep, intervalMs)
  }

  const stopSimulation = () => {
    setSimulationActive(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    if (!simulationActive && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [simulationActive])

  const runSimulationStep = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/simulation/simulate", { method: "POST" })
      const data = await response.json()
      setStatus(data.status)
      setCurrentTimestamp(data.timestamp)
      let sensorData = data.sensor_data ?? null
      if (sensorData) {
        sensorData = {
          ...sensorData,
          temperature: Number(sensorData.temperature),
          vibration: Number(sensorData.vibration),
          load: Number(sensorData.load),
          power_consumption: Number(sensorData.power_consumption),
          cycle_time: Number(sensorData.cycle_time),
        }
      }
      setSimPrediction(data.prediction?.prediction ?? null)
      setSimSensorData(sensorData)
      if (data.prediction?.prediction > 0.8) {
        addGlobalNotification({
          machineId: 5000,
          type: "critical",
          message: `High probability of failure: ${(data.prediction.prediction * 100).toFixed(2)}%`,
          timestamp: new Date(),
        })
      } else if (data.prediction?.prediction > 0.5) {
        addGlobalNotification({
          machineId: 5000,
          type: "warning",
          message: `Moderate probability of failure: ${(data.prediction.prediction * 100).toFixed(2)}%`,
          timestamp: new Date(),
        })
      }
      if (data.status === "complete") {
        stopSimulation()
      }
    } catch (err) {
      stopSimulation()
    }
  }

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIntervalMs(Number(e.target.value))
    if (simulationActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(runSimulationStep, Number(e.target.value))
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Simulation (Machine 5000)</CardTitle>
        <div className="flex gap-2">
          <Button onClick={simulationActive ? stopSimulation : startSimulation} variant={simulationActive ? "destructive" : "default"}>
            {simulationActive ? "Stop Simulation" : "Start Simulation"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Simulation Speed (ms/step):</label>
            <input
              type="number"
              min={100}
              step={100}
              value={intervalMs}
              onChange={handleIntervalChange}
              className="border rounded px-2 py-1 w-32"
              disabled={simulationActive}
            />
          </div>
          {currentTimestamp && (
            <div className="text-sm text-muted-foreground">Current Time: {new Date(currentTimestamp).toLocaleString()}</div>
          )}
          {status && (
            <Badge variant={status === "running" ? "default" : "secondary"}>{status}</Badge>
          )}
        </div>
        {/* AI Predictions Timeline */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">AI Predictions Timeline</h3>
          <PredictionsTimeline machineId={5000} simulationActive={simulationActive} />
        </div>
      </CardContent>
    </Card>
  )
} 