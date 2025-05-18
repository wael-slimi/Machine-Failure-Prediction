"use client"

import { useState, useEffect, useRef } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import type { Prediction } from "@/lib/types"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function PredictionsTimeline({ machineId, simulationActive }: { machineId: number, simulationActive: boolean }) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!simulationActive) {
      // If simulation is not active, close any open stream and clear predictions
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setPredictions([])
      return
    }
    // Start streaming predictions
    const eventSource = new EventSource("http://localhost:5000/api/simulation/stream")
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.prediction) {
          setPredictions(prev => {
            const newPredictions = [...prev, data.prediction]
            // Keep only the last 24 predictions
            return newPredictions.slice(-24)
          })
        }
      } catch (err) {
        console.error("Error parsing prediction data:", err)
      }
    }

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [simulationActive])

  const chartData = {
    labels: predictions.map((_, index) => `T-${predictions.length - index}`),
    datasets: [
      {
        label: "Prediction Score",
        data: predictions.map(p => p.prediction * 100), // Convert to percentage
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Probability (%)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Time Steps",
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Probability: ${context.parsed.y.toFixed(1)}%`
          },
        },
      },
    },
  }

  if (loading) {
    return <div className="text-center p-8">Loading predictions...</div>
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>
  }

  if (predictions.length === 0) {
    return <div className="text-center p-8">No predictions available</div>
  }

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={chartOptions} />
    </div>
  )
}
