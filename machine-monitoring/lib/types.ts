// Machine metadata
export interface Machine {
  machine_id: number
  machine_label: string
  machine_model_id: number
  machine_type_id: number
  box_macaddress: string
  installation_date: string
  working: boolean
  is_active?: boolean // Optional property for UI state
}

// Real-time sensor data
export interface SensorData {
  machine_id: number
  timestamp: string
  temperature: number
  vibration: number
  load: number
  cycle_time: number
  power_consumption: number
  humidity: number
  temperature_external: number
  power_fluctuation: number
  working_hours: number
  error_code: number | null
  experience_years: number
  shift: number
  session_start: number
  session_end: number
  maintenance_status_id: number
  maintenance_duration: number
  interaction_count: number
  recent_changes: string
  machine_type: number
  machine_model: string
  brand: string
  installation_date: string
  active: boolean
  environment_id: number
  session_id: number
  interaction_id: number
  maintenance_task_id: number
  maintenance_template_id: number
}

// Streaming sensor data (simplified version)
export interface StreamingSensorData {
  timestamp: string
  temperature: number
  vibration: number
  load: number
  power_consumption: number
}

// AI prediction
export interface Prediction {
  timestamp: string
  prediction: number
  confidence: number
}

// Notification
export interface Notification {
  type: "warning" | "critical"
  message: string
  timestamp: Date
}
