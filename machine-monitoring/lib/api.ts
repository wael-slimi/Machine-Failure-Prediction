import type { Machine, SensorData, Prediction } from "./types"

// Base API URL - would typically come from environment variables
const API_BASE_URL = "http://localhost:5000/api"

// Helper function for API requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error)
    throw error
  }
}

// API functions
export async function fetchMachines(): Promise<Machine[]> {
  // For demo purposes, we'll generate mock data
  // In a real app, this would be: return apiRequest<Machine[]>('/dashboard/machines');

  return mockMachines
}

export async function fetchMachineById(machineId: number): Promise<Machine> {
  // In a real app: return apiRequest<Machine>(`/dashboard/machines/${machineId}`);

  const machine = mockMachines.find((m) => m.machine_id === machineId)
  if (!machine) {
    throw new Error(`Machine with ID ${machineId} not found`)
  }
  return machine
}

export async function fetchSensorData(machineId: number): Promise<SensorData> {
  // In a real app: return apiRequest<SensorData>(`/simulation/data/${machineId}`);

  // Generate random sensor data for demo
  return {
    machine_id: machineId,
    timestamp: new Date().toISOString(),
    temperature: 20 + Math.random() * 30,
    vibration: Math.random() * 5,
    load: 30 + Math.random() * 50,
    power: 5 + Math.random() * 10,
  }
}

export async function fetchPredictions(machineId: number): Promise<Prediction[]> {
  // In a real app: return apiRequest<Prediction[]>('/simulation/simulate', {
  //   method: 'POST',
  //   body: JSON.stringify({ machine_id: machineId }),
  // });

  // Generate mock predictions for demo
  const predictions: Prediction[] = []
  for (let i = 0; i < 24; i++) {
    // Make predictions gradually increase for demo purposes
    const baseValue = Math.min(0.2 + i * 0.03, 0.9)
    // Add some randomness
    const randomFactor = Math.random() * 0.2 - 0.1 // -0.1 to 0.1

    predictions.push({
      prediction: Math.max(0, Math.min(1, baseValue + randomFactor)),
    })
  }

  return predictions
}

// Mock data for demo purposes
const mockMachines: Machine[] = [
  {
    machine_id: 1,
    machine_label: "Machine 1",
    installation_date: "2025-01-15",
    is_active: true,
  },
  {
    machine_id: 2,
    machine_label: "Machine 2",
    installation_date: "2025-02-20",
    is_active: true,
  },
  {
    machine_id: 3,
    machine_label: "Machine 3",
    installation_date: "2025-03-10",
    is_active: false,
  },
  {
    machine_id: 4,
    machine_label: "Machine 4",
    installation_date: "2025-04-05",
    is_active: true,
  },
  {
    machine_id: 5,
    machine_label: "Machine 5",
    installation_date: "2025-05-01",
    is_active: true,
  },
]
