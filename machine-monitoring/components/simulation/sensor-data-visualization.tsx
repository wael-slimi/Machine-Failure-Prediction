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
    let isMounted = true;

    const pollData = async () => {
      if (!isMounted) return;

      try {
        setError(null)
        console.log("[SensorDataVisualization] Fetching data for machine:", machineId)
        const data = await fetchSensorData(machineId)
        console.log("[SensorDataVisualization] Received data:", JSON.stringify(data, null, 2))
        
        if (!isMounted) return;
        
        if (!Array.isArray(data)) {
          console.error("[SensorDataVisualization] Invalid data format:", data)
          setError("Invalid data format received from server")
          return
        }
        
        if (data.length === 0) {
          console.log("[SensorDataVisualization] No data available")
          setSensorData([])
          setCurrentValues(null)
          setLoading(false)
          return
        }

        // Validate data structure
        const isValidData = data.every(item => {
          const hasRequiredFields = 
            typeof item === 'object' && 
            item !== null &&
            'machine_id' in item &&
            'timestamp' in item &&
            'temperature' in item &&
            'vibration' in item &&
            'load' in item &&
            'power_consumption' in item;
          
          if (!hasRequiredFields) {
            console.error("[SensorDataVisualization] Invalid data point:", item)
          }
          return hasRequiredFields;
        });

        if (!isValidData) {
          console.error("[SensorDataVisualization] Data validation failed")
          setError("Invalid data structure received from server")
          return;
        }
        
        // Handle the array of data points from the API
        setSensorData((prev) => {
          const newData = [...prev, ...data].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          console.log("[SensorDataVisualization] Sorted data:", newData.map(d => ({
            timestamp: d.timestamp,
            vibration: d.vibration
          })));
          return newData.slice(0, 20);
        })
        
        // Set current values to the latest data point
        if (data.length > 0) {
          const latestData = data[0];
          console.log("[SensorDataVisualization] Setting current values:", {
            timestamp: latestData.timestamp,
            vibration: latestData.vibration,
            temperature: latestData.temperature,
            load: latestData.load,
            power_consumption: latestData.power_consumption
          });
          setCurrentValues(latestData)
        }
        setLoading(false)
      } catch (err) {
        if (!isMounted) return;
        
        console.error("[SensorDataVisualization] Error:", err)
        if (err instanceof Error) {
          console.error("[SensorDataVisualization] Error details:", {
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
      isMounted = false;
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

  // Prepare chart data with safe defaults
  const labels = sensorData.map((_, index) => `T-${sensorData.length - index}`)

  const prepareChartData = (data: SensorData[], key: keyof SensorData, defaultValue = 0) => {
    return data.map(d => {
      const value = d[key];
      return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
    });
  };

  const temperatureData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: prepareChartData(sensorData, 'temperature'),
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
        data: prepareChartData(sensorData, 'vibration'),
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
        data: prepareChartData(sensorData, 'load'),
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
        data: prepareChartData(sensorData, 'power_consumption'),
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
  const getStatusBadge = (value: number | undefined | null, type: string) => {
    console.log(`[SensorDataVisualization] getStatusBadge called with:`, { value, type });
    
    if (value === undefined || value === null) {
      console.log(`[SensorDataVisualization] ${type} value is ${value}`);
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
      // Vibration thresholds in mm/s
      if (value >= 7.1) {
        status = "critical"
        variant = "destructive"
      } else if (value >= 4.5) {
        status = "warning"
        variant = "warning"
      } else if (value >= 2.8) {
        status = "normal"
        variant = "success"
      } else {
        status = "good"
        variant = "success"
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

  // Helper function to safely format numeric values
  const formatNumericValue = (value: any, decimals: number = 1, unit: string = ''): string => {
    if (value === undefined || value === null) return 'N/A';
    
    // Convert to number and validate
    const numValue = Number(value);
    if (isNaN(numValue)) {
      console.error(`[SensorDataVisualization] Invalid numeric value:`, { value, type: typeof value });
      return 'N/A';
    }
    
    return `${numValue.toFixed(decimals)}${unit}`;
  };

  return (
    <div>
      {/* Current Values Summary */}
      {currentValues && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                Temperature
                {getStatusBadge(Number(currentValues?.temperature), "temperature")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">
                {formatNumericValue(currentValues?.temperature, 1, '°C')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                Vibration
                {getStatusBadge(Number(currentValues?.vibration), "vibration")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">
                {formatNumericValue(currentValues?.vibration, 1, ' mm/s')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                Load
                {getStatusBadge(Number(currentValues?.load), "load")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">
                {formatNumericValue(currentValues?.load, 1, '%')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                Power Consumption
                {getStatusBadge(Number(currentValues?.power_consumption), "power_consumption")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">
                {formatNumericValue(currentValues?.power_consumption, 2, ' kW')}
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
