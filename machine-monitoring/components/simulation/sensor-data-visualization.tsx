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
  const [error, setError] = useState<string | null>(null)
  const [currentValues, setCurrentValues] = useState<SensorData | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Setup data polling
  useEffect(() => {
    const pollData = async () => {
      try {
        setError(null)
        console.log("Fetching sensor data for machine:", machineId)
        const data = await fetchSensorData(machineId)
        console.log("Received sensor data:", data)
        
        if (!Array.isArray(data)) {
          console.error("Invalid sensor data format received:", data)
          setError("Invalid data format received from server")
          return
        }
        
        if (data.length === 0) {
          console.log("No sensor data available")
          setSensorData([])
          setCurrentValues(null)
          setLoading(false)
          return
        }
        
        // Handle the array of data points from the API
        setSensorData((prev) => {
          // Keep only the last 20 data points for better visualization
          const newData = [...prev, ...data]
          if (newData.length > 20) {
            return newData.slice(newData.length - 20)
          }
          return newData
        })
        
        // Set current values to the latest data point
        if (data.length > 0) {
          console.log("Setting current values to:", data[0])
          setCurrentValues(data[0])  // Data is already sorted by timestamp DESC
        }
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch sensor data:", err)
        if (err instanceof Error) {
          console.error("Error details:", {
            name: err.name,
            message: err.message,
            stack: err.stack
          })
        }
        setError(err instanceof Error ? err.message : "Failed to fetch sensor data")
        setLoading(false)
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
        data: sensorData.map((d) => d.temperature ?? 0),
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
        data: sensorData.map((d) => d.vibration ?? 0),
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
        data: sensorData.map((d) => d.load ?? 0),
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
        data: sensorData.map((d) => d.power_consumption ?? 0),
        borderColor: "rgb(255, 159, 64)",
        backgroundColor: "rgba(255, 159, 64, 0.5)",
      },
    ],
  }

  if (loading && sensorData.length === 0) {
    return <div className="text-center p-8">Loading sensor data...</div>
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>
  }

  if (sensorData.length === 0) {
    return <div className="text-center p-8">No sensor data available</div>
  }

  // Helper function to determine if a value is in a warning or critical range
  const getStatusBadge = (value: number | undefined, type: string) => {
    if (value === undefined) {
      return <Badge variant="secondary">unknown</Badge>
    }

    let status = "normal"
    let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" = "success"

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
    } else if (type === "power_consumption") {
      if (value > 12) {
        status = "critical"
        variant = "destructive"
      } else if (value > 10) {
        status = "warning"
        variant = "warning"
      }
    }

    return <Badge variant={variant}>{status}</Badge>
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
              <div className="text-2xl font-bold">
                {currentValues.temperature !== undefined ? `${currentValues.temperature.toFixed(1)}°C` : 'N/A'}
              </div>
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
              <div className="text-2xl font-bold">
                {currentValues.vibration !== undefined ? `${currentValues.vibration.toFixed(2)} mm/s` : 'N/A'}
              </div>
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
              <div className="text-2xl font-bold">
                {currentValues.load !== undefined ? `${currentValues.load.toFixed(1)}%` : 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                Power Consumption
                {getStatusBadge(currentValues.power_consumption, "power_consumption")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">
                {currentValues.power_consumption !== undefined ? `${currentValues.power_consumption.toFixed(2)} kW` : 'N/A'}
              </div>
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
