"use client"

import { useState, useEffect } from "react"
import { fetchPredictions } from "@/lib/api"
import type { Prediction } from "@/lib/types"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, AlertCircle } from "lucide-react"

export default function PredictionsPanel({ machineId }: { machineId: number }) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [criticalCount, setCriticalCount] = useState(0)
  const [warningCount, setWarningCount] = useState(0)

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        setLoading(true)
        const data = await fetchPredictions(machineId)
        setPredictions(data)

        // Count critical and warning predictions
        const critical = data.filter((p) => p.prediction > 0.8).length
        const warning = data.filter((p) => p.prediction > 0.5 && p.prediction <= 0.8).length

        setCriticalCount(critical)
        setWarningCount(warning)
      } catch (err) {
        console.error("Failed to load predictions", err)
      } finally {
        setLoading(false)
      }
    }

    loadPredictions()

    // Refresh predictions every 30 seconds
    const interval = setInterval(loadPredictions, 30000)

    return () => clearInterval(interval)
  }, [machineId])

  const getColorClass = (value: number) => {
    if (value > 0.8) return "bg-red-500"
    if (value > 0.5) return "bg-orange-400"
    return "bg-green-500"
  }

  if (loading && predictions.length === 0) {
    return <div className="text-center p-4">Loading predictions...</div>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">AI Predictions</h2>
      <p className="text-sm text-muted-foreground mb-4">Failure probability for the next 24 time steps</p>

      {/* Summary of predictions */}
      {predictions.length > 0 && (
        <div className="flex gap-4 mb-4">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 bg-red-50 text-red-800 px-3 py-1 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{criticalCount} Critical</span>
            </div>
          )}

          {warningCount > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 text-orange-800 px-3 py-1 rounded-md">
              <AlertTriangle className="h-4 w-4" />
              <span>{warningCount} Warning</span>
            </div>
          )}

          {criticalCount === 0 && warningCount === 0 && (
            <div className="flex items-center gap-1 bg-green-50 text-green-800 px-3 py-1 rounded-md">
              <span>All predictions normal</span>
            </div>
          )}
        </div>
      )}

      {predictions.length === 0 ? (
        <div className="text-center p-4 border border-dashed rounded-md">Awaiting sensor data...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {predictions.slice(0, 24).map((pred, index) => (
            <div key={index} className="text-center">
              <div className="mb-1 text-xs">T+{index + 1}</div>
              <Progress value={pred.prediction * 100} className={`h-2 ${getColorClass(pred.prediction)}`} />
              <div className="mt-1 text-xs font-medium">{(pred.prediction * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
