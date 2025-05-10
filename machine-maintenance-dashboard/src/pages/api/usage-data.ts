import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json([
    {
      machine_id: 'M001',
      timestamp: '2025-05-09T10:00:00Z',
      temperature: 75.5,
      vibration: 0.02,
      load: 80,
      cycle_time: 120,
      power_consumption: 150,
    },
    {
      machine_id: 'M002',
      timestamp: '2025-05-09T10:05:00Z',
      temperature: 76.0,
      vibration: 0.03,
      load: 85,
      cycle_time: 125,
      power_consumption: 160,
    },
  ]);
}