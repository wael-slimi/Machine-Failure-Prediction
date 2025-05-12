"use client"

import { useState, useEffect, useRef } from "react"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
} from "chart.js"
import { fetchSensorData } from "@/lib/api"
import type { SensorData } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function SensorDataVisualization({ machineId }: { machineId: number }) {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentValues, setCurrentValues] = useState<SensorData | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Setup data polling
  useEffect(() => {
    const pollData = async () => {
      try {
        const data = await fetchSensorData(machineId)
        setSensorData((prev) => {
          // Keep only the last 20 data points for better visualization
          const newData = [...prev, data]
          if (newData.length > 20) {
            return newData.slice(newData.length - 20)
          }
          return newData
        })
        setCurrentValues(data)
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch sensor data", err)
      }
    }

    // Initial fetch
    pollData()

    // Setup polling every 5 seconds
    pollingInterval.current = setInterval(pollData, 5000)

    // Cleanup on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [machineId])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    animation: {
      duration: 300,
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1)
              if (context.dataset.label === "Temperature (°C)") {
                label += "°C"
              } else if (context.dataset.label === "Power Consumption (kW)") {
                label += " kW"
              } else if (context.dataset.label === "Load") {
                label += "%"
              }
            }
            return label
          },
        },
      },
    },
  }

  // Prepare chart data
  const labels = sensorData.map((_, index) => `T-${sensorData.length - index}`)

  const temperatureData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: sensorData.map((d) => d.temperature),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  }

  const vibrationData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Vibration",
        data: sensorData.map((d) => d.vibration),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  }

  const loadData: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: "Load (%)",
        data: sensorData.map((d) => d.load),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 1,
      },
    ],
  }

  const powerData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Power Consumption (kW)",
        data: sensorData.map((d) => d.power),
        borderColor: "rgb(255, 159, 64)",
        backgroundColor: "rgba(255, 159, 64, 0.5)",
      },
    ],
  }

  if (loading && sensorData.length === 0) {
    return <div className="text-center p-8">Loading sensor data...</div>
  }

  // Helper function to determine if a value is in a warning or critical range
  const getStatusBadge = (value: number, type: string) => {
    let status = "normal"
    let variant = "success"

    if (type === "temperature") {
      if (value > 40) {
        status = "critical"
        variant = "destructive"
      } else if (value > 30) {
        status = "warning"
        variant = "warning"
      }
    } else if (type === "vibration") {
      if (value > 4) {
        status = "critical"
        variant = "destructive"
      } else if (value > 3) {
        status = "warning"
        variant = "warning"
      }
    } else if (type === "load") {
      if (value > 70) {
        status = "critical"
        variant = "destructive"
      } else if (value > 50) {
        status = "warning"
        variant = "warning"
      }
    } else if (type === "power") {
      if (value > 12) {
        status = "critical"
        variant = "destructive"
      } else if (value > 10) {
        status = "warning"
        variant = "warning"
      }
    }

    return <Badge variant={variant as any}>{status}</Badge>
  }

  return (
    <div>
      {/* Current Values Summary */}
      {currentValues && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                Temperature
                {getStatusBadge(currentValues.temperature, "temperature")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{currentValues.temperature.toFixed(1)}°C</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                Vibration
                {getStatusBadge(currentValues.vibration, "vibration")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{currentValues.vibration.toFixed(2)} mm/s</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                Load
                {getStatusBadge(currentValues.load, "load")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{currentValues.load.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                Power
                {getStatusBadge(currentValues.power, "power")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{currentValues.power.toFixed(2)} kW</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64">
          <h3 className="text-sm font-medium mb-2">Temperature (°C)</h3>
          <Line options={chartOptions} data={temperatureData} />
        </div>
        <div className="h-64">
          <h3 className="text-sm font-medium mb-2">Vibration (mm/s)</h3>
          <Line options={chartOptions} data={vibrationData} />
        </div>
        <div className="h-64">
          <h3 className="text-sm font-medium mb-2">Load (%)</h3>
          <Bar options={chartOptions} data={loadData} />
        </div>
        <div className="h-64">
          <h3 className="text-sm font-medium mb-2">Power Consumption (kW)</h3>
          <Line options={chartOptions} data={powerData} />
        </div>
      </div>
    </div>
  )
}
