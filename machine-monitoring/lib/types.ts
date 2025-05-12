// Machine metadata
export interface Machine {
  machine_id: number
  machine_label: string
  installation_date: string
  is_active: boolean
}

// Real-time sensor data
export interface SensorData {
  machine_id: number
  timestamp: string
  temperature: number
  vibration: number
  load: number
  power: number
}

// AI prediction
export interface Prediction {
  prediction: number
}

// Notification
export interface Notification {
  type: "warning" | "critical"
  message: string
  timestamp: Date
}
