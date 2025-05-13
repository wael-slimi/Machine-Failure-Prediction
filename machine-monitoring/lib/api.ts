import type { SensorData, Prediction } from "./types"

// Base API URL - would typically come from environment variables
const API_BASE_URL = 'http://localhost:5000/api';  // Updated to include /api prefix

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

// Add MachinesResponse interface
export interface MachinesResponse {
  machines: Machine[];
}

export interface Machine {
  machine_id: number;
  machine_label: string;
  machine_model_id: number;
  machine_type_id: number;
  box_macaddress: string;
  installation_date: string;
  working: boolean;
}

// Updated API functions
export async function fetchMachines(): Promise<MachinesResponse> {
  return apiRequest<MachinesResponse>('/dashboard/machines')
}

export async function fetchMachineById(machineId: number): Promise<Machine> {
  return apiRequest<Machine>(`/dashboard/machines/${machineId}`)
}

export async function fetchSensorData(machineId: number): Promise<SensorData[]> {
  return apiRequest<SensorData[]>(`/simulation/data/${machineId}`)
}

export async function getPredictions(): Promise<Prediction[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/simulation/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to get predictions');
    }
    const data: Prediction[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting predictions:', error);
    throw error;
  }
}

// Export the API object
export const api = {
  getMachines: fetchMachines,
  getMachineById: fetchMachineById,
  getSensorData: fetchSensorData,
  runSimulation: getPredictions,
}