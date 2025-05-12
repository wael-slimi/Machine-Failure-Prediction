// Machine metadata
export interface Machine {
  machine_id: number
  machine_label: string
  machine_model_id: number
  machine_type_id: number
  box_macaddress: string
  installation_date: string
  working: boolean
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
  error_code: number
  experience_years: number
  shift: number
  session_start: number
  session_end: number
  maintenance_status: number
  maintenance_duration: number
  interaction_count: number
  recent_changes: number
  machine_type: number
  machine_model: number
  brand: number
  installation_date: number
  active: number
  environment_id: number
  session_id: number
  interaction_id: number
  maintenance_task_id: number
  maintenance_template_id: number
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
