import type { Machine, SensorData, Prediction } from "./types"

// Base API URL - would typically come from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Maximum number of retries for failed requests
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Custom error type for API errors
class APIError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function for API requests with retry logic
async function apiRequest<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: "include",
      mode: "cors",
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        errorData.message || `API error: ${response.status}`,
        response.status
      )
    }

    return response.json()
  } catch (error) {
    // Retry on network errors or 5xx server errors
    if (retryCount < MAX_RETRIES && 
        (error instanceof TypeError || // Network error
         (error instanceof APIError && error.status && error.status >= 500))) { // Server error
      await delay(RETRY_DELAY * Math.pow(2, retryCount)) // Exponential backoff
      return apiRequest<T>(endpoint, options, retryCount + 1)
    }
    throw error
  }
}

// API response types
interface SensorDataResponse {
  machine_id: number
  data_points: SensorData[]
  latest_update: string
}

// API functions
export async function fetchMachines(): Promise<Machine[]> {
  return apiRequest<Machine[]>('/dashboard/machines')
}

export async function fetchMachineById(machineId: number): Promise<Machine> {
  return apiRequest<Machine>(`/dashboard/machines/${machineId}`)
}

export async function fetchSensorData(machineId: number): Promise<SensorData[]> {
  // The backend now returns the array directly
  return apiRequest<SensorData[]>(`/simulation/data/${machineId}`)
}

export async function fetchPredictions(machineId: number): Promise<Prediction[]> {
  const response = await apiRequest<{ predictions: Prediction[] }>('/simulation/simulate', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ machine_id: machineId }),
  })
  return response.predictions
}

// Export the API object
export const api = {
  getMachines: fetchMachines,
  getMachineById: fetchMachineById,
  getSensorData: fetchSensorData,
  runSimulation: (machineId: number = 5000) => fetchPredictions(machineId),
}
