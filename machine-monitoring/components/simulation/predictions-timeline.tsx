"use client"

import { useState, useEffect } from "react"
import { fetchPredictions } from "@/lib/api"
import type { Prediction } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function PredictionsTimeline({ machineId }: { machineId: number }) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchPredictions(machineId)
        setPredictions(data || [])
      } catch (err) {
        console.error("Failed to load predictions", err)
        setError(err instanceof Error ? err.message : "Failed to load predictions")
        setPredictions([])
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

  const getStatusText = (value: number) => {
    if (value > 0.8) return "Critical"
    if (value > 0.5) return "Warning"
    return "Normal"
  }

  if (loading) {
    return <div className="text-center p-4">Loading predictions...</div>
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">Failure probability for the next 24 time steps (hours)</p>

      {!predictions || predictions.length === 0 ? (
        <div className="text-center p-4 border border-dashed rounded-md">Awaiting sensor data...</div>
      ) : (
        <TooltipProvider>
          <div className="flex flex-wrap gap-1">
            {predictions.slice(0, 24).map((pred, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-6 bg-gray-100 rounded-sm relative">
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-sm ${getColorClass(pred.prediction)}`}
                        style={{ height: `${pred.prediction * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1">{index + 1}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-sm">
                    <div>Hour {index + 1}</div>
                    <div>Score: {(pred.prediction * 100).toFixed(0)}%</div>
                    <div>Status: {getStatusText(pred.prediction)}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}

      <div className="flex justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs">Normal (≤ 50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-400"></div>
          <span className="text-xs">Warning (51-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs">Critical (&gt; 80%)</span>
        </div>
      </div>
    </div>
  )
}
